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
        this.playerHands = []; // Always an array of Hand objects
        this.activeHandIndex = 0;

        this.playerBet = null;
        this.originalBet = null;
        this.gameActive = false;

        this.ui.bindGameEvents(this);
        this.ui.bindAuthEvents(auth);
        this.auth.init(this);
    }

    get currentHand() {
        return this.playerHands[this.activeHandIndex];
    }

    // Initializes a new round with a single player hand.
    async start() {
        this.gameActive = true;
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

        const canDouble = this.player.money >= this.playerBet + this.originalBet;
        if (this.playerHands[0].canSplit() && canDouble) this.ui.showSplitButton();
        if (canDouble) this.ui.enableDoubleButton();
    }

    async drawCard(hand, hidden = false) {
        const card = this.deck.drawCard();
        hand.addCard(card, hidden);
        this.ui.renderCard(card, hand, hidden);
        await this.delay(400);
        this.ui.updateHandValue(hand, hand.getValue(), this);
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
        if (!this.gameActive || this.player.money < this.playerBet * 2) return;

        // Double the bet for this specific hand resolution logic
        // Note: For simplicity, this assumes the double applies to the whole round bet.
        this.playerBet += this.originalBet;
        console.log("Double clicked, originalBet: ", this.originalBet, "new bet: ", this.playerBet);
        await this.drawCard(this.currentHand);
        await this.advanceOrResolve();
    }

    async split() {
        if (!this.gameActive || !this.playerHands[0].canSplit()) return;

        this.ui.hideSplitButton();

        const card1 = this.playerHands[0].cards[0];
        const card2 = this.playerHands[0].cards[1];

        const h1 = new Hand(true);
        const h2 = new Hand(true);
        h1.isSplitHand = h2.isSplitHand = true;

        h1.addCard(card1);
        h2.addCard(card2);

        this.playerHands = [h1, h2];
        this.ui.renderSplitLayout(h1, h2);

        await this.drawCard(this.playerHands[0]);
        await this.drawCard(this.playerHands[1]);
        this.ui.highlightSplitHand(0);
    }

    // --- Flow Control ---

    async advanceOrResolve() {
        // If there's another hand in the array, move to it
        if (this.playerHands[this.activeHandIndex + 1]) {
            this.activeHandIndex++;
            this.ui.highlightSplitHand(this.activeHandIndex);
        } else {
            // No more hands, dealer's turn
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
            return { action, message: `${label}${status}` };
        });

        this.end(results);
    }

    end(results) {
        this.gameActive = false;

        const combinedData = results
            .map(r => this.player.action(r.action, this.playerBet))
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

    reset() {
        this.gameActive = false;
        this.playerBet = null;
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

    delay(ms) { 
        return new Promise(res => setTimeout(res, ms)); 
    }
}