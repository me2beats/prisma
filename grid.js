export function createGrid(scene, size) {
    const lines = [];
    const halfSize = size / 2;
    const step = 1;
    const color = new BABYLON.Color3(0.4, 0.4, 0.4);

    for (let i = -halfSize; i <= halfSize; i += step) {
        if (i === 0) continue;
        lines.push([new BABYLON.Vector3(i, 0, -halfSize), new BABYLON.Vector3(i, 0, halfSize)]);
        lines.push([new BABYLON.Vector3(-halfSize, 0, i), new BABYLON.Vector3(halfSize, 0, i)]);
    }

    const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("lineSystem", {lines: lines}, scene);
    lineSystem.color = color;
}
