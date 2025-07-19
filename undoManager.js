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
        action.mesh.dispose();
    }
    redoStack.push(action);
    if (onAction) onAction();
}

export function redo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    let newMesh;
    if (action.type === 'creation') {
        if (action.meshType === 'triangle') {
            newMesh = createTriangle(scene);
        } else if (action.meshType === 'quad') {
            newMesh = createQuad(scene);
        } else if (action.meshType === 'cube') {
            newMesh = createCube(scene);
        }
    }
    if (newMesh) {
        action.mesh = newMesh;
    }
    undoStack.push(action);
    if (onAction) onAction();
}
