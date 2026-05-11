/* eslint-disable no-restricted-globals */

let poseDetector;
let handDetector;
let isInitializing = false;
let isReady = false;
let currentMode = 'squats';

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'SET_MODE') {
    currentMode = payload.mode;
    // If switching to fingers mode and hand detector not yet loaded, load it
    if (currentMode === 'fingers' && !handDetector && isReady) {
      await initHandDetector();
    }
  } else if (type === 'INIT') {
    if (isInitializing || isReady) return;
    isInitializing = true;

    try {
      importScripts(
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.22.0/dist/tf-converter.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@2.0.1/dist/hand-pose-detection.min.js"
      );

      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn("WebGL not supported in worker, falling back to CPU.");
        await tf.setBackend('cpu');
      }
      await tf.ready();

      // Always init pose detector
      const model = poseDetection.SupportedModels.MoveNet;
      poseDetector = await poseDetection.createDetector(model, {
        runtime: 'tfjs',
        modelType: 'SinglePose.Lightning'
      });

      // Init hand detector (lightweight MediaPipe Hands via TF.js)
      await initHandDetector();

      isReady = true;
      isInitializing = false;
      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (error) {
      isInitializing = false;
      self.postMessage({ type: 'INIT_ERROR', error: error.message });
    }
  } else if (type === 'DETECT') {
    if (!isReady || !payload.imageBitmap) {
      if (payload && payload.imageBitmap) payload.imageBitmap.close();
      return;
    }

    try {
      if (currentMode === 'fingers' && handDetector) {
        // ── Hand detection path ──
        const hands = await handDetector.estimateHands(payload.imageBitmap);
        payload.imageBitmap.close();

        const fingerCount = countExtendedFingers(hands);
        self.postMessage({ type: 'HAND_DETECTED', fingerCount, handCount: hands.length });
      } else if (poseDetector) {
        // ── Pose detection path ──
        const poses = await poseDetector.estimatePoses(payload.imageBitmap);
        payload.imageBitmap.close();

        if (poses && poses.length > 0) {
          self.postMessage({ type: 'POSE_DETECTED', pose: poses[0] });
        } else {
          self.postMessage({ type: 'POSE_DETECTED', pose: null });
        }
      } else {
        payload.imageBitmap.close();
      }
    } catch (err) {
      if (payload && payload.imageBitmap) {
        try { payload.imageBitmap.close(); } catch (_) {}
      }
    }
  }
};

async function initHandDetector() {
  try {
    const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
    handDetector = await handPoseDetection.createDetector(handModel, {
      runtime: 'tfjs',
      modelType: 'lite',
      maxHands: 1
    });
  } catch (err) {
    console.warn('Hand detector init failed:', err.message);
  }
}

/**
 * Count how many fingers are extended across all detected hands.
 * Uses the MediaPipe 21-keypoint hand skeleton.
 *
 * Finger tip / pip landmark indices:
 *   Thumb:  tip=4,  ip=3
 *   Index:  tip=8,  pip=6
 *   Middle: tip=12, pip=10
 *   Ring:   tip=16, pip=14
 *   Pinky:  tip=20, pip=18
 *
 * A finger is "extended" when its tip is farther from the wrist than its pip joint.
 */
function countExtendedFingers(hands) {
  if (!hands || hands.length === 0) return 0;
  let total = 0;
  for (const hand of hands) {
    const kp = hand.keypoints;
    if (!kp || kp.length < 21) continue;
    const wrist = kp[0];
    // Tip / pip pairs: [tipIdx, pipIdx]
    const fingerPairs = [
      [4, 3],   // Thumb  (use ip not pip for thumb)
      [8, 6],   // Index
      [12, 10], // Middle
      [16, 14], // Ring
      [20, 18], // Pinky
    ];
    for (const [tipIdx, pipIdx] of fingerPairs) {
      const tip = kp[tipIdx];
      const pip = kp[pipIdx];
      if (!tip || !pip) continue;
      // Distance from wrist
      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      if (tipDist > pipDist * 1.1) total += 1;
    }
  }
  return total;
}
