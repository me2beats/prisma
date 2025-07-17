export function createAxes(scene, size) {
    const halfSize = size / 2;

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
}
