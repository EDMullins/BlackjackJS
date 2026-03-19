export class UIController {
    constructor() {
        this.domElements();
        this.currentTheme = "default";
        this.themes = [
            { name: "Default", value: "default", level: 0 },
            { name: "Light", value: "light", level: 1 },
            { name: "Dark", value: "dark", level: 2 },
            { name: "Light", value: "light", level: 5 },
            { name: "Light", value: "light", level: 10 },
            { name: "Light", value: "light", level: 15 },
            { name: "Light", value: "light", level: 25 },
            { name: "Light", value: "light", level: 45 },
            { name: "Light", value: "light", level: 75 },
            { name: "Light", value: "light", level: 100 },
        ];
    }

    connectGame(game, auth) {
        this.game = game;
        this.auth = auth;
    }

    domElements() {
        // UI Elements
        this.playerCardSection = document.getElementById('playerCardSection');
        this.dealerCardSection = document.getElementById('dealerCardSection');
        this.hitButton = document.getElementById('hit');
        this.standButton = document.getElementById('stand');
        this.moneyDisplay = document.getElementById('money');
        this.moneyPopup = document.getElementById('moneyPopup');
        this.playerValueDisplay = document.getElementById('playerHandValue');
        this.dealerValueDisplay = document.getElementById('dealerHandValue');

        this.roundOverSection = document.getElementById('roundOverSection');
        this.roundResultDisplay = document.getElementById('roundResult');
        this.roundData = document.getElementById('roundData');

        this.betSection = document.getElementById('betSection');
        this.betInput = document.getElementById('bet');
        this.errorMsg = document.getElementById('errorMsg');
        this.betBtn = document.getElementById('betBtn');
        this.newHandBtn = document.getElementById('newHand');

        this.loginMenuBtn = document.getElementById('loginMenuBtn');
        this.loginSection = document.getElementById('loginSection');
        this.loginXBtn = document.getElementById('loginXBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.authMessage = document.getElementById('authMessage');

        this.statsMenuBtn = document.getElementById('statsMenuBtn');
        this.statsSection = document.getElementById('statsSection');
        this.statsXBtn = document.getElementById('statsXBtn');
        this.statsMoney = document.getElementById('statsMoney');
        this.statsWins = document.getElementById('statsWins');
        this.statsLosses = document.getElementById('statsLosses');
        this.statsLevel = document.getElementById('statsLevel');
        this.statsMoneyOnNewRound = document.getElementById('statsMoneyOnNewRound');
        this.statsXP = document.getElementById('statsXP');
        this.statsWinStreakHigh = document.getElementById('statsWinStreakHigh');

        this.storeMenuBtn = document.getElementById('storeMenuBtn');
        this.storeSection = document.getElementById('storeSection');
        this.storeXBtn = document.getElementById('storeXBtn');
        this.themeOptions = document.getElementById('themeOptions');

        this.winStreak = document.getElementById('winStreak');
        this.xpBar = document.getElementById('xpBar');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.mult = document.getElementById('mult');

        this.gameOver = document.getElementById('gameOver');
        this.newGameBtn = document.getElementById('newGame')
    }

    // Bind Events
    bindGameEvents(game) {
        this.hitButton.onclick = () => game.hit();
        this.standButton.onclick = async () => game.stand();

        this.betInput.addEventListener('input', (e) => {
            this.validateBet(e.target.value, game.player.money);
        });

        this.betBtn.onclick = () => {
            const betValue = this.betInput.value;
            const bet = Number(betValue);

            game.playerBet = bet;
            this.hideBetSection();
            this.enableGameButtons();
            game.start();
        };

        this.newHandBtn.onclick = () => {
            game.reset();
        };

        this.newGameBtn.onclick = () => {
            game.reset();
        };

        this.statsMenuBtn.onclick = () => {
            this.statsSection.classList.toggle('hidden');
        };

        this.statsXBtn.onclick = () => {
            this.statsSection.classList.add('hidden');
        };

        this.storeMenuBtn.onclick = () => {
            this.storeSection.classList.toggle('hidden');
        }

        this.storeXBtn.onclick = () => {
            this.storeSection.classList.add('hidden');
        };


    }

    bindAuthEvents(auth) {
        this.loginMenuBtn.onclick = () => {
            this.loginSection.classList.toggle('hidden');
        };

        this.loginXBtn.onclick = () => {
            this.loginSection.classList.add('hidden');
        };

        this.loginBtn.onclick = () => {
            auth.login(
                this.emailInput.value,
                this.passwordInput.value,
                this.authMessage
            );
        };

        this.registerBtn.onclick = () => {
            auth.register(
                this.emailInput.value,
                this.passwordInput.value,
                this.authMessage
            );
        };

        document.getElementById("resetBtn").onclick = () => {
            auth.resetPassword(
                this.emailInput.value, 
                this.authMessage
            );
        };
    }

    // UI Methods
    renderCard(card, hand, hidden) {
        const container = hand.isPlayer ? this.playerCardSection : this.dealerCardSection;

        // Create wrapper for slide animation
        const wrapper = document.createElement('div');
        wrapper.className = 'cardSlideWrapper';

        // Cat arm image
        const cat = document.createElement('img');
        cat.src = './imgs/cat.png';
        cat.className = 'catArm';

        // Card image
        const img = document.createElement('img');
        img.className = 'cardImage';
        img.src = card.getImage();
        img.alt = hidden ? "Hidden Card" : card.rank;

        wrapper.appendChild(cat);
        wrapper.appendChild(img);
        container.appendChild(wrapper);

        // Trigger slide animation
        setTimeout(() => {
            wrapper.classList.add('slide-in');

            setTimeout(() => {
                cat.classList.add('slide-out');
            }, 800);

            setTimeout(() => {
                cat.remove();
            }, 2600);

        }, 200);
    }

    updateHandValue(hand, value) {
        if (hand.isPlayer) {
            this.playerValueDisplay.textContent = `Player's Hand: ${value}`;
        } else {
            this.dealerValueDisplay.textContent = `Dealer's Hand: ${value}`;
        }
    }

    revealDealerHiddenCard(dealerHand) {
        for (let card of dealerHand.cards) {
            if (card.hidden) {
                card.reveal();
                const img = this.dealerCardSection.querySelector(
                    `img[alt="Hidden Card"]`
                );
                if (img) {
                    img.src = card.getImage();
                    img.alt = card.rank;
                }
            }
        }
    }

    updatePlayerData(player) {
        this.moneyDisplay.textContent = `Money: ${player.money}`;
        this.xpBar.style.width = `${player.xp / player.xpToNextLvl * 100}%`;
        this.levelDisplay.textContent = `Level: ${player.level}`;
        this.mult.textContent = `${player.multiplier.toFixed(2)}x`;
        this.winStreak.textContent = player.winStreak > 0 ? `x${player.winStreak}` : "";
        //Stats Menu 
        this.statsMoney.textContent = `Money: ${player.money}`;
        this.statsWins.textContent = `Wins: ${player.wins}`;
        this.statsLosses.textContent = `Losses: ${player.losses}`;
        this.statsLevel.textContent = `Level: ${player.level}`;
        this.statsMoneyOnNewRound.textContent = `Money On Loss: ${player.moneyOnNewRound}`;
        this.statsXP.textContent = `XP: ${Math.floor(player.xp)} / ${player.xpToNextLvl}`;
        this.statsWinStreakHigh.textContent = `Highest Win Streak: ${player.winStreakHigh}`;

        this.validateBet(this.betInput.value, player.money);

        this.renderThemes();
    }

    clearCards() {
        this.playerCardSection.innerHTML = '';
        this.dealerCardSection.innerHTML = '';
        this.playerValueDisplay.textContent = "Player's Hand:";
        this.dealerValueDisplay.textContent = "Dealer's Hand:";
    }

    showRoundOver(result, roundData) {
        this.roundOverSection.classList.remove('hidden');
        this.roundResultDisplay.textContent = result;
        this.roundData.innerHTML = `
            <div class="d-flex justify-content-between">
                <p>Bet</p><p>${roundData.bet}</p>
            </div>
            <div class="d-flex justify-content-between">
                <p>Multiplier Bonus</p><p>${roundData.bonus}</p>
            </div>
            <div class="d-flex justify-content-between">
                <p>Money Gained</p><p>${roundData.moneyChange}</p>
            </div>
            <div class="d-flex justify-content-between">
                <p>Multiplier Gained</p><p>${roundData.multiplierChange.toFixed(2)}</p>
            </div>
            <div class="d-flex justify-content-between">
                <p>XP Gained</p><p>${roundData.xp.toFixed(0)}</p>
            </div>
        `;
        this.disableGameButtons();
    }

    hideRoundOver() {
        this.roundOverSection.classList.add('hidden');
    }

    showBetSection() {
        this.betSection.classList.remove('hidden');
    }

    hideBetSection() {
        this.betSection.classList.add('hidden');
    }

    showGameOver() {
        this.gameOver.classList.remove('hidden');
        this.disableGameButtons();
    }

    hideGameOver() {
        this.gameOver.classList.add('hidden');
    }

    enableGameButtons() {
        this.hitButton.disabled = false;
        this.standButton.disabled = false;
    }

    disableGameButtons() {
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
    }

    validateBet(value, money) {
        if (value === "") {
            this.errorMsg.textContent = "";
            this.betBtn.disabled = true;
            return;
        }
        if (!/^\d+$/.test(value)) {
            this.errorMsg.textContent = "Invalid number";
            this.betBtn.disabled = true;
            return;
        }

        const bet = Number(value);

        if (bet <= 0) {
            this.errorMsg.textContent = "Must be greater than 0";
            this.betBtn.disabled = true;
            return;
        }
        if (bet > money) {
            this.errorMsg.textContent = `Can't exceed ${money}`;
            this.betBtn.disabled = true;
            return;
        }

        this.errorMsg.textContent = "";
        this.betBtn.disabled = false;
    }

    showMoneyPopup(amount) {
        if (!amount) return;

        this.moneyPopup.textContent = amount > 0 ? `+${amount}` : `${amount}`;

        this.moneyPopup.classList.remove("show");
        void this.moneyPopup.offsetWidth;
        this.moneyPopup.classList.add("show");

        setTimeout(() => {
            this.moneyPopup.classList.remove("show");
        }, 800);
    }

    setTheme(themeName) {
        document.documentElement.setAttribute("data-theme", themeName);
        this.currentTheme = themeName;
    }

    renderThemes() {
        this.themeOptions.innerHTML = "";

        const level = this.game.player.level;

        this.themes.forEach(theme => {
            const btn = document.createElement("button");
            btn.classList.add("btn", "btn-secondary", "mb-1");

            const unlocked = level >= theme.level;
            if (unlocked) {
                btn.textContent = theme.name;

                btn.addEventListener("click", () => {
                    this.setTheme(theme.value);
                    this.game.player.theme = theme.value;
                    if (this.auth.currentUid) {
                        this.auth.savePlayerData(this.game.player, this.auth.currentUid);
                    }
                });
            }
            else {
                btn.classList.add("btn-dark");
                btn.textContent = `${theme.name} (Lvl ${theme.level})`;
                btn.disabled = true;
            }

            this.themeOptions.appendChild(btn);
        });
    }
}