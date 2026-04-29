import { Deck } from "./Deck.js";
import { Hand } from "./Hand.js";
import { Player } from "./Player.js";

export class Game {
    constructor(ui, auth) {
        this.ui = ui;
        this.auth = auth;

        this.player = new Player((amount) => {
            this.ui.updatePlayerData(this.player);
            this.ui.showMoneyPopup(amount);
        });

        this.deck = new Deck();
        this.dealerHand = new Hand();
        this.playerHands = [];
        this.activeHandIndex = 0;

        this.originalBet = null;
        this.totalBet = null;
        this.handBets = [];
        this.gameActive = false;

        this.activeAbilities = {};

        // Redraw tracking
        this.redrawsAvailable = 0;
        this.redrawsUsed = 0;

        this.ui.bindGameEvents(this);
        this.ui.bindAuthEvents(auth);
        this.auth.init(this);
    }

    get currentHand() {
        return this.playerHands[this.activeHandIndex];
    }

    async start() {
        this.gameActive = true;

        // Get active abilities from store
        this.activeAbilities = this.ui.store.getActiveAbilities();

        // Initialize redraws for this hand
        this.redrawsAvailable = this.ui.store.hasRedraws();
        this.redrawsUsed = 0;
        const deckAbilities = this.activeAbilities.deck;

        // Create deck with ability modifiers
        this.deck = new Deck(deckAbilities);

        this.playerHands = [new Hand(true)];
        this.activeHandIndex = 0;

        await this.drawCard(this.dealerHand, true);
        await this.delay(500);
        await this.drawCard(this.playerHands[0]);
        await this.delay(500);
        await this.drawCard(this.dealerHand);
        await this.delay(500);
        await this.drawCard(this.playerHands[0]);

        this.ui.updatePlayerData(this.player);
        this.ui.enableGameButtons();

        const canDouble = this.player.money >= this.handBets[this.activeHandIndex] + this.originalBet;
        if (this.playerHands[0].canSplit() && canDouble) this.ui.showSplitButton();
        if (canDouble) this.ui.enableDoubleButton();
    }

    async drawCard(hand, hide = false) {
        let card = this.deck.drawCard();
        card.hidden = hide;

        // Apply dealer abilities that affect card draws
        card = this.applyDealerAbilities(card, hand);

        hand.addCard(card, card.hidden);
        this.ui.renderCard(card, hand, card.hidden, hand.cards.length - 1);
        await this.delay(400);
        this.ui.updateHandValue(hand, hand.getValue(), this);
    }

    async redrawCard(hand, cardIndex) {
        if (this.redrawsUsed >= this.redrawsAvailable) {
            return; // No redraws available
        }

        // Remove the card at the index
        hand.removeCard(cardIndex);
        this.ui.removeCardFromRender(hand, cardIndex);
        await this.delay(200);

        // Draw a new card
        let card = this.deck.drawCard();
        card = this.applyDealerAbilities(card, hand);
        hand.addCard(card);
        this.ui.renderCard(card, hand, false, hand.cards.length - 1);
        await this.delay(400);

        this.redrawsUsed++;
        this.ui.updateHandValue(hand, hand.getValue(), this);

        // Recheck if split is now possible after redraw
        if (hand.isPlayer && hand === this.playerHands[0] && hand.canSplit() && this.redrawsUsed < this.redrawsAvailable) {
            const canDouble = this.player.money >= this.totalBet + this.originalBet;
            if (canDouble) {
                this.ui.showSplitButton();
            }
        }
    }

    // --- Player Actions ---

    async hit() {
        if (!this.gameActive) return;
        this.ui.hideSplitButton();
        this.ui.disableDoubleButton();

        await this.drawCard(this.currentHand);

        if (this.currentHand.isBust()) {
            await this.advanceOrResolve();
        }
    }

    async stand() {
        if (!this.gameActive) return;
        this.ui.hideSplitButton();
        this.ui.disableDoubleButton();
        await this.advanceOrResolve();
    }

    async double() {
        if (!this.gameActive) return;
        if (this.player.money < this.totalBet + this.originalBet) return;

        this.ui.disableDoubleButton();
        this.ui.hideSplitButton();
        this.handBets[this.activeHandIndex] += this.originalBet;
        this.totalBet += this.originalBet;
        await this.drawCard(this.currentHand);
        await this.advanceOrResolve();
    }

