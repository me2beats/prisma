import { log } from './logger.js';

const fileButton = document.getElementById("file-button");
const fileMenu = document.getElementById("file-menu");
const exportButton = document.getElementById("export-gltf");
const importButton = document.getElementById("import-gltf");

function exportScene(scene) {
    fileMenu.style.display = "none";
    log("Starting export...");
    const meshesToExport = scene.meshes.filter(mesh => mesh.name !== "lineSystem" && mesh.name !== "axisX" && mesh.name !== "axisZ");
    log(`Exporting ${meshesToExport.length} meshes...`);
    BABYLON.GLTF2Export.GLBAsync(scene, "scene", {
        shouldExportNode: (node) => meshesToExport.includes(node)
    }).then((glb) => {
        log("Export successful.");
        const blob = new Blob([glb.glTFFiles["scene.glb"]], {type: "application/octet-stream"});
        log("Blob created.");
        const url = URL.createObjectURL(blob);
        log(`Blob URL created: ${url}`);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scene.glb";
        a.click();
        log("Download initiated.");
        URL.revokeObjectURL(url);
        log("Blob URL revoked.");
    }).catch((error) => {
        log(`Export failed: ${error.message}`);
    });
}

function importMesh(scene, camera) {
    fileMenu.style.display = "none";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gltf, .glb";
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            log("No file selected.");
            return;
        }
        log(`File selected: ${file.name}`);

        try {
            log("Reading file content...");
            const fileContent = await file.arrayBuffer();
            log("File content read successfully.");

            const fileData = new Blob([fileContent]);
            const url = URL.createObjectURL(fileData);
            log(`Blob URL created: ${url}`);

            log("Starting mesh import...");
            BABYLON.SceneLoader.Append(url, "", scene, (loadedScene) => {
                const importedMeshes = loadedScene.meshes.filter(mesh => mesh.name !== "lineSystem" && mesh.name !== "axisX" && mesh.name !== "axisZ");
                log(`Meshes imported successfully: ${importedMeshes.length} meshes found.`);
                log("Applying material to meshes...");
                const material = new BABYLON.StandardMaterial("importedMat", scene);
                material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                importedMeshes.forEach(mesh => {
                    mesh.material = material;
                });
                log("Material applied.");

                if (importedMeshes.length > 0) {
                    const boundingBox = BABYLON.BoundingBox.FromMeshes(importedMeshes);
                    camera.target = boundingBox.center;
                    camera.radius = boundingBox.extendSize.length() * 2;
                    log("Camera centered on imported meshes.");
                }

                URL.revokeObjectURL(url);
                log("Blob URL revoked.");
            }, null, (scene, message, exception) => {
                log(`Error importing mesh: ${message}`);
                URL.revokeObjectURL(url);
                log("Blob URL revoked.");
            }, ".glb");
        } catch (error) {
            log(`Error importing mesh: ${error.message}`);
        }
    };
    input.click();
}

export function initializeFileIO(scene, camera) {
    const fileMenu = document.getElementById("file-menu");

    fileButton.addEventListener("click", () => {
        fileMenu.style.display = fileMenu.style.display === "flex" ? "none" : "flex";
    });

    exportButton.addEventListener("click", () => exportScene(scene));
    importButton.addEventListener("click", () => importMesh(scene, camera));

    window.addEventListener("pointerup", (e) => {
        if (!e.target.closest("#file-menu") && !e.target.closest("#file-button")) {
            fileMenu.style.display = "none";
        }
    });
}
