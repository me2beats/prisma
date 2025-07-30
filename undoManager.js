const undoStack = [];
const redoStack = [];

let scene;
let createTriangle, createQuad, createCube;
let onAction;

export function init(s, ct, cq, cc, oa) {
    scene = s;
    createTriangle = ct;
    createQuad = cq;
    createCube = cc;
    onAction = oa;
}

export function addAction(action) {
    undoStack.push(action);
    redoStack.length = 0; // Clear redo stack
}

export function undo() {
    if (undoStack.length === 0) return;
    const action = undoStack.pop();
    if (action.type === 'creation') {
        const mesh = scene.getMeshById(action.meshId);
        if (mesh) {
            action.position = mesh.position.clone();
            if (mesh.rotationQuaternion) {
                action.rotationQuaternion = mesh.rotationQuaternion.clone();
            } else {
                action.rotation = mesh.rotation.clone();
            }
            action.scaling = mesh.scaling.clone();
            mesh.dispose();
        }
    } else if (action.type === 'translation') {
        const mesh = scene.getMeshById(action.meshId);
        if (mesh) {
            mesh.position.copyFrom(action.initialPosition);
        }
    } else if (action.type === 'subcomponentTranslation') {
        const mesh = scene.getMeshById(action.meshId);
        if (mesh) {
            const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            action.initialPositions.forEach((pos, index) => {
                positions[index * 3] = pos.x;
                positions[index * 3 + 1] = pos.y;
                positions[index * 3 + 2] = pos.z;
            });
            mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
        }
    }
    redoStack.push(action);
    if (onAction) onAction();
}

export function redo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    if (action.type === 'creation') {
        let newMesh;
        if (action.meshType === 'triangle') {
            newMesh = createTriangle(scene);
        } else if (action.meshType === 'quad') {
            newMesh = createQuad(scene);
        } else if (action.meshType === 'cube') {
            newMesh = createCube(scene);
        }
        if (newMesh) {
            newMesh.id = action.meshId;
            if (action.position) newMesh.position.copyFrom(action.position);
            if (action.rotationQuaternion) newMesh.rotationQuaternion.copyFrom(action.rotationQuaternion);
            if (action.rotation) newMesh.rotation.copyFrom(action.rotation);
            if (action.scaling) newMesh.scaling.copyFrom(action.scaling);
        }
    } else if (action.type === 'translation') {
        const mesh = scene.getMeshById(action.meshId);
        if (mesh) {
            mesh.position.copyFrom(action.finalPosition);
        }
    } else if (action.type === 'subcomponentTranslation') {
        const mesh = scene.getMeshById(action.meshId);
        if (mesh) {
            const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            action.finalPositions.forEach((pos, index) => {
                positions[index * 3] = pos.x;
                positions[index * 3 + 1] = pos.y;
                positions[index * 3 + 2] = pos.z;
            });
            mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
        }
    }
    undoStack.push(action);
    if (onAction) onAction();
}
