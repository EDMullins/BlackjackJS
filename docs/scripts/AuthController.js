import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { auth } from "./firebase-config.js";

const db = getFirestore();

export class AuthController {
    constructor(ui) {
        this.ui = ui;
        this.currentUid = null;
    }

    init(game) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUid = user.uid;
                this.ui.loginMenuBtn.textContent = "Logout";
                this.ui.loginMenuBtn.onclick = async () => await this.logout(game);

                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // Load player data
                    const data = docSnap.data();
                    Object.assign(game.player, data);
                }
                
                // Load store data FIRST before rendering
                if (this.ui.store) {
                    await this.ui.store.loadFromDb(user.uid);
                }

                await game.reset();
                this.ui.updatePlayerData(game.player);
                
                // Get theme from store equipment, not player data
                const equippedTheme = this.ui.store.getEquipped('themes');
                this.ui.setItem('themes', equippedTheme);
                
                // Render store items AFTER everything is loaded
                this.ui.renderStoreItems();
            } else {
                this.currentUid = null;
                this.ui.loginMenuBtn.textContent = "Login";
                game.player.resetData();
                await game.reset();
                this.ui.updatePlayerData(game.player);
                this.ui.setItem('themes', "default");

                this.ui.loginMenuBtn.onclick = () => {
                    this.ui.loginSection.classList.toggle('hidden');
                };
            }
        });
    }

    async login(email, password, msgElement) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            msgElement.textContent = "Login successful!";
            msgElement.style.color = "green";
        } catch (error) {
            msgElement.textContent = error.message;
            msgElement.style.color = "red";
        }
    }

    async register(email, password, msgElement) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            msgElement.textContent = "Registration successful!";
            msgElement.style.color = "green";
        } catch (error) {
            msgElement.textContent = error.message;
            msgElement.style.color = "red";
        }
    }

    async resetPassword(email, msgElement) {
        try {
            await sendPasswordResetEmail(auth, email);
            msgElement.textContent = "Reset email sent! Check your inbox.";
            msgElement.style.color = "green";
        } catch (error) {
            msgElement.textContent = error.message;
            msgElement.style.color = "red";
        }
    }

    async savePlayerData(player, uid) {
        if (!uid) return;
 
        const docRef = doc(db, "users", uid);
        // DO NOT SAVE theme anymore - it's managed by the store
        await setDoc(docRef, {
            xp: player.xp,
            level: player.level,
            multiplier: player.multiplier,
            money: player.money,
            wins: player.wins,
            losses: player.losses,
            moneyOnNewRound: player.moneyOnNewRound,
            xpToNextLvl: player.xpToNextLvl,
            winStreakHigh: player.winStreakHigh,
            gameWinsHigh: player.gameWinsHigh,
            abilityStates: player.abilityStates
        }, { merge: true });
 
        // Save store data separately
        if (this.ui.store) {
            await this.ui.store.saveToDb(uid);
        }
    }

    async logout(game) {
        signOut(auth);
        game.player.resetData();
        
        // Reset store to defaults
        if (this.ui.store) {
            this.ui.store.reset();
        }
        
        await game.reset();
        this.ui.setItem('themes', "default");
        this.ui.renderStoreItems();
    }
}