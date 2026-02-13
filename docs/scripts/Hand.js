export class Hand {
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