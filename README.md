# 3D Hand Gesture Particle System (Reset)

This project is a reset and simplified implementation of a real-time 3D particle system controlled by hand gestures using Three.js and MediaPipe Hands.

Quick start
1. Open `index.html` in a modern browser (Chrome/Edge recommended).
2. Allow the page to use your webcam when prompted.
3. Use gestures (point, pinch, open, peace, fist) to interact with particles.

Files
- `index.html` — main page, UI and script includes
- `js/hand-detection.js` — MediaPipe Hands wrapper (Camera + onResults)
- `js/particle-system.js` — small Three.js particle engine
- `js/main.js` — app orchestration and UI wiring

Notes
- The app loads libraries from CDNs (internet required).
- For camera access file:// URLs may be blocked in some browsers; if you run into issues, serve the folder via a simple local server (e.g., `npx http-server` or VS Code Live Server).

If anything else needs to be reset (remove files, change API choices, or add tests), tell me the exact scope and I'll proceed.
