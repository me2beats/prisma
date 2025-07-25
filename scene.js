export function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 50;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    return { scene, camera };
}

export function createTriangle(scene) {
    const triangle = new BABYLON.Mesh("triangle", scene);
    const positions = [
        -1, -1, 0,
        1, -1, 0,
        0, 1, 0
    ];
    const indices = [0, 1, 2];
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.applyToMesh(triangle);
    return triangle;
}

export function createQuad(scene) {
    const quad = new BABYLON.Mesh("quad", scene);
    const positions = [
        -1, -1, 0,
        1, -1, 0,
        1, 1, 0,
        -1, 1, 0
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.applyToMesh(quad);
    return quad;
}

export function createCube(scene) {
    const cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 1 }, scene);
    return cube;
}
