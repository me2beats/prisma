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

let activeModes = ["navigate"];
const selectedMeshes = [];
const highlightLayer = new BABYLON.HighlightLayer("hl1", scene);

const navigateButton = document.getElementById("navigate");
const selectButton = document.getElementById("select");
const translateButton = document.getElementById("translate");
const toolbarButtons = [navigateButton, selectButton, translateButton];

function updateToolbar() {
    toolbarButtons.forEach(button => {
        if (activeModes.includes(button.id)) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

function toggleMode(mode) {
    const index = activeModes.indexOf(mode);
    if (index === -1) {
        activeModes.push(mode);
    } else {
        activeModes.splice(index, 1);
    }
    updateToolbar();
    updateDragBehavior();
}

function updateDragBehavior() {
    const translateEnabled = activeModes.includes("translate");
    selectedMeshes.forEach(mesh => {
        const behavior = mesh.behaviors.find(b => b.name === "PointerDrag");
        if (behavior) behavior.enabled = translateEnabled;
    });
}

navigateButton.addEventListener("click", () => toggleMode("navigate"));
selectButton.addEventListener("click", () => toggleMode("select"));
translateButton.addEventListener("click", () => toggleMode("translate"));

updateToolbar();

const contextMenu = document.getElementById("context-menu");
const addSubmenu = document.getElementById("add-submenu");
const addButton = document.getElementById("add");

let pressTimer;
let startX, startY;
let isDragging = false;
let menuJustOpened = false;

canvas.addEventListener("pointerdown", (e) => {
    const pickInfo = scene.pick(scene.pointerX, scene.pointerY);

    if (e.pointerType === "touch") {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        pressTimer = window.setTimeout(() => {
            pressTimer = null; // Timer finished, but don't show menu yet
        }, 500);
    } else if (e.button === 2) { // Right-click
        contextMenu.style.display = "flex";
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    } else if (e.button === 0) { // Left-click
        if (activeModes.includes("translate") && pickInfo.hit && selectedMeshes.includes(pickInfo.pickedMesh)) {
            // Dragging selected mesh handled by PointerDragBehavior
        } else if (activeModes.includes("select")) {
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
            }
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
