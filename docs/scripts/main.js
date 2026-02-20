import { Game } from "./Game.js";

document.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");
    const game = new Game();
    game.start();
});