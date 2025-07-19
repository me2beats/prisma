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
}
