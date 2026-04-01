// Store.js
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const db = getFirestore();

export class Store {
    constructor(player) {
        this.player = player;
        
        // Catalog of all items
        this.themes = {
            default: {
                name: "Default",
                cost: 0,
                level: 0,
                value: "default",
                description: "The classic green felt theme",
                abilities: {}
            },
            light: {
                name: "Light",
                cost: 10,
                level: 1,
                value: "light",
                description: "A light, minimalist theme",
                abilities: {}
            },
            dark: {
                name: "Dark",
                cost: 50,
                level: 2,
                value: "dark",
                description: "A dark, sleek theme",
                abilities: {}
            },
            gambler: {
                name: "Gambler",
                cost: 2000,
                level: 5,
                value: "gambler",
                description: "On a loss, keep 25% of the bet",
                abilities: {
                    onLoss: { type: "keepBetPercentage", value: 0.25 }
                }
            },
            ironWallet: {
                name: "Iron Wallet",
                cost: 2500,
                level: 8,
                value: "ironWallet",
                description: "Never lose more than 40% of total money in a single hand. Max bet reduced by 30%.",
                abilities: {
                    lossLimit: { type: "maxLossPercentage", value: 0.40 },
                    betReduction: { type: "maxBetReduction", value: 0.30 }
                }
            },
            luckyStreak: {
                name: "Lucky Streak",
                cost: 2500,
                level: 7,
                value: "luckyStreak",
                description: "After 3 wins, next win gives +50% payout. After 2 losses, next loss costs +25%.",
                abilities: {
                    onWin: { type: "streakBonus", winsRequired: 3, bonus: 0.50 },
                    onLoss: { type: "streakPenalty", lossesRequired: 2, penalty: 0.25 }
                }
            },
            paradisePink: {
                name: "Paradise Pink",
                cost: 3000,
                level: 10,
                value: "paradisePink",
                description: "Once per hand, redraw a card you just drew",
                abilities: {
                    onDraw: { type: "allowRedraw", perHand: 1 }
                }
            }
        };

        this.dealers = {
            default: {
                name: "Default Dealer",
                cost: 0,
                level: 0,
                value: "default",
                description: "The classic dealer hand",
                armImagePath: "./imgs/hand.png",
                abilities: {}
            },
            luckyHand: {
                name: "Lucky Hand",
                cost: 1500,
                level: 4,
                value: "luckyHand",
                description: "Non-face cards have 20% chance to swap to face card when drawn",
                armImagePath: "./imgs/hand-lucky.png",
                abilities: {
                    onCardDraw: { type: "nonFaceCardSwap", chance: 0.20 }
                }
            },
            fortuneTeller: {
                name: "Fortune Teller",
                cost: 2000,
                level: 6,
                value: "fortuneTeller",
                description: "Dealer's first card is dealt face up",
                armImagePath: "./imgs/hand-fortune.png",
                abilities: {
                    dealerFirst: { type: "revealFirstCard" }
                }
            },
            iceKing: {
                name: "Ice King",
                cost: 1800,
                level: 5,
                value: "iceKing",
                description: "Dealer's first card is always 2-6",
                armImagePath: "./imgs/hand-ice.png",
                abilities: {
                    dealerFirst: { type: "constrainFirstCard", min: 2, max: 6 }
                }
            },
            goldHands: {
                name: "Gold Hands",
                cost: 2200,
                level: 7,
                value: "goldHands",
                description: "When dealer draws face cards, you get 20% of the bet as bonus",
                armImagePath: "./imgs/hand-gold.png",
                abilities: {
                    dealerDraw: { type: "faceCardBonus", bonus: 0.20 }
                }
            },
            humbleHands: {
                name: "Humble Hands",
                cost: 2000,
                level: 6,
                value: "humbleHands",
                description: "When dealer draws numbered cards, you get 15% of the bet as bonus",
                armImagePath: "./imgs/hand-humble.png",
                abilities: {
                    dealerDraw: { type: "numberedCardBonus", bonus: 0.15 }
                }
            }
        };

        this.decks = {
            default: {
                name: "Standard Deck",
                cost: 0,
                level: 0,
                value: "default",
                description: "A standard 52-card deck with classic card art",
                cardImagePath: "./imgs/default/",
                abilities: {}
            },
            royalDeck: {
                name: "Royal Deck",
                cost: 2000,
                level: 5,
                value: "royalDeck",
                description: "Luxurious gold-trimmed cards. +15% face card chance. Blackjack pays +25%.",
                cardImagePath: "./imgs/royal/",
                abilities: {
                    deckComposition: { type: "increaseFaceCards", increase: 0.15 },
                    blackjackPayout: { type: "increaseBlackjackPayout", increase: 0.25 }
                }
            },
            slimDeck: {
                name: "Slim Deck",
                cost: 1800,
                level: 4,
                value: "slimDeck",
                description: "Removes all 2s and 3s with minimalist design. +10% payout.",
                cardImagePath: "./imgs/slim/",
                abilities: {
                    deckComposition: { type: "removeRanks", ranks: ['2', '3'] },
                    payout: { type: "increaseAllPayout", increase: 0.10 }
                }
            },
            hoboDeck: {
                name: "Hobo Deck",
                cost: 2200,
                level: 6,
                value: "hoboDeck",
                description: "Worn, vintage cards with no face cards. +25% payout.",
                cardImagePath: "./imgs/hobo/",
                abilities: {
                    deckComposition: { type: "removeRanks", ranks: ['J', 'Q', 'K'] },
                    payout: { type: "increaseAllPayout", increase: 0.25 }
                }
            },
            wildDeck: {
                name: "Wild Deck",
                cost: 2500,
                level: 8,
                value: "wildDeck",
                description: "Neon psychedelic cards with random properties. +25% payout.",
                cardImagePath: "./imgs/wild/",
                abilities: {
                    deckComposition: { type: "randomizeCardValues" },
                    payout: { type: "increaseAllPayout", increase: 0.25 }
                }
            },
            cosmicDeck: {
                name: "Cosmic Deck",
                cost: 1600,
                level: 5,
                value: "cosmic",
                description: "Space-themed mystical cards with star designs",
                cardImagePath: "./imgs/cosmic/",
                abilities: {}
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

    // Equip item (must own)
    equipItem(type, value) {
        if (!this.ownsItem(type, value)) return false;
        this.equipped[type] = value;
        return true;
    }

    // Purchase item
    buyItem(type, value) {
        const item = this.getItem(type, value);
        
        if (!item) return { success: false, message: "Item not found" };
        if (this.ownsItem(type, value)) return { success: false, message: "Already own this" };
        if (this.player.money < item.cost) return { success: false, message: "Not enough money" };

        this.player.money -= item.cost;
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

    // Save to DB
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
}