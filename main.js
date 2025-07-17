const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    const size = 50;
    const halfSize = size / 2;

    const createGrid = function (scene) {
        const lines = [];
        const step = 1;
        const color = new BABYLON.Color3(0.4, 0.4, 0.4);

        for (let i = -halfSize; i <= halfSize; i += step) {
            if (i === 0) continue;
            lines.push([new BABYLON.Vector3(i, 0, -halfSize), new BABYLON.Vector3(i, 0, halfSize)]);
            lines.push([new BABYLON.Vector3(-halfSize, 0, i), new BABYLON.Vector3(halfSize, 0, i)]);
        }

        const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("lineSystem", {lines: lines}, scene);
        lineSystem.color = color;
    };

    createGrid(scene);


    const center = BABYLON.MeshBuilder.CreateSphere("center", {diameter: 0.2}, scene);
    center.material = new BABYLON.StandardMaterial("centerMat", scene);
    center.material.emissiveColor = new BABYLON.Color3.Red();

    const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [
            new BABYLON.Vector3(-halfSize, 0, 0), new BABYLON.Vector3(halfSize, 0, 0)
        ]
    }, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);

    const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
        points: [
            new BABYLON.Vector3(0, 0, -halfSize), new BABYLON.Vector3(0, 0, halfSize)
        ]
    }, scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);


    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});
