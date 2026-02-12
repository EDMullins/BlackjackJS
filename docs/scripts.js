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

const displayCard = (card, containerSelector) => {
  const container = document.querySelector(containerSelector);
  const img = document.createElement('img');
  img.className = 'cardImage';
  img.src = card.getImage();
  img.alt = card.rank;
  container.appendChild(img);
};

class Hand {
  constructor() {
    this.cards = [];
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

  isBust() {
    return this.getValue() > 21;
  }

  clear() {
    this.cards = [];
  }
}

class Game {
  constructor() {
    this.deck = new Deck();
    this.playerHand = new Hand();
    this.dealerHand = new Hand();
    this.gameActive = false;
    this.setupNewHandListener();
  }

  setupNewHandListener() {
    document.getElementById('newHand').onclick = () => {
      console.log("New Hand");
      document.getElementById('roundOverSection').style.display = 'none';
      this.start();
    };
  }

  start() {
    this.gameActive = true;
    // Reset game state if needed
    this.deck.reset();
    this.playerHand.clear();
    this.dealerHand.clear();
    document.getElementById('roundOverSection').style.display = 'none';
    // Initial deal
    this.playerHand.addCard(this.deck.drawCard());
    this.dealerHand.addCard(this.deck.drawCard(), true); // Dealer's first card is hidden
    this.playerHand.addCard(this.deck.drawCard());
    this.dealerHand.addCard(this.deck.drawCard());

    this.render();
    document.getElementById('hit').disabled = false;
    document.getElementById('stand').disabled = false;
    // Add event listeners for buttons
    document.getElementById('hit').onclick = () => this.hit();
    document.getElementById('stand').onclick = () => this.stand();
    console.log("Listening for clicks");
  }

  end(result) {
    this.gameActive = false;
    document.getElementById('hit').disabled = true;
    document.getElementById('stand').disabled = true;
    document.getElementById('roundOverSection').style.display = 'flex';
    document.getElementById('roundResult').textContent = result;
  }

  render() {
    document.querySelector('#dealerCardSection').innerHTML = '';
    document.querySelector('#playerCardSection').innerHTML = '';

    for (let card of this.dealerHand.cards) {
      displayCard(card, '#dealerCardSection');
      console.log(`Dealer card: ${card.rank}, hidden: ${card.hidden}`);
    }

    for (let card of this.playerHand.cards) {
      displayCard(card, '#playerCardSection');
      console.log(`Player card: ${card.rank}, hidden: ${card.hidden}`);
    }
  }

  hit() {
    if (!this.gameActive) return;
    this.playerHand.addCard(this.deck.drawCard());
    this.render();
    if (this.playerHand.isBust()) {
      this.end('You bust! Dealer wins.');
    }
  }

  //TODO: add end 
  stand() {
    if (!this.gameActive) return;
    this.dealerHand.cards[0].reveal(); // Reveal dealer's hidden card
    this.render();
    while (this.dealerHand.getValue() < 17) {
      this.dealerHand.addCard(this.deck.drawCard());
      this.render();
    }
    if (this.dealerHand.isBust()) {
      this.end('Dealer busts! You win!');
    } else if (this.playerHand.getValue() > this.dealerHand.getValue()) {
      this.end('You win!');
    } else if (this.playerHand.getValue() < this.dealerHand.getValue()) {
      this.end('Dealer wins.');
    } else {
      this.end("It's a tie!");
    }
    this.gameActive = false;
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