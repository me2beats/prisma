import { createScene, createTriangle, createQuad, createCube } from './scene.js';
import { createGrid } from './grid.js';
import { createAxes } from './axes.js';
import { log } from './logger.js';
import "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js";
import { init as initActionManager, addAction, undo, redo } from './undoManager.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const { scene, camera } = createScene(engine, canvas);
const size = 50;

createGrid(scene, size);
createAxes(scene, size);

engine.runRenderLoop(function () {
    scene.render();
});

scene.onBeforeRenderObservable.add(() => {
    const scale = 0.05;
    selectedVertices.forEach(v => {
        const distance = BABYLON.Vector3.Distance(v.highlight.position, camera.position);
        v.highlight.scaling.x = distance * scale;
        v.highlight.scaling.y = distance * scale;
        v.highlight.scaling.z = distance * scale;
    });
});

window.addEventListener("resize", function () {
    engine.resize();
});

let activeModes = ["navigate"];
const selectedMeshes = [];
const selectedVertices = [];
const selectedEdges = [];
const selectedFaces = [];
const highlightLayer = new BABYLON.HighlightLayer("hl1", scene);

const navigateButton = document.getElementById("navigate");
const selectButton = document.getElementById("select");
const translateButton = document.getElementById("translate");
const selectVertexButton = document.getElementById("select-vertex");
const selectEdgeButton = document.getElementById("select-edge");
const selectFaceButton = document.getElementById("select-face");
const toolbarButtons = [navigateButton, selectButton, translateButton, selectVertexButton, selectEdgeButton, selectFaceButton];

