// Store.js
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const db = getFirestore();

export class Store {
    constructor(player) {
        this.player = player;

        // Themes have abilities that affect the player's hand and gameplay
        this.themes = {
            default: {
                name: "Default",
                level: 0,
                value: "default",
                description: "The classic green felt theme<br>No special abilities",
                abilities: {}
            },
            light: {
                name: "Light",
                level: 1,
                value: "light",
                description: "A light, minimalist theme<br>No special abilities",
                abilities: {}
            },
            dark: {
                name: "Dark",
                level: 2,
                value: "dark",
                description: "A dark, sleek theme<br>No special abilities",
                abilities: {}
            },
            gambler: {
                name: "Gambler",
                level: 5,
                value: "gambler",
                description: "Yellow/Orange theme<br>On a loss, keep 25% of the bet",
                abilities: {
                    onLoss: { type: "keepBetPercentage", value: 0.25 }
                }
            },
            luckyStreak: {
                name: "Lucky Streak",
                level: 7,
                value: "luckyStreak",
                description: "Lucky Green<br>On 3rd win, gives +100% payout. After 2 losses, lose +25%.",
                abilities: {
                    onWin: { type: "streakBonus", winsRequired: 2, bonus: 1.00 },
                    onLoss: { type: "streakPenalty", lossesRequired: 1, penalty: 0.25 }
                }
            },
            paradisePink: {
                name: "Paradise Pink",
                level: 10,
                value: "paradisePink",
                description: "Pretty pink theme<br>Once per hand, redraw a card you just drew",
                abilities: {
                    onDraw: { type: "allowRedraw", perHand: 1 }
                }
            }
        };

        // Dealers have abilities that affect the dealer's hand and gameplay
        this.dealers = {
            default: {
                name: "Default",
                cost: 0,
                value: "default",
                description: "The classic dealer hand",
                armImagePath: "./imgs/dealers/hand.png",
                abilities: {}
            },
            birdHands: {
                name: "Friendly Bird",
                cost: 2000,
                value: "birdHands",
                description: "When a card below 5 is drawn, you get 15% of the bet as bonus",
                armImagePath: "./imgs/dealers/bullocks-oriole.png",
                abilities: {
                    onCardDraw: { type: "numberedCardBonus", bonus: 0.15 }
                }
            },
            kittyDealer: {
                name: "Kitty Dealer",
                cost: 5000,
                value: "kittyDealer",
                description: "50% Dealer's first card is dealt face up",
                armImagePath: "./imgs/dealers/kitty.png",
                abilities: {
                    dealerFirst: { type: "revealFirstCard", chance: 0.50 }
                }
            },
            iceKing: {
                name: "Ice King",
                cost: 7500,
                value: "iceKing",
                description: "Dealer's first card is always 2-6",
                armImagePath: "./imgs/dealers/hand-ice.png",
                abilities: {
                    dealerFirst: { type: "constrainFirstCard", min: 2, max: 6 }
                }
            },
            goldHands: {
                name: "Gold Hands",
                cost: 10000,
                value: "goldHands",
                description: "If a face card is drawn, you get 15% of the bet as bonus",
                armImagePath: "./imgs/dealers/hand-gold.png",
                abilities: {
                    onCardDraw: { type: "faceCardBonus", bonus: 0.15 }
                }
            }
        };

        // Decks have more complex abilities that affect the deck composition and payout modifiers
        this.decks = {
            default: {
                name: "Standard Deck",
                cost: 0,
                value: "default",
                description: "A standard 52-card deck with classic card art",
                cardImagePath: "./imgs/decks/default/",
                abilities: {}
            },
            avianDeck: {
                name: "Avian Deck",
                cost: 2500,
                value: "avianDeck",
                description: "Bird themed cards<br>Completely random ranks. +25% payout.",
                cardImagePath: "./imgs/decks/avian/",
                abilities: {
                    deckComposition: { type: "randomizeCardValues" },
                    payout: { type: "increaseAllPayout", increase: 0.25 }
                }
            },
            vintageDeck: {
                name: "Vintage Deck",
                cost: 5000,
                value: "vintageDeck",
                description: "Vintage cards<br>no face cards. +25% payout.",
                cardImagePath: "./imgs/decks/vintage/",
                abilities: {
                    deckComposition: { type: "removeRanks", ranks: ['J', 'Q', 'K'] },
                    payout: { type: "increasePayout", increase: 0.25 }
                }
            },
            slimDeck: {
                name: "Slim Deck",
                cost: 7500,
                value: "slimDeck",
                description: "Removes all 2s and 3s with minimalist design. +10% payout.",
                cardImagePath: "./imgs/decks/slim/",
                abilities: {
                    deckComposition: { type: "removeRanks", ranks: ['2', '3'] },
                    payout: { type: "increasePayout", increase: 0.10 }
                }
            },
            royalDeck: {
                name: "Royal Deck",
                cost: 10000,
                value: "royalDeck",
                description: "Luxurious gold-trimmed cards. +20% face card chance. +10% payout",
                cardImagePath: "./imgs/decks/royal/",
                abilities: {
                    deckComposition: { type: "increaseFaceCards", increase: 0.20 },
                    payout: { type: "increasePayout", increase: 0.10 }
                }
            }
        };

        // Ownership & Equipment tracking
        this.owned = {
            themes: { default: true },
            dealers: { default: true },
            decks: { default: true }
        };

        this.equipped = {
            themes: 'default',
            dealers: 'default',
            decks: 'default'
        };

        // Pending equipment changes (applied after round ends)
        this.pendingEquipped = null;
    }

