// Main Application (clean reset)
class ParticleApp {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x07070a);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 20);

        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const dir = new THREE.DirectionalLight(0xffffff, 0.4);
        dir.position.set(5,10,5);
        this.scene.add(dir);

        this.particleSystem = new ParticleSystem(this.scene);

        this.video = document.getElementById('video');
        this.handDetector = new HandDetector(this.video);

        this.clock = new THREE.Clock();

        this._setupUI();
        window.addEventListener('resize', () => this._onResize());

        this._loop();
    }

    _setupUI() {
        document.getElementById('particleColor').addEventListener('change', (e) => {
            this.particleSystem.updateConfig({ color: new THREE.Color(e.target.value) });
        });

        document.getElementById('particleSize').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('sizeValue').textContent = val.toFixed(1);
            this.particleSystem.updateConfig({ size: val });
        });

        document.getElementById('emissionRate').addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            document.getElementById('rateValue').textContent = val;
            this.particleSystem.updateConfig({ emissionRate: val });
        });

        document.getElementById('particleLife').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('lifeValue').textContent = val.toFixed(1);
            this.particleSystem.updateConfig({ life: val });
        });

        document.getElementById('gravity').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = val.toFixed(2);
            this.particleSystem.updateConfig({ gravity: val });
        });

        document.getElementById('clearBtn').addEventListener('click', () => this.particleSystem.clear());
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _handleGestures() {
        if (!this.handDetector.isReady()) {
            document.getElementById('status').textContent = 'Initializing...';
            return;
        }

        const hands = this.handDetector.getHands();
        const gesture = this.handDetector.getGesture();

        document.getElementById('status').textContent = 'Active';
        document.getElementById('hands-count').textContent = hands.length;
        document.getElementById('gesture').textContent = gesture.charAt(0).toUpperCase() + gesture.slice(1);

        for (const hand of hands) {
            const dir = hand.indexFinger.clone().sub(hand.palmCenter).normalize();

            switch (gesture) {
                case 'point':
                    this.particleSystem.emit(hand.indexFinger, dir, Math.ceil(this.particleSystem.config.emissionRate * 0.02));
                    break;
                case 'pinch':
                    this.particleSystem.addForce(hand.indexFinger, dir.multiplyScalar(-10), 4);
                    break;
                case 'open':
                    this.particleSystem.addForce(hand.palmCenter, dir.multiplyScalar(20), 6);
                    break;
                case 'peace':
                    this.particleSystem.addForce(hand.palmCenter, new THREE.Vector3((Math.random()-0.5)*20,(Math.random()-0.5)*20,(Math.random()-0.5)*20), 8);
                    break;
                case 'fist':
                    // do nothing
                    break;
            }
        }
    }

    _updateStats() {
        document.getElementById('particle-count').textContent = this.particleSystem.getParticleCount();
    }

    _loop() {
        requestAnimationFrame(() => this._loop());

        const dt = Math.min(0.05, this.clock.getDelta());

        this._handleGestures();
        this.particleSystem.update(dt);
        this.renderer.render(this.scene, this.camera);
        this._updateStats();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';

    setTimeout(() => {
        try {
            new ParticleApp();
            loading.style.display = 'none';
        } catch (err) {
            console.error('Initialization error:', err);
            loading.style.display = 'block';
            loading.innerHTML = '<div><h2 style="color:#ff4444;">Error initializing application</h2><pre>' + (err && err.message ? err.message : String(err)) + '</pre></div>';
        }
    }, 150);
});
