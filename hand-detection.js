// Hand Detection Module using MediaPipe Hands (onResults API)
class HandDetector {
    constructor(videoElement) {
        this.video = videoElement;
        this.hands = [];
        this.gesture = 'none';
        this.readyFlag = false;
        this._onResultsBound = this._onResults.bind(this);

        this._initHands();
    }

    _initHands() {
        // Create MediaPipe Hands instance
        this.handsApi = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.handsApi.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.6
        });

        this.handsApi.onResults(this._onResultsBound);

        // Camera utility will call handsApi.send on each frame
        try {
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.handsApi.send({image: this.video});
                },
                width: 640,
                height: 480
            });

            this.camera.start();
            this.readyFlag = true;
        } catch (err) {
            console.error('Camera initialization failed:', err);
            this.readyFlag = false;
        }
    }

    _onResults(results) {
        this.hands = [];

        if (!results.multiHandLandmarks) {
            this.gesture = 'none';
            return;
        }

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const lm = results.multiHandLandmarks[i];
            const handedness = (results.multiHandedness && results.multiHandedness[i]) ? results.multiHandedness[i].label : 'Unknown';

            const hand = this._convertLandmarks(lm, handedness);
            this.hands.push(hand);
        }

        // Simple gesture detection using first hand
        if (this.hands.length > 0) {
            this.gesture = this._detectGesture(this.hands[0]);
        } else {
            this.gesture = 'none';
        }
    }

    _convertLandmarks(landmarks, handedness) {
        const hand = {
            handedness: handedness,
            landmarks: [],
            center: new THREE.Vector3(),
            indexFinger: new THREE.Vector3(),
            middleFinger: new THREE.Vector3(),
            palmCenter: new THREE.Vector3()
        };

        let sum = new THREE.Vector3(0,0,0);
        for (let i = 0; i < landmarks.length; i++) {
            const l = landmarks[i];

            // Convert normalized camera coords to world-like coords (simple scale)
            const x = (l.x - 0.5) * 10;
            const y = (0.5 - l.y) * 10;
            const z = -l.z * 10;

            const v = new THREE.Vector3(x, y, z);
            hand.landmarks.push(v);
            sum.add(v);
        }

        hand.center.copy(sum.multiplyScalar(1 / landmarks.length));

        if (hand.landmarks[8]) hand.indexFinger.copy(hand.landmarks[8]);
        if (hand.landmarks[12]) hand.middleFinger.copy(hand.landmarks[12]);
        if (hand.landmarks[9]) hand.palmCenter.copy(hand.landmarks[9]);

        return hand;
    }

    _distance(a, b) {
        return a.distanceTo(b);
    }

    _detectGesture(hand) {
        const lm = hand.landmarks;
        if (!lm || lm.length === 0) return 'none';

        const thumbTip = lm[4];
        const indexTip = lm[8];
        const middleTip = lm[12];
        const ringTip = lm[16];
        const pinkyTip = lm[20];

        // Pinch: thumb close to index
        if (this._distance(thumbTip, indexTip) < 1.0) return 'pinch';

        // Point: index extended and other fingers folded
        const indexExtended = indexTip.y < lm[6].y; // tip above PIP in Y
        const middleExtended = middleTip.y < lm[10].y;
        const ringExtended = ringTip.y < lm[14].y;
        const pinkyExtended = pinkyTip.y < lm[18].y;

        if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) return 'point';

        // Peace: index and middle extended
        if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) return 'peace';

        // Open: all fingers extended
        if (indexExtended && middleExtended && ringExtended && pinkyExtended) return 'open';

        // Fist: none extended
        if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) return 'fist';

        return 'none';
    }

    getHands() {
        return this.hands;
    }

    getGesture() {
        return this.gesture;
    }

    isReady() {
        return this.readyFlag;
    }
}
