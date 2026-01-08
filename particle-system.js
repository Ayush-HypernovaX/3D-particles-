// Lightweight Particle System for Three.js
class Particle {
    constructor(pos, vel, color, life) {
        this.position = pos.clone();
        this.velocity = vel.clone();
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update(dt, gravity) {
        this.velocity.y += gravity * dt;
        this.position.addScaledVector(this.velocity, dt);
        this.velocity.multiplyScalar(0.99);
        this.life -= dt;
    }

    alive() { return this.life > 0; }

    alpha() { return Math.max(0, this.life / this.maxLife); }
}

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.config = {
            color: new THREE.Color(0x00ffff),
            size: 1.0,
            emissionRate: 60,
            life: 2.5,
            gravity: -0.5,
            speed: 6
        };

        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(0);
        this.colors = new Float32Array(0);
        this.pointsMaterial = new THREE.PointsMaterial({
            size: this.config.size,
            vertexColors: true,
            transparent: true,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.pointsMaterial);
        this.scene.add(this.points);
    }

    updateConfig(cfg) {
        Object.assign(this.config, cfg);
        this.pointsMaterial.size = this.config.size;
        if (cfg.color) this.pointsMaterial.color.copy(this.config.color);
    }

    emit(position, direction, count=1) {
        for (let i = 0; i < count; i++) {
            const dir = direction.clone().normalize();
            // add spread
            dir.x += (Math.random() - 0.5) * 0.4;
            dir.y += (Math.random() - 0.5) * 0.4;
            dir.z += (Math.random() - 0.5) * 0.4;
            dir.normalize();

            const velocity = dir.multiplyScalar(this.config.speed * (0.5 + Math.random()));
            const p = new Particle(position, velocity, this.config.color.clone(), this.config.life * (0.8 + 0.4 * Math.random()));
            this.particles.push(p);
        }
    }

    addForce(position, forceVec, radius) {
        // apply immediate force to particles within radius
        for (let p of this.particles) {
            const d = p.position.distanceTo(position);
            if (d < radius) {
                const f = forceVec.clone().multiplyScalar(1 - d / radius);
                p.velocity.add(f);
            }
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt, this.config.gravity);
            if (!p.alive()) this.particles.splice(i, 1);
        }

        this._syncGeometry();
    }

    _syncGeometry() {
        const n = this.particles.length;
        if (n === 0) {
            this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
            this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));
            return;
        }

        const pos = new Float32Array(n * 3);
        const col = new Float32Array(n * 3);

        for (let i = 0; i < n; i++) {
            const p = this.particles[i];
            pos[i*3] = p.position.x;
            pos[i*3+1] = p.position.y;
            pos[i*3+2] = p.position.z;

            const a = p.alpha();
            col[i*3] = p.color.r * a;
            col[i*3+1] = p.color.g * a;
            col[i*3+2] = p.color.b * a;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }

    clear() {
        this.particles = [];
        this._syncGeometry();
    }

    getParticleCount() { return this.particles.length; }
}
