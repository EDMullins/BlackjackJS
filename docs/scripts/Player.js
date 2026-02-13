import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { app, auth } from "./firebase-config.js"; // Import the 'app' instance
const db = getFirestore(app); // Initialize Firestore with the app instance

console.log("Firestore db:", db);
export class Player {
    constructor() {
        this.xp = 0;
        this.level = 0;
        this.xpToNextLvl = 100;
        this.money = 100;
        //After you lose all your money, you can start a new round with 100 money, but you will lose all your multiplier.
        this.moneyOnNewRound = 100;
        this.multiplier = 1;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, get their UID
                const uid = user.uid;
                console.log("User signed in with UID:", uid);

                // Now you can safely create a Player instance and fetch data
                const player = new Player();
                player.GetPlayerData(uid).then(data => {
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

                // You might want to initialize your Game class here, passing the uid
                // const game = new Game(uid); // If Game constructor expects uid
            } else {
                // User is signed out
                console.log("No user signed in.");
                // Redirect to login page or show sign-in UI
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