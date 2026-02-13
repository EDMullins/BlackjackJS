import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { app, auth } from "./firebase-config.js"; // Import the 'app' instance
const db = getFirestore(app); // Initialize Firestore with the app instance

export class Player {
    constructor() {
        // Player Data
        this.xp = 0;
        this.level = 0;
        this.multiplier = 1;
        this.money = 100;
        this.wins = 0;
        this.losses = 0;
        //After you lose all your money, you can start a new round with 100 money, but you will lose all your multiplier.
        this.moneyOnNewRound = 100 + (this.level * 20);
        this.xpToNextLvl = 100 * (this.level * 1.5);
        

        onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                // Now you can safely fetch data
                this.GetPlayerData(uid).then(data => {
                    if (data) {
                        console.log("Player data:", data);
                        // Use player data to initialize your game or UI
                    } else {
                        console.log("No player data found, creating new one...");
                        // Potentially create new player data if none exists
                    }
                }).catch(error => {
                    console.error("Error getting player data:", error);
                });
            } else {
                // User is signed out
                console.log("No user signed in.");
            }
        });
    }

    async GetPlayerData(uid) {
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

    async PutPlayerData(uid, data) {
        const docRef = doc(db, "users", uid);
        await setDoc(docRef, data);
    }
}