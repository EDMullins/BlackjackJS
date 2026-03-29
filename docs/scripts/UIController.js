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
        this.splitButton = document.getElementById('split');
        this.doubleButton = document.getElementById('double');
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

        this.storeBtns = document.querySelectorAll('.storeBtn');
        this.storeSection = document.getElementById('storeSection');
        this.storeXBtn = document.getElementById('storeXBtn');
        this.themeOptions = document.getElementById('themeOptions');

        this.inventoryBtns = document.querySelectorAll('.inventoryBtn');
        this.inventorySection = document.getElementById('inventorySection');
        this.inventoryXBtn = document.getElementById('inventoryXBtn');

        this.winStreak = document.getElementById('winStreak');
        this.xpBar = document.getElementById('xpBar');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.mult = document.getElementById('mult');

        this.gameOver = document.getElementById('gameOver');
        this.newGameBtn = document.getElementById('newGame');
    }

    bindGameEvents(game) {
        this.hitButton.onclick = () => game.hit();
        this.standButton.onclick = async () => game.stand();
        this.splitButton.onclick = () => game.split();
        this.doubleButton.onclick = () => game.double();

        this.betInput.addEventListener('input', (e) => {
            this.validateBet(e.target.value, game.player.money);
        });

        this.betBtn.onclick = () => {
            const betValue = this.betInput.value;
            const bet = Number(betValue);

            game.playerBet = bet;
            this.hideBetSection();
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

        this.storeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.storeSection.classList.toggle('hidden');
                this.inventorySection.classList.add('hidden');
            });
        });

        this.storeXBtn.onclick = () => {
            this.storeSection.classList.add('hidden');
        };

        this.inventoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.inventorySection.classList.toggle('hidden');
                this.storeSection.classList.add('hidden');
            });
        });

        this.inventoryXBtn.onclick = () => {
            this.inventorySection.classList.add('hidden');
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

    renderCard(card, hand, hidden) {
        let container;

        if (hand.isPlayer) {
            if (hand.isSplitHand) {
                // Find the split column that belongs to this hand object
                const idx = this.game?.splitHands?.indexOf(hand) ?? -1;
                container = idx >= 0
                    ? document.querySelector(`.splitHandCol[data-hand-index="${idx}"] .cardSection`)
                    : this.playerCardSection;
            } else {
                container = this.playerCardSection;
            }
        } else {
            container = this.dealerCardSection;
        }

        // Create wrapper for slide animation
        const wrapper = document.createElement('div');
        wrapper.className = 'cardSlideWrapper';

        // Dealer arm image
        const dealer = document.createElement('img');
        dealer.src = './imgs/hand.png';
        dealer.className = 'dealerArm';

        // Card image
        const img = document.createElement('img');
        img.className = 'cardImage';
        img.src = card.getImage();
        img.alt = hidden ? "Hidden Card" : card.rank;

        wrapper.appendChild(dealer);
        wrapper.appendChild(img);
        container.appendChild(wrapper);

        // Trigger slide animation
        setTimeout(() => {
            wrapper.classList.add('slide-in');

            setTimeout(() => {
                dealer.classList.add('slide-out');
            }, 800);

            setTimeout(() => {
                dealer.remove();
            }, 2600);
        }, 200);
    }

    updateHandValue(hand, value, game) {
        if (!hand.isPlayer) {
            this.dealerValueDisplay.textContent = `Dealer's Hand: ${value}`;
            return;
        }

        if (game && game.isSplit && game.splitHands.length === 2) {
            const v0 = game.splitHands[0].getValue();
            const v1 = game.splitHands[1].getValue();

            this.playerValueDisplay.innerHTML = `Player's Hand: ${v0}, ${v1}`;
        } else {
            this.playerValueDisplay.textContent = `Player's Hand: ${value}`;
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
        // Stats Menu
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

        // Remove any split columns that were injected
        const splitContainer = document.getElementById('splitHandsContainer');
        if (splitContainer) splitContainer.remove();

        // Restore the original playerCardSection visibility
        this.playerCardSection.classList.remove('hidden');
    }

    renderSplitLayout(hand1, hand2) {
        // Hide the original single-hand container
        this.playerCardSection.classList.add('hidden');

        // Remove any previous split container
        const existing = document.getElementById('splitHandsContainer');
        if (existing) existing.remove();

        const playerSection = document.querySelector('.playerSection');

        const container = document.createElement('div');
        container.id = 'splitHandsContainer';
        container.className = 'd-flex justify-content-center gap-3 mt-2';

        [hand1, hand2].forEach((hand, i) => {
            const col = document.createElement('div');
            col.className = 'splitHandCol';
            col.dataset.handIndex = i;

            const cardSection = document.createElement('div');
            cardSection.className = 'cardSection d-flex flex-wrap justify-content-center';

            col.appendChild(cardSection);
            container.appendChild(col);

            // Re-render the one card already in this hand
            hand.cards.forEach(card => {
                const wrapper = document.createElement('div');
                wrapper.className = 'cardSlideWrapper slide-in';

                const img = document.createElement('img');
                img.className = 'cardImage';
                img.src = card.getImage();
                img.alt = card.rank;

                wrapper.appendChild(img);
                cardSection.appendChild(wrapper);
            });
        });

        playerSection.appendChild(container);
    }

    highlightSplitHand(activeIndex) {
        document.querySelectorAll('.splitHandCol').forEach((col, i) => {
            col.classList.toggle('active-split-hand', i === activeIndex);
            col.classList.toggle('inactive-split-hand', i !== activeIndex);
        });
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
                    <p>Net Money Change</p><p>${roundData.moneyChange}</p>
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

    showSplitButton() {
        this.splitButton.classList.remove('hidden');
    }

    hideSplitButton() {
        this.splitButton.classList.add('hidden');
    }

    enableDoubleButton() {
        this.doubleButton.disabled = false;
    }

    disableDoubleButton() {
        this.doubleButton.disabled = true;
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
            } else {
                btn.classList.add("btn-dark");
                btn.textContent = `${theme.name} (Lvl ${theme.level})`;
                btn.disabled = true;
            }

            this.themeOptions.appendChild(btn);
        });
    }
}