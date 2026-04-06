export class Player {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        this.resetData();
    }

    action(winner, betAmount, store) {
        const oldStats = {
            money: this.money,
            multiplier: this.multiplier
        };

        let xpGained = 0;
        let popupAmount = 0;
        let multBonus = 0;
        let deckBonus = 0;

        switch (winner) {
            case 1: // Win
                this.wins++;
                this.winStreak++;
                multBonus = Math.floor(this.multiplier * (betAmount * 0.01));
                
                // Apply deck payout modifier (Slim, Hobo, Wild, etc)
                const deckModifier = store ? store.getDeckPayoutModifier() : 1.0;
                deckBonus = Math.floor(betAmount * (deckModifier - 1.0));

                this.money += betAmount + multBonus + deckBonus;
                xpGained += 50 * this.multiplier;
                this.xp += xpGained;
                this.multiplier += 0.25;
                popupAmount = betAmount + multBonus + deckBonus;
                break;
            case 0: // Loss
                this.losses++;
                this.winStreak = 0;
                this.money -= betAmount;
                xpGained = 10;
                this.xp += xpGained;
                popupAmount = -betAmount;
                break;
            case 2: // Tie
                xpGained = 20 * this.multiplier;
                this.xp += xpGained;
                break;
        }

        // checkState returns true if player is broke (Game Over)
        const lost = this.checkState();
        if (this.onUpdate) this.onUpdate(popupAmount);

        return {
            bet: betAmount,
            bonus: multBonus,
            moneyChange: this.money - oldStats.money,
            multiplierChange: this.multiplier - oldStats.multiplier,
            xp: xpGained,
            lost: lost
        };
    }

    checkState() {
        // Level up logic
        while (this.xp >= this.xpToNextLvl) {
            this.xp -= this.xpToNextLvl;
            this.level++;
            this.moneyOnNewRound = 100 + (this.level * 20);
            this.xpToNextLvl = 100 * ((this.level + 1) * 1.5); 
        }

        // High streak
        if (this.winStreak > this.winStreakHigh) {
            this.winStreakHigh = this.winStreak;
        }

        // Money check
        if (this.money <= 0) {
            this.money = this.moneyOnNewRound;
            this.multiplier = 1; // Multiplier reset on Game Over
            this.winStreak = 0;
            return true;
        }
        return false;
    }

    resetData() {
        this.xp = 0;
        this.level = 0;
        this.multiplier = 1;
        this.money = 100;
        this.wins = 0;
        this.losses = 0;
        this.moneyOnNewRound = 100;
        this.xpToNextLvl = 150;
        this.winStreak = 0;
        this.winStreakHigh = 0;
        // Ability state tracking for theme abilities
        this.abilityStates = {
            luckyStreakWins: 0,
            luckyStreakLosses: 0,
            redrawnThisHand: 0,
            nextWinBoosted: false,
            nextLossPenalized: false
        };
    }
}