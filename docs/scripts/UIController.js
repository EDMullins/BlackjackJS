export class UIController {
    constructor() {
        this.domElements();
        this.currentTheme = null;
        this.currentDealer = null;
        this.currentDeck = null;
    }

    connectGame(game, auth, store) {
        this.game = game;
        this.auth = auth;
        this.store = store;
    }

    domElements() {
        // Core Sections
        this.playerCardSection = document.getElementById('playerCardSection');
        this.dealerCardSection = document.getElementById('dealerCardSection');
        this.playerValueDisplay = document.getElementById('playerHandValue');
        this.dealerValueDisplay = document.getElementById('dealerHandValue');

        // Controls
        this.hitButton = document.getElementById('hit');
        this.standButton = document.getElementById('stand');
        this.splitButton = document.getElementById('split');
        this.doubleButton = document.getElementById('double');

        // Stats & Money
        this.moneyDisplay = document.getElementById('money');
        this.moneyPopup = document.getElementById('moneyPopup');
        this.winStreak = document.getElementById('winStreak');
        this.xpBar = document.getElementById('xpBar');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.mult = document.getElementById('mult');

        // Overlays
        this.roundOverSection = document.getElementById('roundOverSection');
        this.roundResultDisplay = document.getElementById('roundResult');
        this.roundData = document.getElementById('roundData');
        this.betSection = document.getElementById('betSection');
        this.gameOver = document.getElementById('gameOver');

        // Inputs & Buttons
        this.betInput = document.getElementById('bet');
        this.errorMsg = document.getElementById('errorMsg');
        this.betBtn = document.getElementById('betBtn');
        this.newHandBtn = document.getElementById('newHand');
        this.newGameBtn = document.getElementById('newGame');

        // Menus (Login, Stats, Store)
        this.loginMenuBtn = document.getElementById('loginMenuBtn');
        this.loginSection = document.getElementById('loginSection');
        this.loginXBtn = document.getElementById('loginXBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.authMessage = document.getElementById('authMessage');
        this.resetBtn = document.getElementById('resetBtn');

        this.statsMenuBtn = document.getElementById('statsMenuBtn');
        this.statsSection = document.getElementById('statsSection');
        this.statsXBtn = document.getElementById('statsXBtn');
        this.statsContent = document.getElementById('statsContent');

        this.storeBtns = document.querySelectorAll('.storeBtn');
        this.storeSection = document.getElementById('storeSection');
        this.storeXBtn = document.getElementById('storeXBtn');
        this.themeOptions = document.getElementById('themeOptions');
        this.dealerOptions = document.getElementById('dealerOptions');
        this.deckOptions = document.getElementById('deckOptions');
        this.purchaseMessage = document.getElementById('purchaseMessage');
    }

    // --- Event Binding ---

    bindGameEvents(game) {
        this.hitButton.onclick = () => game.hit();
        this.standButton.onclick = () => game.stand();
        this.splitButton.onclick = () => game.split();
        this.doubleButton.onclick = () => game.double();

        this.betInput.addEventListener('input', (e) => {
            this.validateBet(e.target.value, game.player.money);
        });

        this.betBtn.onclick = () => {
            game.handBets[0] = Number(this.betInput.value);
            game.originalBet = game.handBets[0];
            game.totalBet = game.handBets[0];
            this.hideBetSection();
            game.start();
        };

        this.newHandBtn.onclick = async () => await game.reset();
        this.newGameBtn.onclick = async () => await game.reset();

        // Menu Toggles
        this.statsMenuBtn.onclick = () => this.statsSection.classList.toggle('hidden');
        this.statsXBtn.onclick = () => this.statsSection.classList.add('hidden');

        this.storeBtns.forEach(btn => btn.onclick = () => this.storeSection.classList.toggle('hidden'));
        this.storeXBtn.onclick = () => this.storeSection.classList.add('hidden');
    }

    bindAuthEvents(auth) {
        this.loginMenuBtn.onclick = () => this.loginSection.classList.toggle('hidden');
        this.loginXBtn.onclick = () => this.loginSection.classList.add('hidden');
        this.loginBtn.onclick = () => auth.login(this.emailInput.value, this.passwordInput.value, this.authMessage);
        this.registerBtn.onclick = () => auth.register(this.emailInput.value, this.passwordInput.value, this.authMessage);
        this.resetBtn.onclick = () => auth.resetPassword(this.emailInput.value, this.authMessage);
    }

    // --- Card Rendering ---

    renderCard(card, hand, hidden) {
        let container = this.dealerCardSection;

        if (hand.isPlayer) {
            const handIndex = this.game.playerHands.indexOf(hand);
            if (this.game.playerHands.length > 1 && handIndex !== -1) {
                // Find the specific column for this split hand
                container = document.querySelector(`.splitHandCol[data-hand-index="${handIndex}"] .cardSection`);
            } else {
                container = this.playerCardSection;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'cardSlideWrapper';

        const dealer = document.createElement('img');
        dealer.src = this.store.getItem("dealers", this.store.getEquipped("dealers")).armImagePath;
        dealer.className = 'dealerArm';

        const img = document.createElement('img');
        img.className = 'cardImage';
        img.src = card.getImage(this.store.getItem("decks", this.store.getEquipped("decks")).cardImagePath);
        img.alt = hidden ? "Hidden Card" : card.rank;

        wrapper.appendChild(dealer);
        wrapper.appendChild(img);
        container.appendChild(wrapper);

        setTimeout(() => {
            wrapper.classList.add('slide-in');
            setTimeout(() => dealer.classList.add('slide-out'), 800);
            setTimeout(() => dealer.remove(), 2600);
        }, 200);
    }

    updateHandValue(hand, value, game) {
        if (!hand.isPlayer) {
            this.dealerValueDisplay.textContent = `Dealer's Hand: ${value}`;
            return;
        }

        // Map all hand values into a string like "18" or "14 | 20"
        const values = game.playerHands.map(h => h.getValue()).join(" | ");
        this.playerValueDisplay.textContent = `Player's Hand: ${values}`;
    }

    revealDealerHiddenCard(dealerHand) {
        dealerHand.cards.forEach(card => {
            if (card.hidden) {
                card.reveal();
                const img = this.dealerCardSection.querySelector(`img[alt="Hidden Card"]`);
                if (img) {
                    img.src = card.getImage(this.store.getItem("decks", this.store.getEquipped("decks")).cardImagePath);
                    img.alt = card.rank;
                }
            }
        });
    }

    // --- Split UI Logic ---

    renderSplitLayout(hand1, hand2) {
        this.playerCardSection.classList.add('hidden');
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

            // Re-render the initial card for each hand
            hand.cards.forEach(card => {
                const wrapper = document.createElement('div');
                wrapper.className = 'cardSlideWrapper slide-in';
                const img = document.createElement('img');
                img.className = 'cardImage';
                img.src = card.getImage(this.store.getItem("decks", this.store.getEquipped("decks")).cardImagePath);
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

    // --- Game States & Overlays ---

    showRoundOver(result, roundData) {
        this.roundOverSection.classList.remove('hidden');
        this.roundResultDisplay.textContent = result;
        this.roundData.innerHTML = `
            <div class="d-flex justify-content-between"><p>Bet</p><p>${roundData.bet}</p></div>
            <div class="d-flex justify-content-between"><p>Multiplier Bonus</p><p>${roundData.bonus}</p></div>
            <div class="d-flex justify-content-between"><p>Net Money Change</p><p>${roundData.moneyChange}</p></div>
            <div class="d-flex justify-content-between"><p>Multiplier Gained</p><p>${roundData.multiplierChange.toFixed(2)}</p></div>
            <div class="d-flex justify-content-between"><p>XP Gained</p><p>${roundData.xp.toFixed(0)}</p></div>
        `;
        this.disableGameButtons();
    }

    showGameOver() {
        this.gameOver.classList.remove('hidden');
        this.disableGameButtons();
    }

    hideRoundOver() { this.roundOverSection.classList.add('hidden'); }
    hideGameOver() { this.gameOver.classList.add('hidden'); }
    showBetSection() { this.betSection.classList.remove('hidden'); }
    hideBetSection() { this.betSection.classList.add('hidden'); }

    // --- Player Stats Update ---

    updatePlayerData(player) {
        this.moneyDisplay.textContent = `Money: ${player.money}`;
        this.xpBar.style.width = `${(player.xp / player.xpToNextLvl) * 100}%`;
        this.levelDisplay.textContent = `Level: ${player.level}`;
        this.mult.textContent = `${player.multiplier.toFixed(2)}x`;
        this.winStreak.textContent = player.winStreak > 0 ? `x${player.winStreak}` : "";

        // Stats Menu
        this.statsContent.innerHTML = `
        <div class="d-flex justify-content-between"><p>Money</p><p>${player.money}</p></div>
        <div class="d-flex justify-content-between"><p>Wins</p><p>${player.wins}</p></div>
        <div class="d-flex justify-content-between"><p>Losses</p><p>${player.losses}</p></div>
        <div class="d-flex justify-content-between"><p>Level</p><p>${player.level}</p></div>
        <div class="d-flex justify-content-between"><p>Money On Loss</p><p>${player.moneyOnNewRound}</p></div>
        <div class="d-flex justify-content-between"><p>XP</p><p>${Math.floor(player.xp)} / ${player.xpToNextLvl}</p></div>
        <div class="d-flex justify-content-between"><p>Highest Win Streak</p><p>${player.winStreakHigh}</p></div>
        `;

        this.validateBet(this.betInput.value, player.money);
    }

    // --- Utilities ---

    clearCards() {
        this.playerCardSection.innerHTML = '';
        this.dealerCardSection.innerHTML = '';
        this.playerValueDisplay.textContent = "Player's Hand:";
        this.dealerValueDisplay.textContent = "Dealer's Hand:";

        const splitContainer = document.getElementById('splitHandsContainer');
        if (splitContainer) splitContainer.remove();
        this.playerCardSection.classList.remove('hidden');
    }

    validateBet(value, money) {
        const bet = Number(value);
        let error = "";

        if (value === "") error = "";
        else if (!/^\d+$/.test(value)) error = "Invalid number";
        else if (bet <= 0) error = "Must be > 0";
        else if (bet > money) error = `Can't exceed ${money}`;

        this.errorMsg.textContent = error;
        this.betBtn.disabled = (error !== "" || value === "");
    }

    showMoneyPopup(amount) {
        if (!amount) return;
        this.moneyPopup.textContent = amount > 0 ? `+${amount}` : `${amount}`;
        this.moneyPopup.classList.remove("show");
        void this.moneyPopup.offsetWidth; // Trigger reflow
        this.moneyPopup.classList.add("show");
        setTimeout(() => this.moneyPopup.classList.remove("show"), 800);
    }

    enableGameButtons() {
        this.hitButton.disabled = false;
        this.standButton.disabled = false;
    }
    disableGameButtons() {
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
        this.hideSplitButton();
        this.disableDoubleButton();
    }
    showSplitButton() { this.splitButton.classList.remove('hidden'); }
    hideSplitButton() { this.splitButton.classList.add('hidden'); }
    enableDoubleButton() { this.doubleButton.disabled = false; }
    disableDoubleButton() { this.doubleButton.disabled = true; }

    // --- Store UI Methods ---

    renderStoreItems() {
        if (!this.store) return;

        // Render Themes
        this.themeOptions.innerHTML = "";
        Object.entries(this.store.themes).forEach(([key, theme]) => {
            const btn = this.createStoreItemButton(theme, 'themes', key);
            this.themeOptions.appendChild(btn);
        });

        // Render Dealers
        this.dealerOptions.innerHTML = "";
        Object.entries(this.store.dealers).forEach(([key, dealer]) => {
            const btn = this.createStoreItemButton(dealer, 'dealers', key);
            this.dealerOptions.appendChild(btn);
        });

        // Render Decks
        this.deckOptions.innerHTML = "";
        Object.entries(this.store.decks).forEach(([key, deck]) => {
            const btn = this.createStoreItemButton(deck, 'decks', key);
            this.deckOptions.appendChild(btn);
        });
    }

    createStoreItemButton(item, type, key) {
        const btn = document.createElement("button");
        btn.classList.add("btn", "mb-1", "store-item-btn");

        const isOwned = this.store.ownsItem(type, key);
        const isEquipped = this.store.isEquipped(type, key);
        const isPending = this.store.pendingEquipped && this.store.pendingEquipped[type] === key && !isEquipped;

        // Helper function to create button HTML with description
        const getButtonHTML = (title, description) => {
            return `<div class="store-btn-content"><div class="store-btn-title">${title}</div><div class="store-btn-desc">${description}</div></div>`;
        };

        if (isEquipped) {
            // Equipped - highlight and disable
            btn.classList.add("btn-primary", "store-equipped");
            btn.innerHTML = getButtonHTML(`${item.name} (Equipped)`, item.description);
            btn.disabled = true;
        } else if (isPending) {
            // Pending equipment - show as secondary with pending label (only during gameActive)
            btn.classList.add("btn-secondary", "store-pending");
            btn.innerHTML = getButtonHTML(`${item.name} (Pending)`, item.description);
            btn.disabled = true;
        } else if (isOwned) {
            // Owned but not equipped - show equip button
            btn.classList.add("btn-secondary", "store-owned");
            btn.innerHTML = getButtonHTML(`${item.name}`, item.description);
            btn.disabled = false;
            
            // If game is active, equip will be pending; if not, it applies immediately
            btn.onclick = async () => {
                const isPendingMode = this.game && this.game.gameActive;
                this.store.equipItem(type, key, isPendingMode);
                
                // If not pending (immediate equip), save to DB and apply visual changes
                if (!isPendingMode) {
                    await this.store.saveToDb(this.auth.currentUid);
                    
                    if (type === 'themes') {
                        this.setItem('themes', item.value);
                    }
                }
                
                this.renderStoreItems();
            };
        } else {
            // Not owned - show buy button
            btn.classList.add("btn-secondary", "store-unowned");
            btn.innerHTML = getButtonHTML(`${item.name} - $${item.cost}`, item.description);

            const canAfford = this.game.player.money >= item.cost;
            btn.disabled = !canAfford;

            if (!canAfford) {
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }

            btn.onclick = () => this.buyItem(type, key);
        }

        return btn;
    }

    async buyItem(type, key) {
        const result = this.store.buyItem(type, key);

        this.purchaseMessage.textContent = result.message;
        this.purchaseMessage.style.color = result.success ? 'green' : 'red';

        if (result.success) {
            await this.store.saveToDb(this.auth.currentUid);
            this.updatePlayerData(this.game.player);
            this.renderStoreItems();
        }
    }

    setItem(type, value) {
        if (type === 'themes') {
            document.documentElement.setAttribute("data-theme", value);
            this.currentTheme = value;
        }
        else if (type === 'dealers') {
            // Update existing dealer arms

            this.currentDealer = value;
        }
        else if (type === 'decks') {
            // Update existing card images

            this.currentDeck = value;
        }
    }
}