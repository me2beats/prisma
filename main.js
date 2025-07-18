import { createScene, createTriangle } from './scene.js';
import { createGrid } from './grid.js';
import { createAxes } from './axes.js';
import { log } from './logger.js';
import "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const { scene, camera } = createScene(engine, canvas);
const size = 50;

createGrid(scene, size);
createAxes(scene, size);

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});

import { initializeToolbar, activeModes, selectedMeshes } from './toolbar.js';

const highlightLayer = new BABYLON.HighlightLayer("hl1", scene);

initializeToolbar(camera, canvas);

import { initializeFileIO } from './file-io.js';

initializeFileIO(scene, camera);

const contextMenu = document.getElementById("context-menu");
const addSubmenu = document.getElementById("add-submenu");
const addButton = document.getElementById("add");

let pressTimer;
let startX, startY;
let isDragging = false;
let menuJustOpened = false;

canvas.addEventListener("pointerdown", (e) => {
    // Context menu on right-click or long-press
    if (e.button === 2 || (e.pointerType === "touch" && e.button === 0)) {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        pressTimer = window.setTimeout(() => {
            if (!isDragging) {
                contextMenu.style.display = "flex";
                contextMenu.style.left = `${e.clientX}px`;
                contextMenu.style.top = `${e.clientY}px`;
                menuJustOpened = true;
            }
        }, 500);
    }

    // Main interaction logic
    if (e.button === 0) {
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY);

        // Selection
        if (activeModes.includes("select")) {
            if (pickInfo.hit && pickInfo.pickedMesh.name !== "lineSystem" && pickInfo.pickedMesh.name !== "axisX" && pickInfo.pickedMesh.name !== "axisZ") {
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
                    pointerDragBehavior.enabled = activeModes.includes("translate");
                    mesh.addBehavior(pointerDragBehavior);
                }
                return; // Prevent other actions when selecting
            }
        }

        // Translation
        if (activeModes.includes("translate") && pickInfo.hit && selectedMeshes.includes(pickInfo.pickedMesh)) {
            // Handled by PointerDragBehavior, but we need to prevent navigation
            return;
        }
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
    if (!e.target.closest(".context-menu") && !e.target.closest("#gui")) {
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
