document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");
  const game = new Game();
  game.start();
});

class Card {
  constructor(rank, hidden = false) {
    this.rank = rank;
    this.hidden = hidden;
  }

  hide() {
    this.hidden = true;
  }

  reveal() {
    this.hidden = false;
  }

  getValue() {
    if (this.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(this.rank)) return 10;
    return parseInt(this.rank);
  }

  getImage() {
    if (this.hidden) {
      return `imgs/back.png`;
    }
    return `imgs/${this.rank}.png`;
  }
}

class Deck {
  constructor() {
    this.cards = this.createDeck();
  }

  createDeck() {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    for (let i = 0; i < 4; i++) {
      for (let rank of ranks) {
        deck.push(new Card(rank));
      }
    }

    return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
  }

  drawCard() {
    return this.cards.pop();
  }

  isEmpty() {
    return this.cards.length === 0;
  }

  reset() {
    this.cards = this.createDeck();
  }
}

class Hand {
  constructor(isPlayer = false) {
    this.cards = [];
    this.isPlayer = isPlayer;
  }

  addCard(card, hidden = false) {
    if (hidden) {
      card.hide();
    }
    this.cards.push(card);
  }

  getValue() {
    let value = 0;
    let aces = 0;

    for (let card of this.cards) {
      if (card.hidden) continue; // Skip hidden cards
      value += card.getValue();
      if (card.rank === 'A' && !card.hidden) aces++;
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  }

  getLastCard() {
    return this.cards[this.cards.length - 1];
  }

  isBust() {
    return this.getValue() > 21;
  }

  clear() {
    this.cards = [];
  }
}

class Game {
  constructor() {
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
    // this.moneyDisplay = document.getElementById('money');
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
    console.log("Listening for clicks");
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

class Player {
  constructor() {
    this.xp = 0;
    this.level = 0;
    this.xpToNextLvl = 100;
    this.money = 100;
    //After you lose all your money, you can start a new round with 100 money, but you will lose all your multiplier.
    this.moneyOnNewRound = 100;
    this.multiplier = 1;
  }

  GetPlayerData() {

  }

  PutPlayerData() {

  }
}