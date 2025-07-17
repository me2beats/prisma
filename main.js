const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.Black();

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);

    const center = BABYLON.MeshBuilder.CreateSphere("center", {diameter: 0.2}, scene);
    center.material = new BABYLON.StandardMaterial("centerMat", scene);
    center.material.emissiveColor = new BABYLON.Color3.Red();

    const makeTextPlane = function (text, color, size) {
        const dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
        const plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
        plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
        plane.material.backFaceCulling = false;
        plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
        plane.material.diffuseTexture = dynamicTexture;
        return plane;
    };

    const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(5, 0, 0), new BABYLON.Vector3(5 * 0.95, 0.05 * 5, 0),
            new BABYLON.Vector3(5, 0, 0), new BABYLON.Vector3(5 * 0.95, -0.05 * 5, 0)
        ]
    }, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    const xChar = makeTextPlane("X", "red", 1);
    xChar.position = new BABYLON.Vector3(6, 0, 0);

    const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
        points: [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 5), new BABYLON.Vector3(0, -0.05 * 5, 5 * 0.95),
            new BABYLON.Vector3(0, 0, 5), new BABYLON.Vector3(0, 0.05 * 5, 5 * 0.95)
        ]
    }, scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    const zChar = makeTextPlane("Z", "blue", 1);
    zChar.position = new BABYLON.Vector3(0, 0, 6);


    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});
