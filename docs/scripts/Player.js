export class Player {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        // Player Data
        this.xp = 0;
        this.level = 0;
        this.multiplier = 1;
        this.money = 100;
        this.wins = 0;
        this.losses = 0;
        this.moneyOnNewRound = 100;
        this.xpToNextLvl = 100;
        this.theme = "default";
    }

    action(winner, betAmount) {
        let popupAmount = 0;
        if (winner === 1) {
            this.wins++;
            this.money += betAmount;
            this.xp += 50 * this.multiplier;
            this.multiplier += betAmount / this.money;
            popupAmount = betAmount;
        }
        else if (winner === 0) {
            this.losses++;
            this.money -= betAmount;
            this.xp += 10;
            popupAmount = -betAmount;
        }
        else {//tie
            this.xp += 20 * this.multiplier;
        }

        this.checkState();
        
        if (this.onUpdate) {
            this.onUpdate(popupAmount);
        }
    }

    checkState() {
        //check level up
        while (this.xp >= this.xpToNextLvl) {
            this.level++;
            this.xp -= this.xpToNextLvl;
            this.moneyOnNewRound = 100 + (this.level * 20);
            this.xpToNextLvl = 100 * (this.level * 1.5);
        }
        //check money
        if (this.money <= 0) {
            this.money = this.moneyOnNewRound;
            this.multiplier = 1;
        }
    }

    resetData() {
        this.xp = 0;
        this.level = 0;
        this.multiplier = 1;
        this.money = 100;
        this.wins = 0;
        this.losses = 0;
        this.moneyOnNewRound = 100;
        this.xpToNextLvl = 100;
        this.theme = "default";
    }
}