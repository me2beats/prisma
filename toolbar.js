let activeModes = ["navigate"];
const selectedMeshes = [];

const navigateButton = document.getElementById("navigate");
const selectButton = document.getElementById("select");
const translateButton = document.getElementById("translate");
const toolbarButtons = [navigateButton, selectButton, translateButton];

function updateToolbar() {
    toolbarButtons.forEach(button => {
        if (activeModes.includes(button.id)) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

function toggleMode(mode, camera, canvas) {
    const index = activeModes.indexOf(mode);
    if (index === -1) {
        activeModes.push(mode);
    } else {
        activeModes.splice(index, 1);
    }
    updateToolbar();
    updateDragBehavior();

    if (mode === "navigate") {
        if (activeModes.includes("navigate")) {
            camera.attachControl(canvas, true);
        } else {
            camera.detachControl(canvas);
        }
    }
}

function updateDragBehavior() {
    const translateEnabled = activeModes.includes("translate");
    selectedMeshes.forEach(mesh => {
        const behavior = mesh.behaviors.find(b => b.name === "PointerDrag");
        if (behavior) behavior.enabled = translateEnabled;
    });
}

export function initializeToolbar(camera, canvas) {
    navigateButton.addEventListener("click", () => toggleMode("navigate", camera, canvas));
    selectButton.addEventListener("click", () => toggleMode("select", camera, canvas));
    translateButton.addEventListener("click", () => toggleMode("translate", camera, canvas));

    updateToolbar();
}

export { activeModes, selectedMeshes };
