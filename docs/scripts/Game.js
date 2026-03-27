// Game.js
import { Deck } from "./Deck.js";
import { Hand } from "./Hand.js";
import { Player } from "./Player.js";

export class Game {
    constructor(ui, auth) {
        this.ui = ui;
        this.auth = auth;

        this.player = new Player((popupAmount) => {
            this.ui.updatePlayerData(this.player);
            this.ui.showMoneyPopup(popupAmount);
        });

        this.deck = new Deck();
        this.playerHand = new Hand(true);
        this.dealerHand = new Hand();

        this.playerBet = null;
        this.gameActive = false;

        // Split state
        this.splitHands = [];      // Array of Hand objects when split is active
        this.activeHandIndex = 0;  // Which split hand the player is currently playing
        this.isSplit = false;

        this.ui.bindGameEvents(this);
        this.ui.bindAuthEvents(auth);
        this.auth.init(this);
    }

    get currentHand() {
        return this.isSplit ? this.splitHands[this.activeHandIndex] : this.playerHand;
    }

    async start() {
        this.gameActive = true;

        // Initial deal
        this.drawCard(this.dealerHand, true);
        await this.delay(1000);
        this.drawCard(this.playerHand);
        await this.delay(1000);
        this.drawCard(this.dealerHand);
        await this.delay(1000);
        await this.drawCard(this.playerHand);

        this.ui.updatePlayerData(this.player);

        // Show split button if the opening two cards allow it
        if (this.playerHand.canSplit() && this.player.money >= this.playerBet) {
            this.ui.showSplitButton();
        }
    }

    reset() {
        this.gameActive = false;
        this.playerBet = null;

        this.playerHand.clear();
        this.dealerHand.clear();
        this.deck.reset();

        this.splitHands = [];
        this.activeHandIndex = 0;
        this.isSplit = false;

        this.ui.clearCards();
        this.ui.disableGameButtons();
        this.ui.hideSplitButton();
        this.ui.hideRoundOver();
        this.ui.hideGameOver();
        this.ui.showBetSection();
    }

    async drawCard(hand, hidden = false) {
        const card = this.deck.drawCard();
        hand.addCard(card, hidden);
        this.ui.renderCard(card, hand, hidden);
        await this.delay(500);
        this.ui.updateHandValue(hand, hand.getValue(), this);
    }

    async hit() {
        if (!this.gameActive) return;
        this.ui.hideSplitButton(); // can't split after hitting

        await this.drawCard(this.currentHand);

        if (this.currentHand.isBust()) {
            if (this.isSplit) {
                // Bust on this split hand, move to next or end
                await this.advanceSplitHand(`Hand ${this.activeHandIndex + 1} busts!`);
            } else {
                this.ui.revealDealerHiddenCard(this.dealerHand);
                this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue(), this);
                this.end("You bust! Dealer wins.", 0);
            }
        }
    }

    async stand() {
        if (!this.gameActive) return;
        this.ui.hideSplitButton();

        if (this.isSplit) {
            await this.advanceSplitHand(null);
            this.updateHandValue(this.pla)
        } else {
            await this.runDealerTurn();
            this.resolveNormalEnd();
        }
    }

    async split() {
        if (!this.gameActive) return;
        if (!this.playerHand.canSplit()) return;
        if (this.player.money < this.playerBet * 2) return;

        this.ui.hideSplitButton();
        this.isSplit = true;

        this.ui.updatePlayerData(this.player);

        // Build two new hands from the original two cards
        const hand1 = new Hand(true);
        const hand2 = new Hand(true);
        hand1.isSplitHand = true;
        hand2.isSplitHand = true;

        hand1.addCard(this.playerHand.cards[0]);
        hand2.addCard(this.playerHand.cards[1]);

        this.splitHands = [hand1, hand2];
        this.activeHandIndex = 0;

        // clear the single player section and build two columns
        this.ui.renderSplitLayout(hand1, hand2);

        // Deal one card to each split hand
        await this.drawCard(hand1);
        await this.delay(1000);
        await this.drawCard(hand2);

        // Highlight the active hand
        this.ui.highlightSplitHand(this.activeHandIndex);
        this.ui.updateHandValue(hand1, hand1.getValue(), this);
        this.ui.updateHandValue(hand2, hand2.getValue(), this);
    }

    /**
     * Called when the current split hand is done (bust or stand).
     */
    async advanceSplitHand(bustMessage) {
        if (this.activeHandIndex === 0) {
            // Move to the second hand
            this.activeHandIndex = 1;
            this.ui.highlightSplitHand(this.activeHandIndex);
        } else {
            // Both hands done — run dealer and resolve
            await this.runDealerTurn();
            this.resolveSplitEnd();
        }
    }

    async runDealerTurn() {
        this.ui.revealDealerHiddenCard(this.dealerHand);
        this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue(), this);
        await this.delay(200);
        while (this.dealerHand.getValue() < 17) {
            await this.drawCard(this.dealerHand);
            await this.delay(500);
        }
    }

    // ─── Round resolution ─────────────────────────────────────────────────────
    resolveNormalEnd() {
        const playerVal = this.playerHand.getValue();
        const dealerVal = this.dealerHand.getValue();

        if (this.dealerHand.isBust() || playerVal > dealerVal)
            this.end("You win!", 1);
        else if (playerVal < dealerVal)
            this.end("Dealer wins.", 0);
        else
            this.end("It's a tie!", 2);
    }

    resolveSplitEnd() {
        const dealerVal = this.dealerHand.getValue();
        const dealerBust = this.dealerHand.isBust();

        let totalMoneyChange = 0;
        let totalBonus = 0;
        let totalXp = 0;
        let totalMultChange = 0;
        const messages = [];
        let anyLoss = false;

        for (let i = 0; i < this.splitHands.length; i++) {
            const hand = this.splitHands[i];
            const handVal = hand.getValue();
            const label = `Hand ${i + 1}`;

            let action;
            if (hand.isBust()) {
                action = 0; // loss
                messages.push(`${label}: Bust.`);
            } else if (dealerBust || handVal > dealerVal) {
                action = 1; // win
                messages.push(`${label}: Win!`);
            } else if (handVal < dealerVal) {
                action = 0; // loss
                messages.push(`${label}: Dealer wins`);
            } else {
                action = 2; // tie
                messages.push(`${label}: Tie`);
            }

            // Process each hand with the per-hand bet
            const roundData = this.player.action(action, this.playerBet);
            totalMoneyChange += roundData.moneyChange;
            totalBonus += roundData.bonus;
            totalXp += roundData.xp;
            totalMultChange += roundData.multiplierChange;

            if (roundData.lost) anyLoss = true;
        }

        this.gameActive = false;
        this.auth.savePlayerData(this.player, this.auth.currentUid);

        if (anyLoss) {
            this.ui.showGameOver();
        } else {
            const summaryData = {
                bet: this.playerBet * 2,
                bonus: totalBonus,
                moneyChange: totalMoneyChange,
                multiplierChange: totalMultChange,
                xp: totalXp,
                isSplit: true
            };
            this.ui.showRoundOver(messages.join(' | '), summaryData);
        }
    }

    end(message, action) {
        const roundData = this.player.action(action, this.playerBet);
        this.gameActive = false;
        if (roundData.lost === true) {
            this.ui.showGameOver();
        } else {
            this.ui.showRoundOver(message, roundData);
        }
        this.auth.savePlayerData(this.player, this.auth.currentUid);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}