import { createScene } from './scene.js';
import { createGrid } from './grid.js';
import { createAxes } from './axes.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const scene = createScene(engine, canvas);
const size = 50;

createGrid(scene, size);
createAxes(scene, size);

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});

const contextMenu = document.getElementById("context-menu");
const addSubmenu = document.getElementById("add-submenu");
const addButton = document.getElementById("add");

let pressTimer;

canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 2 || e.pointerType === "touch") {
        pressTimer = window.setTimeout(() => {
            contextMenu.style.display = "flex";
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
        }, 500);
    }
});

canvas.addEventListener("pointerup", (e) => {
    clearTimeout(pressTimer);
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

addButton.addEventListener("pointerenter", () => {
    addSubmenu.style.display = "flex";
    const rect = addButton.getBoundingClientRect();
    addSubmenu.style.left = `${rect.right}px`;
    addSubmenu.style.top = `${rect.top}px`;
});

contextMenu.addEventListener("pointerleave", () => {
    contextMenu.style.display = "none";
    addSubmenu.style.display = "none";
});
