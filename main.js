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
            // Long press detected, do nothing until pointerup
        }, 500);
    } else if (e.button === 2) {
        contextMenu.style.display = "flex";
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") {
        clearTimeout(pressTimer);
        const endX = e.clientX;
        const endY = e.clientY;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        if (distance < 10) { // Threshold to differentiate between tap and drag
            contextMenu.style.display = "flex";
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
        }
    }
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

addButton.addEventListener("pointerenter", () => {
    addSubmenu.style.display = "flex";
    const rect = addButton.getBoundingClientRect();
    addSubmenu.style.left = `${rect.right - 5}px`;
    addSubmenu.style.top = `${rect.top}px`;
});

contextMenu.addEventListener("pointerleave", () => {
    contextMenu.style.display = "none";
    addSubmenu.style.display = "none";
});
