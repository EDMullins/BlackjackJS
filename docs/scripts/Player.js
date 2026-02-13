export class Player {
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