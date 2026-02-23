import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { auth } from "./firebase-config.js";

const db = getFirestore();

export class AuthController {
    constructor(ui) {
        this.ui = ui;
    }

    init(game) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.ui.loginMenuBtn.textContent = "Logout";
                this.ui.loginMenuBtn.onclick = () => this.logout(game);

                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    Object.assign(game.player, docSnap.data());
                }

                game.reset();
                this.ui.updatePlayerData(game.player);
            } else {
                this.ui.loginMenuBtn.textContent = "Login";
                game.player.resetData();
                game.reset();
                this.ui.updatePlayerData(game.player);
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

    async savePlayerData(player, uid) {
        if (!uid) return;

        const docRef = doc(db, "users", uid);
        await setDoc(docRef, {
            xp: player.xp,
            level: player.level,
            multiplier: player.multiplier,
            money: player.money,
            wins: player.wins,
            losses: player.losses,
            moneyOnNewRound: player.moneyOnNewRound,
            xpToNextLvl: player.xpToNextLvl
        });
    }

    logout(game) {
        signOut(auth);
        game.player.resetData();
        game.reset();
    }
}