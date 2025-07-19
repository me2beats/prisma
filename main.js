import { createScene, createTriangle, createQuad, createCube } from './scene.js';
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

    if (mode === "navigate") {
        if (activeModes.includes("navigate")) {
            camera.attachControl(canvas, true);
        } else {
            camera.detachControl(canvas);
        }
    }
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

const fileButton = document.getElementById("file-button");
const fileMenu = document.getElementById("file-menu");

fileButton.addEventListener("click", () => {
    fileMenu.style.display = fileMenu.style.display === "flex" ? "none" : "flex";
});

const exportButton = document.getElementById("export-gltf");
exportButton.addEventListener("click", () => {
    fileMenu.style.display = "none";
    log("Starting export...");
    const meshesToExport = scene.meshes.filter(mesh => mesh.name !== "lineSystem" && mesh.name !== "axisX" && mesh.name !== "axisZ");
    log(`Exporting ${meshesToExport.length} meshes...`);
    BABYLON.GLTF2Export.GLBAsync(scene, "scene", {
        shouldExportNode: (node) => meshesToExport.includes(node)
    }).then((glb) => {
        log("Export successful.");
        const blob = new Blob([glb.glTFFiles["scene.glb"]], {type: "application/octet-stream"});
        log("Blob created.");
        const url = URL.createObjectURL(blob);
        log(`Blob URL created: ${url}`);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scene.glb";
        a.click();
        log("Download initiated.");
        URL.revokeObjectURL(url);
        log("Blob URL revoked.");
    }).catch((error) => {
        log(`Export failed: ${error.message}`);
    });
});

const importButton = document.getElementById("import-gltf");
importButton.addEventListener("click", () => {
    fileMenu.style.display = "none";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gltf, .glb";
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            log("No file selected.");
            return;
        }
        log(`File selected: ${file.name}`);

        try {
            log("Reading file content...");
            const fileContent = await file.arrayBuffer();
            log("File content read successfully.");

            const fileData = new Blob([fileContent]);
            const url = URL.createObjectURL(fileData);
            log(`Blob URL created: ${url}`);

            log("Starting mesh import...");
            BABYLON.SceneLoader.Append(url, "", scene, (loadedScene) => {
                const importedMeshes = loadedScene.meshes.filter(mesh => mesh.name !== "lineSystem" && mesh.name !== "axisX" && mesh.name !== "axisZ");
                log(`Meshes imported successfully: ${importedMeshes.length} meshes found.`);
                log("Applying material to meshes...");
                const material = new BABYLON.StandardMaterial("importedMat", scene);
                material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                importedMeshes.forEach(mesh => {
                    mesh.material = material;
                });
                log("Material applied.");

                if (importedMeshes.length > 0) {
                    const boundingBox = BABYLON.BoundingBox.FromMeshes(importedMeshes);
                    camera.target = boundingBox.center;
                    camera.radius = boundingBox.extendSize.length() * 2;
                    log("Camera centered on imported meshes.");
                }

                URL.revokeObjectURL(url);
                log("Blob URL revoked.");
            }, null, (scene, message, exception) => {
                log(`Error importing mesh: ${message}`);
                URL.revokeObjectURL(url);
                log("Blob URL revoked.");
            }, ".glb");
        } catch (error) {
            log(`Error importing mesh: ${error.message}`);
        }
    };
    input.click();
});

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
        fileMenu.style.display = "none";
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
    } else if (e.target.textContent === "Quad") {
        createQuad(scene);
    } else if (e.target.textContent === "Cube") {
        createCube(scene);
    }
    contextMenu.style.display = "none";
    addSubmenu.style.display = "none";
});
