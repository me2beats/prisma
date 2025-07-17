const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    const createGrid = function (scene) {
        const lines = [];
        const size = 10;
        const halfSize = size / 2;
        const step = 1;
        const color = new BABYLON.Color3(0.5, 0.5, 0.5);

        for (let i = -halfSize; i <= halfSize; i += step) {
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


    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});
