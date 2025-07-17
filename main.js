import { createScene, createTriangle } from './scene.js';
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

let currentMode = "navigate";
const selectedMeshes = [];
const highlightLayer = new BABYLON.HighlightLayer("hl1", scene);

const navigateButton = document.getElementById("navigate");
const selectButton = document.getElementById("select");
const translateButton = document.getElementById("translate");

navigateButton.addEventListener("click", () => {
    currentMode = "navigate";
    selectedMeshes.forEach(mesh => {
        const behavior = mesh.behaviors.find(b => b.name === "PointerDrag");
        if (behavior) behavior.enabled = false;
    });
});
selectButton.addEventListener("click", () => {
    currentMode = "select";
    selectedMeshes.forEach(mesh => {
        const behavior = mesh.behaviors.find(b => b.name === "PointerDrag");
        if (behavior) behavior.enabled = false;
    });
});
translateButton.addEventListener("click", () => {
    currentMode = "translate";
    selectedMeshes.forEach(mesh => {
        const behavior = mesh.behaviors.find(b => b.name === "PointerDrag");
        if (behavior) behavior.enabled = true;
    });
});

const contextMenu = document.getElementById("context-menu");
const addSubmenu = document.getElementById("add-submenu");
const addButton = document.getElementById("add");

let pressTimer;
let startX, startY;
let isDragging = false;
let menuJustOpened = false;

canvas.addEventListener("pointerdown", (e) => {
    if (currentMode === "select" && e.button === 0) {
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
        if (pickInfo.hit) {
            const mesh = pickInfo.pickedMesh;
            if (selectedMeshes.includes(mesh)) {
                const index = selectedMeshes.indexOf(mesh);
                selectedMeshes.splice(index, 1);
                highlightLayer.removeMesh(mesh);
                mesh.removeBehavior(mesh.behaviors.find(b => b.name === "PointerDrag"));
            } else {
                selectedMeshes.push(mesh);
                highlightLayer.addMesh(mesh, BABYLON.Color3.Green());
                const pointerDragBehavior = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,0,1)});
                mesh.addBehavior(pointerDragBehavior);
            }
        }
    } else if (e.pointerType === "touch") {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        pressTimer = window.setTimeout(() => {
            pressTimer = null; // Timer finished, but don't show menu yet
        }, 500);
    } else if (e.button === 2) {
        contextMenu.style.display = "flex";
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" && pressTimer) {
        const distance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        if (distance > 10) {
            isDragging = true;
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") {
        if (pressTimer === null && !isDragging) {
            contextMenu.style.display = "flex";
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
            menuJustOpened = true;
        }
        clearTimeout(pressTimer);
    }
});

window.addEventListener("pointerup", (e) => {
    if (menuJustOpened) {
        menuJustOpened = false;
        return;
    }
    if (!e.target.closest(".context-menu")) {
        contextMenu.style.display = "none";
        addSubmenu.style.display = "none";
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

addSubmenu.addEventListener("click", (e) => {
    if (e.target.textContent === "Triangle") {
        createTriangle(scene);
    }
    contextMenu.style.display = "none";
    addSubmenu.style.display = "none";
});
