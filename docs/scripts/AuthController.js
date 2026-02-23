import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

export class AuthController {
    constructor(ui) {
        this.ui = ui;
    }

    init(game) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.ui.loginMenuBtn.textContent = "Logout";
                this.ui.loginMenuBtn.onclick = () => this.logout(game);
                game.reset();
            } else {
                this.ui.loginMenuBtn.textContent = "Login";
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

    logout(game) {
        signOut(auth);
        game.player.resetData();
        game.reset();
    }
}