import { Card } from './Card.js';

export class Deck {
  constructor(abilityModifiers = {}) {
    this.abilityModifiers = abilityModifiers;
    this.cards = this.createDeck();
  }

  createDeck() {
    let ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    // Apply deck composition abilities
    if (this.abilityModifiers.deckComposition) {
      const mod = this.abilityModifiers.deckComposition;
      
      // Remove specific ranks (Slim Deck, Hobo Deck)
      if (mod.type === 'removeRanks') {
        ranks = ranks.filter(r => !mod.ranks.includes(r));
      }
    }

    const deck = [];

    // Build base deck
    for (let i = 0; i < 4; i++) {
      for (let rank of ranks) {
        deck.push(new Card(rank));
      }
    }

    // Apply face card increase if needed
    if (this.abilityModifiers.deckComposition?.type === 'increaseFaceCards') {
      const increase = this.abilityModifiers.deckComposition.increase;
      const faceCards = ['J', 'Q', 'K'];
      const numToAdd = Math.floor(deck.length * increase);
      
      for (let i = 0; i < numToAdd; i++) {
        const randomFace = faceCards[Math.floor(Math.random() * faceCards.length)];
        deck.push(new Card(randomFace));
      }
    }

    // Randomize card values (Wild Deck)
    if (this.abilityModifiers.deckComposition?.type === 'randomizeCardValues') {
      deck.forEach(card => {
        if (card.rank !== 'A') { // Keep aces as is
          const possibleRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
          card.rank = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
        }
      });
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
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