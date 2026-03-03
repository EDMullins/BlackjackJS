import { Game } from "./Game.js";
import { UIController } from "./UIController.js";
import { AuthController } from "./AuthController.js";

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UIController();
    const auth = new AuthController(ui);
    const game = new Game(ui, auth);
    ui.connectGame(game, auth);
    ui.renderThemes();
    game.reset();
});