function updateToolbar() {
    toolbarButtons.forEach(button => {
        if (activeModes.includes(button.id)) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

function updateFaceHighlights() {
    selectedFaces.forEach(face => {
        face.highlight.dispose();
        const positions = face.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = face.mesh.getIndices();
        const i1 = indices[face.faceId * 3];
        const i2 = indices[face.faceId * 3 + 1];
        const i3 = indices[face.faceId * 3 + 2];
        const p1 = new BABYLON.Vector3(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
        const p2 = new BABYLON.Vector3(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
        const p3 = new BABYLON.Vector3(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);
        const transformedP1 = BABYLON.Vector3.TransformCoordinates(p1, face.mesh.getWorldMatrix());
        const transformedP2 = BABYLON.Vector3.TransformCoordinates(p2, face.mesh.getWorldMatrix());
        const transformedP3 = BABYLON.Vector3.TransformCoordinates(p3, face.mesh.getWorldMatrix());
        face.highlight = createFaceHighlight(transformedP1, transformedP2, transformedP3);
    });
}

function updateEdgeHighlights() {
    selectedEdges.forEach(edge => {
        edge.highlight.dispose();
        const positions = edge.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const p1 = new BABYLON.Vector3(positions[edge.indices[0] * 3], positions[edge.indices[0] * 3 + 1], positions[edge.indices[0] * 3 + 2]);
        const p2 = new BABYLON.Vector3(positions[edge.indices[1] * 3], positions[edge.indices[1] * 3 + 1], positions[edge.indices[1] * 3 + 2]);
        const transformedP1 = BABYLON.Vector3.TransformCoordinates(p1, edge.mesh.getWorldMatrix());
        const transformedP2 = BABYLON.Vector3.TransformCoordinates(p2, edge.mesh.getWorldMatrix());

        edge.highlight = createEdgeHighlight(transformedP1, transformedP2);
    });
}

function toggleMode(mode) {
    const selectionModes = ["select", "select-vertex", "select-edge", "select-face"];

    if (selectionModes.includes(mode)) {
        // Deactivate all other selection modes
        selectionModes.forEach(m => {
            if (m !== mode) {
                const idx = activeModes.indexOf(m);
                if (idx !== -1) {
                    activeModes.splice(idx, 1);
                }
            }
        });
    }

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
selectVertexButton.addEventListener("click", () => toggleMode("select-vertex"));
selectEdgeButton.addEventListener("click", () => toggleMode("select-edge"));
selectFaceButton.addEventListener("click", () => toggleMode("select-face"));

updateToolbar();

const fileButton = document.getElementById("file-button");
const fileMenu = document.getElementById("file-menu");
const settingsButton = document.querySelector("#gui button:nth-child(2)");
const settingsWindow = document.getElementById("settings-window");
const closeSettingsButton = document.getElementById("close-settings");
const settingsCategories = document.getElementById("settings-categories");
const settingsContent = document.getElementById("settings-content");

fileButton.addEventListener("click", () => {
    fileMenu.style.display = fileMenu.style.display === "flex" ? "none" : "flex";
});

function openSettings() {
    settingsWindow.style.display = "flex";
}

function closeSettings() {
    settingsWindow.style.display = "none";
}

settingsButton.addEventListener("click", openSettings);
closeSettingsButton.addEventListener("click", closeSettings);
settingsWindow.addEventListener("click", (e) => {
    if (e.target === settingsWindow) {
        closeSettings();
    }
});

settingsCategories.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
        const category = e.target.dataset.category;

        // Update active button
        const buttons = settingsCategories.querySelectorAll("button");
        buttons.forEach(button => button.classList.remove("active"));
        e.target.classList.add("active");

        // Show correct settings
        const allSettings = settingsContent.querySelectorAll(".settings-category");
        allSettings.forEach(s => s.style.display = "none");
        document.getElementById(category).style.display = "block";
    }
});

const vertexSelectionRadiusSlider = document.getElementById("vertex-selection-radius");
const vertexSelectionRadiusValue = document.getElementById("vertex-selection-radius-value");

vertexSelectionRadiusSlider.addEventListener("input", (e) => {
    vertexSelectionRadius = parseInt(e.target.value, 10);
    vertexSelectionRadiusValue.textContent = vertexSelectionRadius;
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
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const statusBar = document.getElementById("status-bar");
const hintBar = document.getElementById("hint-bar");

function updateStatusBar() {
    const userMeshes = scene.meshes.filter(m => m.name !== "lineSystem" && m.name !== "axisX" && m.name !== "axisZ" && !m.name.startsWith("vertex_highlight"));
    const totalMeshes = userMeshes.length;
    const selectedMeshesCount = selectedMeshes.length;
    const totalVertices = userMeshes.reduce((total, mesh) => total + mesh.getTotalVertices(), 0);
    const selectedVerticesCount = selectedVertices.length;
    const selectedEdgesCount = selectedEdges.length;
    const selectedFacesCount = selectedFaces.length;

    statusBar.textContent = `Meshes: ${selectedMeshesCount}/${totalMeshes}, Vertices: ${selectedVerticesCount}/${totalVertices}, Edges: ${selectedEdgesCount}, Faces: ${selectedFacesCount}`;
}

hintBar.textContent = "long tap to open context menu";

let vertexSelectionRadius = 100;

function getClosestVertex(mesh, screenPoint) {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    let minDistance = Infinity;
    let closestVertexIndex = -1;

    for (let i = 0; i < positions.length; i += 3) {
        const vertex = new BABYLON.Vector3(positions[i], positions[i+1], positions[i+2]);
        const projectedPoint = BABYLON.Vector3.Project(
            vertex,
            mesh.getWorldMatrix(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
        );

        const distance = BABYLON.Vector2.Distance(new BABYLON.Vector2(projectedPoint.x, projectedPoint.y), screenPoint);
        if (distance < minDistance) {
            minDistance = distance;
            closestVertexIndex = i / 3;
        }
    }

    if (minDistance > vertexSelectionRadius) {
        return -1;
    }

    return closestVertexIndex;
}

function createVertexHighlight(position) {
    const sphere = BABYLON.MeshBuilder.CreateSphere("vertex_highlight", {diameter: 0.1}, scene);
    sphere.position = position;
    const material = new BABYLON.StandardMaterial("vertex_highlight_mat", scene);
    material.disableLighting = true;
    material.emissiveColor = new BABYLON.Color3(1, 0, 0);
    sphere.material = material;
    sphere.isPickable = false;
    sphere.name = "vertex_highlight_sphere";
    return sphere;
}

function getClosestEdge(mesh, screenPoint) {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = mesh.getIndices();
    let minDistance = Infinity;
    let closestEdge = null;

    for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i+1];
        const i3 = indices[i+2];

        const p1 = new BABYLON.Vector3(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
        const p2 = new BABYLON.Vector3(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
        const p3 = new BABYLON.Vector3(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

        const edges = [
            { p1, p2, indices: [i1, i2] },
            { p1: p2, p2: p3, indices: [i2, i3] },
            { p1: p3, p2: p1, indices: [i3, i1] },
        ];

        edges.forEach(edge => {
            const proj1 = BABYLON.Vector3.Project(edge.p1, mesh.getWorldMatrix(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
            const proj2 = BABYLON.Vector3.Project(edge.p2, mesh.getWorldMatrix(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

            const dist = BABYLON.Vector2.Distance(screenPoint, proj1) + BABYLON.Vector2.Distance(screenPoint, proj2);
            const edgeLength = BABYLON.Vector2.Distance(proj1, proj2);

            if (dist < minDistance && dist < edgeLength + 20) {
                minDistance = dist;
                closestEdge = { p1: edge.p1, p2: edge.p2, indices: edge.indices.sort() };
            }
        });
    }

    return closestEdge;
}

function createEdgeHighlight(p1, p2) {
    const line = BABYLON.MeshBuilder.CreateLines("edge_highlight", {
        points: [p1, p2],
        updatable: true
    }, scene);
    line.color = new BABYLON.Color3(1, 0, 0);
    line.isPickable = false;
    return line;
}

function createFaceHighlight(p1, p2, p3) {
    const highlight = new BABYLON.MeshBuilder.CreatePolygon("face_highlight", {
        shape: [p1, p2, p3],
        updatable: true
    }, scene);
    const material = new BABYLON.StandardMaterial("face_highlight_mat", scene);
    material.emissiveColor = new BABYLON.Color3(1, 0, 0);
    material.alpha = 0.5;
    material.disableLighting = true;
    highlight.material = material;
    highlight.isPickable = false;
    return highlight;
}

function updateVertexHighlights() {
    selectedVertices.forEach(v => {
        const positions = v.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const vertexPosition = new BABYLON.Vector3(positions[v.index * 3], positions[v.index * 3 + 1], positions[v.index * 3 + 2]);
        const transformedVertex = BABYLON.Vector3.TransformCoordinates(vertexPosition, v.mesh.getWorldMatrix());
        v.highlight.position = transformedVertex;
    });
}

initActionManager(scene, createTriangle, createQuad, createCube, updateStatusBar);
updateStatusBar();

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

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
                    pointerDragBehavior.onDragObservable.add(() => {
                        updateVertexHighlights();
                        updateEdgeHighlights();
                        updateFaceHighlights();
                    });
                    mesh.addBehavior(pointerDragBehavior);
                }
                updateStatusBar();
                return; // Prevent other actions when selecting
            }
        }

        // Vertex Selection
        if (activeModes.includes("select-vertex")) {
            if (pickInfo.hit && pickInfo.pickedMesh.name !== "lineSystem" && pickInfo.pickedMesh.name !== "axisX" && pickInfo.pickedMesh.name !== "axisZ") {
                const mesh = pickInfo.pickedMesh;
                const closestVertexIndex = getClosestVertex(mesh, new BABYLON.Vector2(scene.pointerX, scene.pointerY));
                if (closestVertexIndex !== -1) {
                    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    const vertexPosition = new BABYLON.Vector3(positions[closestVertexIndex * 3], positions[closestVertexIndex * 3 + 1], positions[closestVertexIndex * 3 + 2]);
                    const transformedVertex = BABYLON.Vector3.TransformCoordinates(vertexPosition, mesh.getWorldMatrix());

                    const existingSelection = selectedVertices.find(v => v.mesh === mesh && v.index === closestVertexIndex);
                    if (existingSelection) {
                        existingSelection.highlight.dispose();
                        selectedVertices.splice(selectedVertices.indexOf(existingSelection), 1);
                    } else {
                        const highlight = createVertexHighlight(transformedVertex);
                        selectedVertices.push({ mesh, index: closestVertexIndex, highlight });
                    }
                    updateStatusBar();
                }
            }
        }

        // Edge Selection
        if (activeModes.includes("select-edge")) {
            if (pickInfo.hit && pickInfo.pickedMesh.name !== "lineSystem" && pickInfo.pickedMesh.name !== "axisX" && pickInfo.pickedMesh.name !== "axisZ") {
                const mesh = pickInfo.pickedMesh;
                const closestEdge = getClosestEdge(mesh, new BABYLON.Vector2(scene.pointerX, scene.pointerY));
                if (closestEdge) {
                    const existingSelection = selectedEdges.find(e => e.mesh === mesh && e.indices[0] === closestEdge.indices[0] && e.indices[1] === closestEdge.indices[1]);
                    if (existingSelection) {
                        existingSelection.highlight.dispose();
                        selectedEdges.splice(selectedEdges.indexOf(existingSelection), 1);
                    } else {
                        const highlight = createEdgeHighlight(closestEdge.p1, closestEdge.p2);
                        selectedEdges.push({ mesh, indices: closestEdge.indices, highlight });
                    }
                }
            }
        }

        // Translation
        if (activeModes.includes("translate") && pickInfo.hit && selectedMeshes.includes(pickInfo.pickedMesh)) {
            // Handled by PointerDragBehavior, but we need to prevent navigation
            return;
        }

        // Face Selection
        if (activeModes.includes("select-face")) {
            if (pickInfo.hit && pickInfo.pickedMesh.name !== "lineSystem" && pickInfo.pickedMesh.name !== "axisX" && pickInfo.pickedMesh.name !== "axisZ") {
                const mesh = pickInfo.pickedMesh;
                const faceId = pickInfo.faceId;
                if (faceId !== -1) {
                    const existingSelection = selectedFaces.find(f => f.mesh === mesh && f.faceId === faceId);
                    if (existingSelection) {
                        existingSelection.highlight.dispose();
                        selectedFaces.splice(selectedFaces.indexOf(existingSelection), 1);
                    } else {
                        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                        const indices = mesh.getIndices();
                        const i1 = indices[faceId * 3];
                        const i2 = indices[faceId * 3 + 1];
                        const i3 = indices[faceId * 3 + 2];
                        const p1 = new BABYLON.Vector3(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
                        const p2 = new BABYLON.Vector3(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
                        const p3 = new BABYLON.Vector3(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);
                        const transformedP1 = BABYLON.Vector3.TransformCoordinates(p1, mesh.getWorldMatrix());
                        const transformedP2 = BABYLON.Vector3.TransformCoordinates(p2, mesh.getWorldMatrix());
                        const transformedP3 = BABYLON.Vector3.TransformCoordinates(p3, mesh.getWorldMatrix());
                        const highlight = createFaceHighlight(transformedP1, transformedP2, transformedP3);
                        selectedFaces.push({ mesh, faceId, highlight });
                    }
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
    let mesh;
    let meshType;
    if (e.target.textContent === "Triangle") {
        mesh = createTriangle(scene);
        meshType = 'triangle';
    } else if (e.target.textContent === "Quad") {
        mesh = createQuad(scene);
        meshType = 'quad';
    } else if (e.target.textContent === "Cube") {
        mesh = createCube(scene);
        meshType = 'cube';
    }
    if (mesh) {
        addAction({ type: 'creation', mesh: mesh, meshType: meshType });
        updateStatusBar();
    }
    contextMenu.style.display = "none";
    addSubmenu.style.display = "none";
});
