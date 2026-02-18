import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { app, auth } from "./firebase-config.js"; // Import the 'app' instance
const db = getFirestore(app); // Initialize Firestore with the app instance

export class Player {
    constructor(onDataLoaded) {
        // Player Data
        this.xp = 0;
        this.level = 0;
        this.multiplier = 1;
        this.money = 100;
        this.wins = 0;
        this.losses = 0;
        this.moneyOnNewRound = 100;
        this.xpToNextLvl = 100;
        this.loggedIn = false;
        this.uid = null;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.loggedIn = true;
                this.uid = user.uid;
                // Now you can safely fetch data for the logged-in user
                this.GetPlayerData(this.uid).then(data => {
                    if (data) {
                        console.log("Player data:", data);
                        this.xp = data.xp || 0;
                        this.level = data.level || 0;
                        this.multiplier = data.multiplier || 1;
                        this.money = data.money || 100;
                        this.wins = data.wins || 0;
                        this.losses = data.losses || 0;
                        this.moneyOnNewRound = data.moneyOnNewRound || 100;
                        this.xpToNextLvl = data.xpToNextLvl || 100;
                    }
                    // Call the onDataLoaded callback after data is fetched and player properties are set
                    if (onDataLoaded) onDataLoaded();
                }).catch(error => {
                    console.error("Error getting player data:", error);
                    if (onDataLoaded) onDataLoaded();
                });
            } else {
                // User is signed out
                console.log("No user signed in.");
                this.loggedIn = false;
                this.uid = null;
                if (onDataLoaded) onDataLoaded();
            }
        });
    }

    async GetPlayerData(uid) {
        if (!uid) return null;
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        }
        catch (error) {
            console.error("Error getting player data:", error);
            return null;
        }
    }

    async PutPlayerData() {
        if (this.loggedIn && this.uid) {
            const data = {
                xp: this.xp,
                level: this.level,
                multiplier: this.multiplier,
                money: this.money,
                wins: this.wins,
                losses: this.losses,
                moneyOnNewRound: this.moneyOnNewRound,
                xpToNextLvl: this.xpToNextLvl
            };
            if (!this.uid) return;
            const docRef = doc(db, "users", this.uid);
            await setDoc(docRef, data);
        }
        else {
            console.log("No user signed in. Cannot update player data.");
        }
    }

    action(winner, betAmount) {
        if (winner === 1) {
            this.wins++;
            this.money += betAmount * 2;
            this.xp += 50 * this.multiplier;
            this.multiplier += betAmount / this.money;
            console.log(`You won ${betAmount}, Multiplier increased to ${this.multiplier.toFixed(2)} XP gained ${(50 * this.multiplier).toFixed(2)}`);
        }
        else if (winner === 0) {
            this.losses++;
            this.money -= betAmount;
            this.xp += 20;
        }
        else {//tie
            this.xp += 20 * this.multiplier;
        }
        this.checkLevelUp();
        this.PutPlayerData();
    }

    checkLevelUp() {
        if (this.xp >= this.xpToNextLvl) {
            this.level++;
            this.xp = 0;
            this.moneyOnNewRound = 100 + (this.level * 20);
            this.xpToNextLvl = 100 * (this.level * 1.5);
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
    }
}