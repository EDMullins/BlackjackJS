import { Card } from './Card.js';

export class Deck {
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

  length() {
    return this.cards.length;
  }

  reset() {
    this.cards = this.createDeck();
  }
}