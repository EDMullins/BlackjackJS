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

    // Royal Deck: 
    if (this.abilityModifiers.deckComposition?.type === 'increaseFaceCards') {
      const increase = this.abilityModifiers.deckComposition.increase;
      const faceCards = ['J', 'Q', 'K'];
      const numToAdd = Math.floor(deck.length * increase);
      console.log(`Adding ${numToAdd} random face cards to the deck for Royal Deck ability`);
      for (let i = 0; i < numToAdd; i++) {
        const randomFace = faceCards[Math.floor(Math.random() * faceCards.length)];
        deck.push(new Card(randomFace));
      }
    }

    // Wild Deck: Randomize card ranks. There can be more or less than 4 of each rank.
    if (this.abilityModifiers.deckComposition?.type === 'randomizeCardValues') {
      for (let card of deck) {
        const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
        card.rank = randomRank;
      }
      console.log("Wild Deck applied: Card ranks have been randomized");
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