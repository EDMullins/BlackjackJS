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
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.authMessage = document.getElementById('authMessage');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.xpBar = document.getElementById('xpBar');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.mult = document.getElementById('mult');
        //logic variables
        this.cardAnimationIndex = 0;
        this.isOpeningDeal = false;
        // Event Listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        //hit & stand handlers
        this.hitButton.onclick = () => this.hit();
        this.standButton.onclick = () => this.stand();
        //Bet input handler
        this.betInput.addEventListener('input', (event) => {
            this.validateBetInput(event.target.value);
        });
        //Bet button Handler 
        this.betBtn.onclick = () => {
            const bet = Number(this.betInput.value);
            this.playerBet = bet;
            if (bet <= this.player.money) {
                this.betSection.classList.add('hidden');
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
            this.roundOverSection.classList.add('hidden');
            //open bet section
            this.betSection.classList.remove('hidden');
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
                    this.loginSection.classList.toggle('hidden');
                };
            }
        });
        // Login X Handler
        this.loginXBtn.onclick = () => {
            this.loginSection.classList.add('hidden');
        };
        // Login Handler
        this.loginBtn.onclick = async () => {
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
        this.registerBtn.onclick = async () => {
            const email = this.emailInput.value;
            const password = this.passwordInput.value;
            const msg = this.authMessage;
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
            this.loginSection.classList.add('hidden');
            this.player.resetData();
            this.playerBet = null;
            this.start();
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }

    start() {
        if (this.playerBet === null) { //first game only
            this.betSection.classList.remove('hidden');
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
        this.cardAnimationIndex = 0;
        this.isOpeningDeal = true;
        // Initial deal
        this.displayCard(this.deck.drawCard(), this.dealerHand, true);
        this.displayCard(this.deck.drawCard(), this.playerHand);// Dealer's first card is hidden
        this.displayCard(this.deck.drawCard(), this.dealerHand);
        this.displayCard(this.deck.drawCard(), this.playerHand);
        //update UI
        this.updateDataDisplay();
        this.isOpeningDeal = false;
    }

    end(result, action, betAmount) {
        // Update player data based on result
        this.player.action(action, betAmount);
        //display dealer hand
        this.revealHiddenCard();
        this.updateHandValues(this.dealerHand);
        // set state to ended and update UI
        this.gameActive = false;
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
        this.roundOverSection.classList.remove('hidden');
        this.roundResultDisplay.textContent = result;
        this.updateDataDisplay();
    }

    displayCard(card, hand, hidden = false) {

        hand.addCard(card, hidden);
        const container = hand.isPlayer ? this.playerCardSection : this.dealerCardSection;
        this.updateHandValues(hand);

        // --- Create wrapper that slides in ---
        const wrapper = document.createElement('div');
        wrapper.className = 'cardSlideWrapper';

        // --- Cat image ---
        const cat = document.createElement('img');
        cat.src = './imgs/cat.png';
        cat.className = 'catArm';

        const img = document.createElement('img');
        img.className = 'cardImage';
        img.src = card.getImage();
        img.alt = hidden ? "Hidden Card" : card.rank;

        wrapper.appendChild(cat);
        wrapper.appendChild(img);
        container.appendChild(wrapper);

        let delay = 0;
        if (this.isOpeningDeal) {
            delay = this.cardAnimationIndex * 1600; // 300ms spacing
            this.cardAnimationIndex++;
        }

        setTimeout(() => {
            wrapper.classList.add('slide-in');

            // After slide-in, remove cat
            setTimeout(() => {
                cat.classList.add('slide-out');
            }, 800);

            // Remove cat from DOM after animation
            setTimeout(() => {
                cat.remove();
            }, 2600);
        }, delay);
    }

    clearScreen() {
        this.playerCardSection.innerHTML = '';
        this.dealerCardSection.innerHTML = '';
        this.playerValueDisplay.textContent = "Player's Hand: ";
        this.dealerValueDisplay.textContent = "Dealer's Hand: ";
        this.roundOverSection.classList.add('hidden');
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
        this.revealHiddenCard();
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
        if (hand.isPlayer) {
            this.playerValueDisplay.textContent = `Player's Hand: ${hand.getValue()}`;
        }
        else {
            this.dealerValueDisplay.textContent = `Dealer's Hand: ${hand.getValue()}`;
        }
    }

    revealHiddenCard() {
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
        this.errorMsg.textContent = '';
        this.betBtn.disabled = false;
    }
}