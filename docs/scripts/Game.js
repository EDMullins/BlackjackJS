import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { Deck } from './Deck.js';
import { Hand } from './Hand.js';
import { Player } from './Player.js';

export class Game {
    constructor() {
        // Player Data
        this.player = new Player(() => this.updateDataDisplay());
        // Deck & Hands
        this.deck = new Deck();
        this.playerHand = new Hand(true);
        this.dealerHand = new Hand();
        this.gameActive = false;
        this.playerBet = null;
        // UI Elements
        this.playerCardSection = document.getElementById('playerCardSection');
        this.dealerCardSection = document.getElementById('dealerCardSection');
        this.hitButton = document.getElementById('hit');
        this.standButton = document.getElementById('stand');
        this.moneyDisplay = document.getElementById('money');
        this.moneyPopup = document.getElementById('moneyPopup');
        this.playerValueDisplay = document.getElementById('playerHandValue');
        this.dealerValueDisplay = document.getElementById('dealerHandValue');
        this.roundOverSection = document.getElementById('roundOverSection');
        this.roundResultDisplay = document.getElementById('roundResult');
        this.betSection = document.getElementById('betSection');
        this.betInput = document.getElementById('bet');
        this.errorMsg = document.getElementById('errorMsg');
        this.betBtn = document.getElementById('betBtn');
        this.loginMenuBtn = document.getElementById('loginMenuBtn');
        this.loginSection = document.getElementById('loginSection');
        this.loginXBtn = document.getElementById('loginXBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.xpBar = document.getElementById('xpBar');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.mult = document.getElementById('mult');
        // Event Listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.hitButton.onclick = () => this.hit();
        this.standButton.onclick = () => this.stand();
        this.loginXBtn.onclick = () => this.loginSection.style.display = 'none';
        //Bet input handler
        document.getElementById('bet').addEventListener('input', (event) => {
            this.validateBetInput(event.target.value);
        });
        //Bet button Handler 
        this.betBtn.onclick = () => {
            const bet = Number(document.getElementById("bet").value);
            this.playerBet = bet;
            if (bet <= this.player.money) {
                this.betSection.style.display = 'none';
                this.start();
                this.hitButton.disabled = false;
                this.standButton.disabled = false;
            }
            else {
                console.error("Error: Bet greater than total money");
            }
        }
        //New hand Handler
        document.getElementById('newHand').onclick = () => {
            this.roundOverSection.style.display = 'none';
            //open bet section
            this.betSection.style.display = 'flex';
            if (this.playerBet !== null && this.playerBet <= this.player.money) {
                this.betInput.value = this.playerBet;
            }
            this.validateBetInput(this.betInput.value);
        };
        // Listen for auth state changes to update UI and game state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User signed in:", user.email);
                this.loginMenuBtn.textContent = "Logout";
                this.loginMenuBtn.onclick = () => this.logout();
                this.playerBet = null;
                this.start();
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
        // Login X Handler
        document.getElementById('loginXBtn').onclick = () => {
            this.loginSection.style.display = 'none';
        };
        // Login Handler
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
        // Register Handler
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

    logout() {
        signOut(auth).then(() => {
            // Reset UI, Data, and Game
            this.loginSection.style.display = 'none';
            this.player.resetData();
            this.playerBet = null;
            this.start();
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }

    start() {
        if (this.playerBet === null) { //first game only
            this.betSection.style.display = 'flex';
            this.hitButton.disabled = true;
            this.standButton.disabled = true;
            this.validateBetInput(this.betInput.value);
        }
        // Reset game state if needed
        this.gameActive = true;
        this.deck.reset();
        this.playerHand.clear();
        this.dealerHand.clear();
        this.clearScreen();
        // Initial deal
        this.displayCard(this.deck.drawCard(), this.playerHand);
        this.displayCard(this.deck.drawCard(), this.dealerHand, true);// Dealer's first card is hidden
        this.displayCard(this.deck.drawCard(), this.playerHand);
        this.displayCard(this.deck.drawCard(), this.dealerHand);
        // Update UI values
        this.updateHandValues(this.playerHand);
        this.updateHandValues(this.dealerHand);
        this.updateDataDisplay();
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
        this.updateDataDisplay();
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
            this.end('You bust! Dealer wins.', 0, this.playerBet);
        }
    }

    stand() {
        if (!this.gameActive) return;
        // Dealer's turn
        this.revealHiddenCards();
        while (this.dealerHand.getValue() < 17) {
            this.displayCard(this.deck.drawCard(), this.dealerHand);
        }
        // win/loss Logic
        if (this.dealerHand.isBust()) {
            this.end('Dealer busts! You win!', 1, this.playerBet);
        }
        else if (this.playerHand.getValue() > this.dealerHand.getValue()) {
            this.end('You win!', 1, this.playerBet);
        }
        else if (this.playerHand.getValue() < this.dealerHand.getValue()) {
            this.end('Dealer wins.', 0, this.playerBet);
        }
        else {
            this.end("It's a tie!", 2, this.playerBet);
        }
        this.gameActive = false;
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

    updateDataDisplay() {
        this.moneyDisplay.textContent = `Money: ${this.player.money}`;
        this.xpBar.style.width = `${this.player.xp / this.player.xpToNextLvl * 100}%`;
        this.levelDisplay.textContent = `Level: ${this.player.level}`;
        this.mult.textContent = `${this.player.multiplier.toFixed(2)}x`
    }

    validateBetInput(value) {
        console.log(`validating input ${value}`);
        if (value === "") {
            this.errorMsg.textContent = "";
            this.betBtn.disabled = true; // or false, depending on your UX
            return;
        }
        // Regex to check if input is only digits
        if (!/^\d+$/.test(value) && value !== "") {
            this.errorMsg.textContent = 'Invalid number format';
            this.betBtn.disabled = true;
            return;
        }
        const bet = Number(value);
        if (bet === 0) {
            this.errorMsg.textContent = 'Must be greater than 0.';
            this.betBtn.disabled = true;
            return;
        }
        if (bet > this.player.money) {
            this.errorMsg.textContent = `Can't be greater than ${this.player.money}.`;
            this.betBtn.disabled = true;
            return;
        }
        document.getElementById('errorMsg').textContent = '';
        this.betBtn.disabled = false;
    }
}