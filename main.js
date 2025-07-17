const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    const center = BABYLON.MeshBuilder.CreateSphere("center", {diameter: 0.2}, scene);
    center.material = new BABYLON.StandardMaterial("centerMat", scene);
    center.material.emissiveColor = new BABYLON.Color3.Red();

    const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(5, 0, 0)
        ]
    }, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);

    const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
        points: [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 5)
        ]
    }, scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);

    // Grid chunk system
    const chunkSize = 10;
    const lodLevels = [1, 2, 4, 8];
    const gridChunks = new Map();

    function getChunkId(x, z) {
        return `${Math.floor(x / chunkSize)}_${Math.floor(z / chunkSize)}`;
    }

    function createGridChunk(x, z, lod) {
        const chunkId = getChunkId(x, z);
        if (gridChunks.has(chunkId)) {
            gridChunks.get(chunkId).dispose();
        }

        const lines = [];
        const step = chunkSize / lod;
        const startX = Math.floor(x / chunkSize) * chunkSize;
        const startZ = Math.floor(z / chunkSize) * chunkSize;

        for (let i = 0; i <= lod; i++) {
            const offset = i * step;
            lines.push([new BABYLON.Vector3(startX + offset, 0, startZ), new BABYLON.Vector3(startX + offset, 0, startZ + chunkSize)]);
            lines.push([new BABYLON.Vector3(startX, 0, startZ + offset), new BABYLON.Vector3(startX + chunkSize, 0, startZ + offset)]);
        }

        const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(chunkId, {lines: lines}, scene);
        lineSystem.color = new BABYLON.Color3(0.5, 0.5, 0.5);
        gridChunks.set(chunkId, lineSystem);
    }

    function updateGrid() {
        const cameraTarget = camera.target;
        const currentChunkId = getChunkId(cameraTarget.x, cameraTarget.z);

        const renderDistance = 2;
        const [cx, cz] = currentChunkId.split('_').map(Number);

        const newChunks = new Set();

        for (let x = cx - renderDistance; x <= cx + renderDistance; x++) {
            for (let z = cz - renderDistance; z <= cz + renderDistance; z++) {
                const chunkId = `${x}_${z}`;
                newChunks.add(chunkId);

                const distance = Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cz - z, 2));
                let lodIndex = Math.floor(distance);
                if (lodIndex >= lodLevels.length) {
                    lodIndex = lodLevels.length - 1;
                }

                if (!gridChunks.has(chunkId)) {
                    createGridChunk(x * chunkSize, z * chunkSize, lodLevels[lodIndex]);
                }
            }
        }

        for (const [chunkId, chunk] of gridChunks.entries()) {
            if (!newChunks.has(chunkId)) {
                chunk.dispose();
                gridChunks.delete(chunkId);
            }
        }
    }

    scene.onBeforeRenderObservable.add(() => {
        updateGrid();
    });

    updateGrid();

    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});
