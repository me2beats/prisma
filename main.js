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

import { initializeInputHandling } from './input-handler.js';

initializeInputHandling(canvas, scene, highlightLayer, selectedMeshes, activeModes);