    // Get all items of a type
    getItemsByType(type) {
        if (type === 'themes') return this.themes;
        if (type === 'dealers') return this.dealers;
        if (type === 'decks') return this.decks;
        return {};
    }

    // Get specific item
    getItem(type, value) {
        return this.getItemsByType(type)[value];
    }

    // Check if owns item
    ownsItem(type, value) {
        return this.owned[type] && this.owned[type][value] === true;
    }

    // Get all owned items of type
    getOwnedByType(type) {
        const items = this.getItemsByType(type);
        const owned = {};
        for (let key in items) {
            if (this.ownsItem(type, key)) {
                owned[key] = items[key];
            }
        }
        return owned;
    }

    // Get equipped item value for type
    getEquipped(type) {
        return this.equipped[type];
    }

    isEquipped(type, value) {
        return this.equipped[type] === value;
    }

    // Equip item (must own)
    // If pending=true, queues change for after current round. If pending=false, applies immediately.
    equipItem(type, value, pending = false) {
        if (!this.ownsItem(type, value)) return false;

        if (pending) {
            // Queue the change for after round ends
            if (!this.pendingEquipped) {
                this.pendingEquipped = { ...this.equipped };
            }
            this.pendingEquipped[type] = value;
        } else {
            // Apply immediately
            this.equipped[type] = value;
        }
        return true;
    }

    // Check if there are pending equipment changes
    hasPendingChanges() {
        return this.pendingEquipped !== null;
    }

    // Commit pending equipment changes (call after round completes)
    commitPendingEquipment() {
        if (this.pendingEquipped) {
            this.equipped = { ...this.pendingEquipped };
            this.pendingEquipped = null;
        }
    }

    // Purchase item
    buyItem(type, value) {
        const item = this.getItem(type, value);

        if (!item) return { success: false, message: "Item not found" };
        if (this.ownsItem(type, value)) return { success: false, message: "Already own this" };
        if (type === 'themes' && this.player.level < item.level) return { success: false, message: `Requires level ${item.level}` };
        if (this.player.money < item.cost) return { success: false, message: "Not enough money" };

        // Themes are free but require level unlock
        if (type !== 'themes') {
            this.player.money -= item.cost;
        }

        if (!this.owned[type]) this.owned[type] = {};
        this.owned[type][value] = true;

        return { success: true, message: `Purchased ${item.name}!` };
    }

    // Get active abilities from equipped items
    getActiveAbilities() {
        return {
            theme: this.getItem('themes', this.equipped.themes)?.abilities || {},
            dealer: this.getItem('dealers', this.equipped.dealers)?.abilities || {},
            deck: this.getItem('decks', this.equipped.decks)?.abilities || {}
        };
    }

    getDeckPayoutModifier() {
        const deckAbilities = this.getItem('decks', this.equipped.decks)?.abilities || {};
        let modifier = 1.0;
        if (deckAbilities.payout?.type === 'increasePayout') {
            modifier += deckAbilities.payout.increase;
        }
        return modifier;
    }

    hasRedraws() {
        const themeAbilities = this.getItem('themes', this.equipped.themes)?.abilities || {};
        return themeAbilities.onDraw?.type === 'allowRedraw' ? themeAbilities.onDraw.perHand : 0;
    }

    getMaxBetReduction() {
        const themeAbilities = this.getItem('themes', this.equipped.themes)?.abilities || {};
        return themeAbilities.betReduction?.type === 'maxBetReduction' ? themeAbilities.betReduction.value : 0;
    }

    // Load from DB
    async loadFromDb(uid) {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().store) {
                const data = docSnap.data().store;
                this.owned = data.owned || this.owned;
                this.equipped = data.equipped || this.equipped;
            }
        } catch (error) {
            console.error("Error loading store:", error);
        }
    }

    // Save to DB (only saves owned and equipped, not pending changes)
    async saveToDb(uid) {
        try {
            const docRef = doc(db, "users", uid);
            await setDoc(docRef, {
                store: {
                    owned: this.owned,
                    equipped: this.equipped
                }
            }, { merge: true });
        } catch (error) {
            console.error("Error saving store:", error);
        }
    }

    // Reset store to defaults
    reset() {
        this.owned = {
            themes: { default: true },
            dealers: { default: true },
            decks: { default: true }
        };

        this.equipped = {
            themes: 'default',
            dealers: 'default',
            decks: 'default'
        };

        this.pendingEquipped = null;
    }
}