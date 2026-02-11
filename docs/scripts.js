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
  }

  start() {
    this.gameActive = true;
    this.playerHand.clear();
    this.dealerHand.clear();
    // Initial deal
    this.playerHand.addCard(this.deck.drawCard());
    this.dealerHand.addCard(this.deck.drawCard(), true); // Dealer's first card is hidden
    this.playerHand.addCard(this.deck.drawCard());
    this.dealerHand.addCard(this.deck.drawCard());

    this.render();
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
}
