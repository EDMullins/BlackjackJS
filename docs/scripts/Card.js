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

  getImage() {
    if (this.hidden) {
      return `imgs/back.png`;
    }
    return `imgs/${this.rank}.png`;
  }
}