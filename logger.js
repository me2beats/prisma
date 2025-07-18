const debugOverlay = document.getElementById("debug-overlay");

export function log(message) {
    const p = document.createElement("p");
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    debugOverlay.appendChild(p);
    debugOverlay.scrollTop = debugOverlay.scrollHeight;
    console.log(message);
}
