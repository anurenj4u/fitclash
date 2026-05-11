/* eslint-disable no-restricted-globals */

let detector;
let isInitializing = false;
let isReady = false;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    if (isInitializing || isReady) return;
    isInitializing = true;
    
    try {
      importScripts(
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.22.0/dist/tf-converter.min.js",
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js"
      );

      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn("WebGL not supported in worker, falling back to CPU.");
        await tf.setBackend('cpu');
      }
      await tf.ready();

      const model = poseDetection.SupportedModels.MoveNet;
      detector = await poseDetection.createDetector(model, {
        runtime: 'tfjs',
        modelType: 'SinglePose.Lightning'
      });

      isReady = true;
      isInitializing = false;
      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (error) {
      isInitializing = false;
      self.postMessage({ type: 'INIT_ERROR', error: error.message });
    }
  } else if (type === 'DETECT') {
    if (!isReady || !detector || !payload.imageBitmap) {
      if (payload && payload.imageBitmap) payload.imageBitmap.close();
      return;
    }
    
    try {
      // memory management is handled internally by estimatePoses when passing ImageBitmap/Canvas
      const poses = await detector.estimatePoses(payload.imageBitmap);
      payload.imageBitmap.close();

      if (poses && poses.length > 0) {
        self.postMessage({ type: 'POSE_DETECTED', pose: poses[0] });
      } else {
        self.postMessage({ type: 'POSE_DETECTED', pose: null });
      }
    } catch (err) {
      if (payload && payload.imageBitmap) payload.imageBitmap.close();
      // Silently catch frame drops
    }
  }
};
