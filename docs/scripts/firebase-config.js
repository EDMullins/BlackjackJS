// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSmFjkA1Fll8d5QbJdOmPrxlk6uBa79a0",
    authDomain: "blackjack-db-32768.firebaseapp.com",
    projectId: "blackjack-db-32768",
    storageBucket: "blackjack-db-32768.firebasestorage.app",
    messagingSenderId: "853361907185",
    appId: "1:853361907185:web:d350f53c683140694fa050",
    measurementId: "G-18KQ3Z3GYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize auth with the app instance
const analytics = getAnalytics(app); // Initialize analytics with the app
export { app };
export { auth };
export { analytics };