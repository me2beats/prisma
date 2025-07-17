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
let startX, startY;

canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
        startX = e.clientX;
        startY = e.clientY;
        pressTimer = window.setTimeout(() => {
            const distance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
            if (distance < 10) { // Threshold to differentiate between tap and drag
                contextMenu.style.display = "flex";
                contextMenu.style.left = `${startX}px`;
                contextMenu.style.top = `${startY}px`;
            }
            pressTimer = null;
        }, 500);
    } else if (e.button === 2) {
        contextMenu.style.display = "flex";
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") {
        if (pressTimer) {
            clearTimeout(pressTimer);
        }
    }
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