    async split() {
        if (!this.gameActive || !this.playerHands[0].canSplit() || this.player.money < this.totalBet + this.originalBet) return;

        this.totalBet += this.originalBet;

        this.ui.hideSplitButton();

        const card1 = this.playerHands[0].cards[0];
        const card2 = this.playerHands[0].cards[1];

        const h1 = new Hand(true);
        const h2 = new Hand(true);
        h1.isSplitHand = h2.isSplitHand = true;

        h1.addCard(card1);
        h2.addCard(card2);

        this.playerHands = [h1, h2];
        this.handBets = [this.originalBet, this.originalBet];
        this.ui.renderSplitLayout(h1, h2);

        await this.drawCard(this.playerHands[0]);
        await this.drawCard(this.playerHands[1]);
        this.ui.highlightSplitHand(0);
    }

    // --- Flow Control ---

    async advanceOrResolve() {
        if (this.playerHands[this.activeHandIndex + 1]) {
            this.activeHandIndex++;
            this.ui.highlightSplitHand(this.activeHandIndex);
            if (this.player.money >= this.totalBet + this.originalBet && this.currentHand.cards.length === 2) {
                this.ui.enableDoubleButton();
            }
        } else {
            await this.finalizeRound();
        }
    }

    async finalizeRound() {
        const anyActive = this.playerHands.some(hand => !hand.isBust());

        if (anyActive) {
            this.ui.revealDealerHiddenCard(this.dealerHand);
            this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue(), this);
            while (this.dealerHand.getValue() < 17) {
                await this.drawCard(this.dealerHand);
                await this.delay(500);
            }
        } else {
            this.ui.revealDealerHiddenCard(this.dealerHand);
            this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue(), this);
        }

        this.resolveAll();
    }

    resolveAll() {
        const dVal = this.dealerHand.getValue();
        const dBust = this.dealerHand.isBust();

        const results = this.playerHands.map((hand, i) => {
            const pVal = hand.getValue();
            let action, status;

            if (hand.isBust()) { action = 0; status = "Bust"; }
            else if (dBust || pVal > dVal) { action = 1; status = "Win!"; }
            else if (pVal < dVal) { action = 0; status = "Dealer wins"; }
            else { action = 2; status = "Tie"; }

            const label = this.playerHands.length > 1 ? `Hand ${i + 1}: ` : "";
            return { action, message: `${label}${status}`, handIndex: i };
        });

        this.end(results);
    }

    end(results) {
        this.gameActive = false;

        // Apply theme ability modifiers to each result
        const combinedData = results
            .map((r, i) => {
                const modifiedResult = this.applyThemeAbilityModifiers(r.action, this.handBets[i]);
                return this.player.action(modifiedResult.action, modifiedResult.betAmount, this.ui.store);
            })
            .reduce((acc, curr) => ({
                bet: acc.bet + curr.bet,
                bonus: acc.bonus + curr.bonus,
                moneyChange: acc.moneyChange + curr.moneyChange,
                multiplierChange: acc.multiplierChange + curr.multiplierChange,
                xp: acc.xp + curr.xp,
                lost: acc.lost || curr.lost
            }));

        const finalMsg = results.map(r => r.message).join(" | ");

        if (combinedData.lost) {
            this.ui.showGameOver();
        } else {
            this.ui.showRoundOver(finalMsg, { ...combinedData, isSplit: this.playerHands.length > 1 });
        }

        this.auth.savePlayerData(this.player, this.auth.currentUid);
    }

    async reset() {
        // Apply any pending equipment changes from the store BEFORE starting new hand
        if (this.ui.store && this.ui.store.hasPendingChanges()) {
            // Commit pending changes (applies them to equipped state)
            this.ui.store.commitPendingEquipment();
            
            // Save committed changes to database
            if (this.auth && this.auth.currentUid) {
                await this.ui.store.saveToDb(this.auth.currentUid);
            }
            
            // Apply visual changes for committed equipment
            const equippedTheme = this.ui.store.getEquipped('themes');
            this.ui.setItem('themes', equippedTheme);
            
            // Update player data to reflect any deck payout modifiers
            this.ui.updatePlayerData(this.player);
            
            // Re-render store UI to reflect new equipment
            this.ui.renderStoreItems();
        }

        this.gameActive = false;
        this.totalBet = null;
        this.originalBet = null;
        this.handBets = [];
        this.playerHands = [];
        this.activeHandIndex = 0;
        this.dealerHand.clear();
        this.deck.reset();
        this.ui.clearCards();
        this.ui.disableGameButtons();
        this.ui.disableDoubleButton();
        this.ui.hideSplitButton();
        this.ui.hideRoundOver();
        this.ui.hideGameOver();
        this.ui.showBetSection();
    }

    // --- Ability Application Methods ---
    applyDealerAbilities(card, hand) {
        const dealerAbilities = this.activeAbilities?.dealer;
        if (!dealerAbilities) return card;

        // Fortune Teller: 50% Dealer's cards are drawn face up
        if (dealerAbilities.dealerFirst?.type === 'revealFirstCard' && !hand.isPlayer && hand.cards.length === 0) {
            if (Math.random() < dealerAbilities.dealerFirst.chance) {
                card.hidden = false;
                console.log('Fortune Teller: Card revealed for dealer')
            }
        }

        // Ice King: Constrain first dealer card to 2-6
        if (dealerAbilities.dealerFirst?.type === 'constrainFirstCard' && hand.cards.length === 0 && !hand.isPlayer) {
            const min = dealerAbilities.dealerFirst.min;
            const max = dealerAbilities.dealerFirst.max;
            if (card.getValue() < min || card.getValue() > max) {
                const validRanks = [];
                for (let i = min; i <= max; i++) {
                    validRanks.push(String(i));
                }
                card.rank = validRanks[Math.floor(Math.random() * validRanks.length)];
                console.log('Ice King: card 2-6 applied for dealer');
            }
        }

        // Gold Hands: When a face card is drawn, you get a bonus (15% of bet)
        if (dealerAbilities.onCardDraw?.type === 'faceCardBonus') {
            if (card.getValue() >= 10) {
                const bonus = Math.floor(this.handBets[this.activeHandIndex] * dealerAbilities.onCardDraw.bonus);
                this.player.money += bonus;
                this.ui.updatePlayerData(this.player);
                this.ui.showMoneyPopup(bonus, true);
                console.log('Gold Hands: Face card bonus applied');
            }
        }

        // Humble Hands: When a card below 5 is drawn, you get a bonus (15% of bet)
        if (dealerAbilities.onCardDraw?.type === 'numberedCardBonus') {
            if (card.getValue() < 5) {
                const bonus = Math.floor(this.handBets[this.activeHandIndex] * dealerAbilities.onCardDraw.bonus);
                this.player.money += bonus;
                this.ui.updatePlayerData(this.player);
                this.ui.showMoneyPopup(bonus, true);
                console.log('Humble Hands: Numbered card bonus applied');
            }
        }

        return card;
    }

    // Apply theme ability modifiers to round results
    applyThemeAbilityModifiers(action, betAmount) {
        const themeAbilities = this.activeAbilities?.theme;
        let modifiedAction = action;
        let modifiedBetAmount = betAmount;

        if (!themeAbilities) {
            return { action: modifiedAction, betAmount: modifiedBetAmount };
        }

        // Gambler: Keep 25% of bet on loss
        if (themeAbilities.onLoss?.type === 'keepBetPercentage' && action === 0) {
            const keepAmount = Math.floor(betAmount * themeAbilities.onLoss.value);
            modifiedBetAmount = betAmount - keepAmount;
        }

        // Lucky Streak: Bonus on 3 wins, penalty on 2 losses
        if (themeAbilities.onWin?.type === 'streakBonus' && action === 1) {
            this.player.abilityStates.luckyStreakWins++;
            if (this.player.abilityStates.luckyStreakWins >= themeAbilities.onWin.winsRequired) {
                if (this.player.abilityStates.nextWinBoosted) {
                    modifiedBetAmount = Math.floor(betAmount * (1 + themeAbilities.onWin.bonus));
                    this.player.abilityStates.nextWinBoosted = false;
                    this.player.abilityStates.luckyStreakWins = 0;
                } else {
                    this.player.abilityStates.nextWinBoosted = true;
                }
            }
        }
        else if (themeAbilities.onLoss?.type === 'streakPenalty' && action === 0) {
            this.player.abilityStates.luckyStreakLosses++;
            if (this.player.abilityStates.luckyStreakLosses >= themeAbilities.onLoss.lossesRequired) {
                if (this.player.abilityStates.nextLossPenalized) {
                    modifiedBetAmount = Math.floor(betAmount * (1 + themeAbilities.onLoss.penalty));
                    this.player.abilityStates.nextLossPenalized = false;
                    this.player.abilityStates.luckyStreakLosses = 0;
                } else {
                    this.player.abilityStates.nextLossPenalized = true;
                }
            }
        }

        return { action: modifiedAction, betAmount: modifiedBetAmount };
    }

    delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
}