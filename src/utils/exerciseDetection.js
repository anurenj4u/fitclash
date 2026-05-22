// src/utils/exerciseDetection.js

export function analyzePose(pose, mode, repStateRef, repCountRef) {
  if (!pose || !pose.keypoints) return null;

  const getKP = (name) => pose.keypoints.find(kp => kp.name === name);

  const nose = getKP('nose');
  const leftShoulder = getKP('left_shoulder');
  const rightShoulder = getKP('right_shoulder');
  const leftHip = getKP('left_hip');
  const rightHip = getKP('right_hip');
  const leftKnee = getKP('left_knee');
  const rightKnee = getKP('right_knee');
  const leftWrist = getKP('left_wrist');
  const rightWrist = getKP('right_wrist');
  const leftAnkle = getKP('left_ankle');
  const rightAnkle = getKP('right_ankle');
  const leftElbow = getKP('left_elbow');
  const rightElbow = getKP('right_elbow');

  const MIN_CONF = 0.25;

  const shoulderOk = leftShoulder?.score > MIN_CONF || rightShoulder?.score > MIN_CONF;
  if (!shoulderOk) return null;

  const avgShoulderY = ((leftShoulder?.y ?? 0) + (rightShoulder?.y ?? 0)) / 2;
  const shoulderWidth = Math.abs((leftShoulder?.x ?? 0) - (rightShoulder?.x ?? 0));
  if (shoulderWidth < 10) return null;

  let isActive = false;

  if (mode === 'squats') {
    // Squat: detect hip drop relative to shoulders using knee y-position
    // Primary: if we have hips + knees, check hip-knee angle  
    const hipY = ((leftHip?.y ?? 0) + (rightHip?.y ?? 0)) / 2;
    const kneeY = ((leftKnee?.y ?? 0) + (rightKnee?.y ?? 0)) / 2;
    const hipsOk = leftHip?.score > MIN_CONF || rightHip?.score > MIN_CONF;
    const kneesOk = leftKnee?.score > MIN_CONF || rightKnee?.score > MIN_CONF;

    if (hipsOk && kneesOk) {
      // Squatting: knees are much further down than hips (> 80% of shoulder width gap)
      const hipKneeDiff = kneeY - hipY;
      const threshold = shoulderWidth * 0.55; // squat fires when hip-knee diff < threshold
      isActive = hipKneeDiff < threshold;
    } else if (nose?.score > MIN_CONF) {
      // Fallback: nose drops closer to shoulders (simpler upper-body squat approximation)
      const headToShoulderDist = (avgShoulderY - (nose?.y ?? 0)) / shoulderWidth;
      isActive = headToShoulderDist < 0.35; // More lenient than old 0.25
    }

  } else if (mode === 'pushups') {
    // Pushup: nose drops close to or below shoulder level
    if (nose?.score > MIN_CONF) {
      const headToShoulderDist = (avgShoulderY - nose.y) / shoulderWidth;
      isActive = headToShoulderDist < 0.3;
    }

  } else if (mode === 'jacks') {
    // Jumping Jack: either hands raised above nose OR wrists above shoulders
    const leftUp = leftWrist?.score > MIN_CONF && leftWrist.y < avgShoulderY;
    const rightUp = rightWrist?.score > MIN_CONF && rightWrist.y < avgShoulderY;
    isActive = leftUp || rightUp;

  } else if (mode === 'highknees') {
    // High Knees: knee rises above hip level
    const leftKneeHigh = leftKnee?.score > MIN_CONF && leftHip?.score > MIN_CONF && leftKnee.y < leftHip.y;
    const rightKneeHigh = rightKnee?.score > MIN_CONF && rightHip?.score > MIN_CONF && rightKnee.y < rightHip.y;
    isActive = leftKneeHigh || rightKneeHigh;
  }

  let action = 'neutral';

  if (isActive) {
    if (repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }
    action = 'active';
  } else {
    if (repStateRef.current === 'down') {
      // For squats: must stand back upright (knees > hips again or head rises)
      let returnedToStart = true;
      if (mode === 'squats') {
        const hipsOk = leftHip?.score > MIN_CONF || rightHip?.score > MIN_CONF;
        const kneesOk = leftKnee?.score > MIN_CONF || rightKnee?.score > MIN_CONF;
        if (hipsOk && kneesOk) {
          const hipY = ((leftHip?.y ?? 0) + (rightHip?.y ?? 0)) / 2;
          const kneeY = ((leftKnee?.y ?? 0) + (rightKnee?.y ?? 0)) / 2;
          returnedToStart = (kneeY - hipY) > shoulderWidth * 0.75;
        }
      } else if (mode === 'jacks') {
        const leftDown = !leftWrist || leftWrist.score < MIN_CONF || leftWrist.y > avgShoulderY + 10;
        const rightDown = !rightWrist || rightWrist.score < MIN_CONF || rightWrist.y > avgShoulderY + 10;
        returnedToStart = leftDown && rightDown;
      }

      if (returnedToStart) {
        repCountRef.current += 1;
        repStateRef.current = 'up';
        action = 'rep_counted';
      }
    }
    action = action === 'rep_counted' ? action : 'neutral';
  }

  return {
    action,
    reps: repCountRef.current,
    noseX: nose?.x ?? 0,
    noseY: nose?.y ?? 0
  };
}

/**
 * Analyze finger count from MediaPipe Hands detection.
 * Triggers a rep when the user shows exactly 1 finger,
 * then requires them to close fist before next rep.
 *
 * @param {number} fingerCount - number of extended fingers detected
 * @param {object} repStateRef - ref tracking 'up' / 'down' state
 * @param {object} repCountRef - ref tracking total rep count
 * @returns {{ reps: number, action: string } | null}
 */
export function analyzeFingers(fingerCount, repStateRef, repCountRef) {
  // "Active" = exactly 1 finger raised
  const isOneFingerUp = fingerCount === 1;

  if (isOneFingerUp) {
    if (repStateRef.current === 'up') {
      // Transition: rest → active
      repStateRef.current = 'down';
    }
    return { action: 'active', reps: repCountRef.current };
  } else {
    // "Rest" = fist / 0 fingers or 2+ fingers → reset so next 1-finger counts
    if (repStateRef.current === 'down') {
      repCountRef.current += 1;
      repStateRef.current = 'up';
    }
    return { action: 'neutral', reps: repCountRef.current };
  }
}
