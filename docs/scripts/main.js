import { Game } from "./Game.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const game = new Game();
    game.start();
    console.log("DOM fully loaded and parsed");
});