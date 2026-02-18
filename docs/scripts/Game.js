import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { Deck } from './Deck.js';
import { Hand } from './Hand.js';
import { Player } from './Player.js';

export class Game {
    constructor() {
        // Player Data
        this.player = new Player(() => this.updateMoneyDisplay());
        this.login();
        // Deck & Hands
        this.deck = new Deck();
        this.playerHand = new Hand(true);
        this.dealerHand = new Hand();
        this.gameActive = false;
        // UI Elements
        this.playerCardSection = document.getElementById('playerCardSection');
        this.dealerCardSection = document.getElementById('dealerCardSection');
        this.hitButton = document.getElementById('hit');
        this.standButton = document.getElementById('stand');
        this.moneyDisplay = document.getElementById('money');
        this.playerValueDisplay = document.getElementById('playerHandValue');
        this.dealerValueDisplay = document.getElementById('dealerHandValue');
        this.roundOverSection = document.getElementById('roundOverSection');
        this.roundResultDisplay = document.getElementById('roundResult');
        this.loginMenuBtn = document.getElementById('LoginMenuBtn');
        this.loginSection = document.getElementById('loginSection');
        this.loginXBtn = document.getElementById('loginXBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        // Event Listeners
        this.setupNewHandListener();
        this.setupAuthStateListener();
    }

    setupAuthStateListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User signed in:", user.email);
                this.loginMenuBtn.textContent = "Logout";
                this.loginMenuBtn.onclick = () => this.logout();
            } else {
                this.loginMenuBtn.textContent = "Login";
                this.loginMenuBtn.onclick = () => {
                    if (this.loginSection.style.display === 'flex') {
                        this.loginSection.style.display = 'none';
                    } else {
                        this.loginSection.style.display = 'flex';
                    }
                };
            }
        });
    }

    logout() {
        signOut(auth).then(() => {
            // Optionally, reset UI or show a message
            this.loginSection.style.display = 'none';
            this.player.resetData();
            this.start();
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }

    start() {
        this.gameActive = true;
        // Reset game state if needed
        this.deck.reset();
        this.playerHand.clear();
        this.dealerHand.clear();
        this.clearScreen();
        // Initial deal
        this.displayCard(this.deck.drawCard(), this.playerHand);
        this.displayCard(this.deck.drawCard(), this.dealerHand, true);// Dealer's first card is hidden
        this.displayCard(this.deck.drawCard(), this.playerHand);
        this.displayCard(this.deck.drawCard(), this.dealerHand);
        // Update hand values
        this.updateHandValues(this.playerHand);
        this.updateHandValues(this.dealerHand);
        this.updateMoneyDisplay();
        // Enable buttons and set up event listeners
        this.hitButton.disabled = false;
        this.standButton.disabled = false;
        this.hitButton.onclick = () => this.hit();
        this.standButton.onclick = () => this.stand();
        this.loginXBtn.onclick = () => this.loginSection.style.display = 'none';
    }

    end(result, action, betAmount) {
        // Update player data based on result
        this.player.action(action, betAmount);
        //display dealer hand
        this.revealHiddenCards();
        this.updateHandValues(this.dealerHand);
        // set state to ended and update UI
        this.gameActive = false;
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
        this.roundOverSection.style.display = 'flex';
        this.roundResultDisplay.textContent = result;
    }

    displayCard(card, hand, hidden = false) {
        let containerSelector = '';
        if (hand instanceof Hand) {
            if (hand.isPlayer) {
                this.playerHand.addCard(card);
                containerSelector = '#playerCardSection';
            }
            else {
                this.dealerHand.addCard(card, hidden);
                containerSelector = '#dealerCardSection';
            }
            this.updateHandValues(hand);
        }
        else {
            return console.error("Error DisplayCard(): Invalid hand type");
        }
        const container = document.querySelector(containerSelector);
        const img = document.createElement('img');
        img.className = 'cardImage';
        img.src = card.getImage();
        if (hidden) {
            img.alt = "Hidden Card";
        }
        else {
            img.alt = card.rank;
        }
        container.appendChild(img);
    };

    clearScreen() {
        this.playerCardSection.innerHTML = '';
        this.dealerCardSection.innerHTML = '';
        this.playerValueDisplay.textContent = "Player's Hand: ";
        this.dealerValueDisplay.textContent = "Dealer's Hand: ";
        this.roundOverSection.style.display = 'none';
    }

    hit() {
        if (!this.gameActive) return;
        this.displayCard(this.deck.drawCard(), this.playerHand);
        if (this.playerHand.isBust()) {
            this.end('You bust! Dealer wins.', 0, 10);
        }
    }

    stand() {
        if (!this.gameActive) return;
        this.revealHiddenCards();
        // Dealer's turn
        while (this.dealerHand.getValue() < 17) {
            this.displayCard(this.deck.drawCard(), this.dealerHand);
        }
        this.updateHandValues(this.dealerHand);
        if (this.dealerHand.isBust()) {
            this.end('Dealer busts! You win!', 1, 10);
        }
        else if (this.playerHand.getValue() > this.dealerHand.getValue()) {
            this.end('You win!', 1, 10);

        }
        else if (this.playerHand.getValue() < this.dealerHand.getValue()) {
            this.end('Dealer wins.', 0, 10);

        }
        else {
            this.end("It's a tie!", 2, 10);

        }
        this.gameActive = false;
    }

    setupNewHandListener() {
        document.getElementById('newHand').onclick = () => {
            this.roundOverSection.style.display = 'none';
            this.start();
            this.updateMoneyDisplay();
        };
    }

    updateHandValues(hand) {
        if (hand instanceof Hand) {
            if (hand.isPlayer) {
                this.playerValueDisplay.textContent = `Player's Hand: ${hand.getValue()}`;
            }
            else {
                this.dealerValueDisplay.textContent = `Dealer's Hand: ${hand.getValue()}`;
            }
        }
        else {
            return console.error("Error UpdateHandValues(): Invalid hand type");
        }
    }

    revealHiddenCards() {
        for (let card of this.dealerHand.cards) {
            if (card.hidden) {
                card.reveal();
                const img = document.querySelector(`#dealerCardSection img[alt="Hidden Card"]`);
                img.src = card.getImage();
            }
        }
    }

    login() {
        document.getElementById('loginXBtn').onclick = () => {
            this.loginSection.style.display = 'none';
        };
        document.getElementById('loginBtn').onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('authMessage');
            try {
                await signInWithEmailAndPassword(auth, email, password);
                msg.textContent = "Login successful!";
                msg.style.color = "green";
            } catch (error) {
                msg.textContent = error.message;
                msg.style.color = "red";
            }
        };

        document.getElementById('registerBtn').onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('authMessage');
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                msg.textContent = "Registration successful!";
                msg.style.color = "green";
            } catch (error) {
                msg.textContent = error.message;
                msg.style.color = "red";
            }
        };
    }

    updateMoneyDisplay() {
        this.moneyDisplay.textContent = `Money: ${this.player.money}`;
    }
}