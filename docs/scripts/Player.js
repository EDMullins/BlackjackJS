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
        this.winStreak = 0;
        this.winHigh = 0;
    }

    action(winner, betAmount) {
        let popupAmount = 0;
        let xpGained = this.xp;
        const oldMultiplier = this.multiplier;
        const oldMoney = this.money;

        if (winner === 1) {
            this.wins++;
            this.winStreak++;
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

        xpGained = this.xp - xpGained;
        const roundData = {
            bet: betAmount,
            moneyChange: this.money - oldMoney,
            multiplierChange: this.multiplier - oldMultiplier,
            xp: xpGained
        };

        this.checkState();
        
        if (this.onUpdate) {
            this.onUpdate(popupAmount);
        }

        return roundData;
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
            this.winStreak = 0;
            this.multiplier = 1;
        }
        if (this.winStreak > this.winHigh) {
            this.winHigh = this.winStreak;
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
        this.winStreak = 0;
        this.winHigh = 0;
    }
}