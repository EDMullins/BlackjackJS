import { Game } from "./Game.js";
import { UIController } from "./UIController.js";
import { AuthController } from "./AuthController.js";
import { Store } from "./Store.js";

document.addEventListener("DOMContentLoaded", async () => {
    const ui = new UIController();
    const auth = new AuthController(ui);
    const game = new Game(ui, auth);
    const store = new Store(game.player);

    ui.connectGame(game, auth, store);
    ui.bindGameEvents(game);
    ui.bindAuthEvents(auth);
    ui.renderStoreItems();
    await game.reset();
});