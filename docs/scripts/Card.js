export class Card {
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

  getImage(deckCardPath) {
    if (this.hidden) {
      return `${deckCardPath}back.jpg`;
    }
    return `${deckCardPath}${this.rank}.jpg`;
  }
}