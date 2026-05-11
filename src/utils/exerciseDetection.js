// src/utils/exerciseDetection.js

export function analyzePose(pose, mode, repStateRef, repCountRef) {
  if (!pose || !pose.keypoints) return null;

  const nose = pose.keypoints.find(kp => kp.name === 'nose');
  const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
  const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
  const leftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');

  if (!nose || !leftShoulder || !rightShoulder || nose.score < 0.3 || leftShoulder.score < 0.3 || rightShoulder.score < 0.3) {
    return null;
  }

  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

  if (shoulderWidth < 5) return null;

  // Normalized distance based on body scale
  const headToShoulderDist = (avgShoulderY - nose.y) / shoulderWidth;

  let isDown = false;
  let isHandsUp = false;

  if (mode === 'squats' || mode === 'pushups') {
    isDown = headToShoulderDist < 0.25; // 25% of shoulder width
  } else if (mode === 'jacks') {
    const leftUp = leftWrist && leftWrist.score > 0.4 && leftWrist.y < nose.y;
    const rightUp = rightWrist && rightWrist.score > 0.4 && rightWrist.y < nose.y;
    isHandsUp = leftUp || rightUp;
  }

  let action = 'neutral';

  if (isDown || isHandsUp) {
    if (repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }
    action = 'active';
  } else {
    // Threshold to register returning to neutral state
    const isStandingTall = headToShoulderDist > 0.4;
    const isHandsDown = (!leftWrist || leftWrist.y > avgShoulderY) && (!rightWrist || rightWrist.y > avgShoulderY);

    if (repStateRef.current === 'down') {
      if ((mode !== 'jacks' && isStandingTall) || (mode === 'jacks' && isHandsDown)) {
        repCountRef.current += 1;
        repStateRef.current = 'up';
      }
    }
    action = 'neutral';
  }

  return {
    action,
    reps: repCountRef.current,
    noseX: nose.x,
    noseY: nose.y
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
