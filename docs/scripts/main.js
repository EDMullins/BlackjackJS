document.addEventListener("DOMContentLoaded", (event) => {
  const game = new Game();
  game.start();
  console.log("DOM fully loaded and parsed");
});

import { Deck } from './Deck.js';
import { Hand } from './Hand.js';
import { Player } from './Player.js';

// Test Firestore read/write
async function testFirestore() {
  const player = new Player();
  // Write test data
  await player.PutPlayerData("testUser", { xp: 10, money: 50 });
  // Read test data
  const data = await player.GetPlayerData("testUser");
  console.log("Firestore test data:", data);
}

testFirestore();

class Game {
  constructor() {
    // Player Data
    this.player = new Player();
    this.player.GetPlayerData();
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
    // Event Listeners
    this.setupNewHandListener();
  }

  setupNewHandListener() {
    document.getElementById('newHand').onclick = () => {
      console.log("New Hand");
      this.roundOverSection.style.display = 'none';
      this.start();
    };
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
    // Enable buttons and set up event listeners
    this.hitButton.disabled = false;
    this.standButton.disabled = false;
    this.hitButton.onclick = () => this.hit();
    this.standButton.onclick = () => this.stand();
  }

  end(result) {
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
    img.alt = card.rank;
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
      this.end('You bust! Dealer wins.');
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
      this.end('Dealer busts! You win!');
    } 
    else if (this.playerHand.getValue() > this.dealerHand.getValue()) {
      this.end('You win!');
    } 
    else if (this.playerHand.getValue() < this.dealerHand.getValue()) {
      this.end('Dealer wins.');
    } 
    else {
      this.end("It's a tie!");
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
        const img = document.querySelector(`#dealerCardSection img[alt="${card.rank}"]`);
        img.src = card.getImage();
      }
    }
  }
}