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

        this.ui.bindGameEvents(this);
        this.ui.bindAuthEvents(auth);
        this.auth.init(this);
    }

    async start() {
        //reset
        this.gameActive = true;
        //initial deal
        this.drawCard(this.dealerHand, true);
        this.drawCard(this.playerHand);
        await this.delay(1000);
        this.drawCard(this.dealerHand);
        this.drawCard(this.playerHand);

        this.ui.updatePlayerData(this.player);
    }

    reset() {
        this.gameActive = false;
        this.playerBet = null;

        this.playerHand.clear();
        this.dealerHand.clear();
        this.deck.reset();

        this.ui.clearCards();
        this.ui.disableGameButtons();
        this.ui.hideRoundOver();
        this.ui.hideGameOver();
        this.ui.showBetSection();
    }

    async drawCard(hand, hidden = false) {
        const card = this.deck.drawCard();
        hand.addCard(card, hidden);
        this.ui.renderCard(card, hand, hidden);
        await this.delay(1000);
        this.ui.updateHandValue(hand, hand.getValue());
    }

    hit() {
        if (!this.gameActive) return;

        this.drawCard(this.playerHand);

        if (this.playerHand.isBust()) {
            this.ui.revealDealerHiddenCard(this.dealerHand);
            this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue());
            this.end("You bust! Dealer wins.", 0);
        }
    }

    async stand() {
        if (!this.gameActive) return;

        //dealers turn
        this.ui.revealDealerHiddenCard(this.dealerHand);
        this.ui.updateHandValue(this.dealerHand, this.dealerHand.getValue());
        await this.delay(200);
        while (this.dealerHand.getValue() < 17) {
            this.drawCard(this.dealerHand);
            await this.delay(1000);
        }
        //win logic
        const playerVal = this.playerHand.getValue();
        const dealerVal = this.dealerHand.getValue();

        if (this.dealerHand.isBust() || playerVal > dealerVal)
            this.end("You win!", 1);
        else if (playerVal < dealerVal)
            this.end("Dealer wins.", 0);
        else
            this.end("It's a tie!", 2);
    }

    end(message, action) {
        const roundData = this.player.action(action, this.playerBet);
        this.gameActive = false;
        if (roundData.lost === true) {
            this.ui.showGameOver();
        }
        else {
            this.ui.showRoundOver(message, roundData);
        }
        this.auth.savePlayerData(this.player, this.auth.currentUid);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}