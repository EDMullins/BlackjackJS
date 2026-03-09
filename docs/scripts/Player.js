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
        let multBonus = 0;
        const oldMultiplier = this.multiplier;
        const oldMoney = this.money;

        if (winner === 1) {
            this.wins++;
            this.winStreak++;

            multBonus = Math.floor(this.multiplier * (betAmount * 0.10));
            this.money += betAmount + multBonus;
            this.xp += 50 * this.multiplier;
            this.multiplier += 0.25;
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
        //TODO: Fix mulitplier bug on Game over doesnt show properly
        const roundData = {
            bet: betAmount,
            bonus: multBonus,
            moneyChange: this.money - oldMoney,
            multiplierChange: this.multiplier - oldMultiplier,
            xp: xpGained,
            lost: false
        };

        const didLose = this.checkState();
        roundData.lost = didLose;

        if (this.onUpdate) {
            this.onUpdate(popupAmount);
        }

        return roundData;
    }

    checkState() {
        let lost = false;
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
            lost = true;
        }
        if (this.winStreak > this.winHigh) {
            this.winHigh = this.winStreak;
        }
        return lost;
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