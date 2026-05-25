// src/utils/exerciseDetection.js

export function analyzePose(pose, mode, repStateRef, repCountRef) {
  if (!pose || !pose.keypoints) return null;

  // Auto-detect exercise mode switches and reset historical tracking state
  if (!repStateRef.currentMode || repStateRef.currentMode !== mode) {
    repStateRef.currentMode = mode;
    repStateRef.headYHistory = [];
    repStateRef.squatHighestShoulderY = null;
    repStateRef.pushupHighestShoulderY = null;
  }

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
    // Unified Squat Tracker: works perfectly whether feet/legs are visible (floor mount) or not (table mount).
    // We track stable shoulder vertical movement relative to the shoulder width.
    if (shoulderOk && shoulderWidth > 0) {
      if (repStateRef.squatHighestShoulderY === undefined || repStateRef.squatHighestShoulderY === null) {
        repStateRef.squatHighestShoulderY = avgShoulderY;
      }
      
      if (repStateRef.current === 'up') {
        // Track the highest standing position (smallest Y)
        repStateRef.squatHighestShoulderY = Math.min(repStateRef.squatHighestShoulderY, avgShoulderY);
        // Responsive decay to slowly adapt if the user shifts backwards or steps closer
        repStateRef.squatHighestShoulderY = repStateRef.squatHighestShoulderY * 0.95 + avgShoulderY * 0.05;
      }

      const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
      // Squat active down-state trigger: shoulders must move down by at least 0.35 of shoulder width
      isActive = movedDownDist > 0.35;
    }

  } else if (mode === 'pushups') {
    // Pushup: track absolute vertical shoulder movement to prevent head-bobbing cheating
    // and adapt the "up" baseline dynamically to account for fatigue.
    if (shoulderOk && shoulderWidth > 0) {
      if (repStateRef.pushupHighestShoulderY === undefined || repStateRef.pushupHighestShoulderY === null) {
        repStateRef.pushupHighestShoulderY = avgShoulderY;
      }
      
      if (repStateRef.current === 'up') {
        // Track the highest position (smallest Y). 
        repStateRef.pushupHighestShoulderY = Math.min(repStateRef.pushupHighestShoulderY, avgShoulderY);
        // Fast decay downwards so if they get tired and can't push up as high, the baseline adjusts
        repStateRef.pushupHighestShoulderY = repStateRef.pushupHighestShoulderY * 0.90 + avgShoulderY * 0.10; 
      }

      const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
      // Trigger pushup if shoulders drop by at least 20% of shoulder width
      isActive = movedDownDist > 0.20; 
    }

  } else if (mode === 'jacks') {
    // Jumping Jack: TWO strict conditions must BOTH be true:
    //   1) Both wrists are clearly ABOVE the top of the head (not just nose level)
    //   2) The head is genuinely airborne — nose is significantly HIGHER than its recent standing baseline

    // Estimate nose position; fall back to above-shoulder if nose not visible
    const noseY = (nose?.score > MIN_CONF) ? nose.y : avgShoulderY - (shoulderWidth * 0.5);
    // "Above head" target: wrists must be at least 0.3 * shoulderWidth ABOVE the nose
    const aboveHeadThreshold = noseY - shoulderWidth * 0.3;

    // Both wrists must be strictly above the head crown (lower Y = higher on screen)
    const leftAboveHead  = leftWrist?.score  > MIN_CONF && leftWrist.y  < aboveHeadThreshold;
    const rightAboveHead = rightWrist?.score > MIN_CONF && rightWrist.y < aboveHeadThreshold;
    const bothHandsAboveHead = leftAboveHead && rightAboveHead;

    // ---- Real jump detection via rolling baseline ----
    // We track a rolling minimum of noseY (= the standing floor height).
    // When the user jumps, their nose Y drops (rises on screen) well below this floor.
    // This cleanly separates a real jump from random head tilt / camera jitter.
    if (!repStateRef.headYHistory) repStateRef.headYHistory = [];
    repStateRef.headYHistory.push(noseY);
    if (repStateRef.headYHistory.length > 20) {
      repStateRef.headYHistory.shift();
    }

    let isJumping = false;
    if (repStateRef.headYHistory.length >= 8) {
      // The "floor" = the highest recent noseY (user standing still, largest Y value in screen coords)
      const standingFloorY = Math.max(...repStateRef.headYHistory);
      // How much has the head risen ABOVE that standing floor?
      const jumpRise = standingFloorY - noseY; // positive = head is higher than floor
      // Must rise by at least 18% of shoulder width — clearly a real jump, not a nod/sway
      isJumping = jumpRise > shoulderWidth * 0.18;
    }

    isActive = bothHandsAboveHead && isJumping;

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
      let returnedToStart = true;
      if (mode === 'squats') {
        if (repStateRef.squatHighestShoulderY !== undefined && repStateRef.squatHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
          // Must stand back upright (movedDownDist < 0.15 of shoulder width)
          returnedToStart = movedDownDist < 0.15;
        } else {
          returnedToStart = true;
        }
      } else if (mode === 'pushups') {
        if (repStateRef.pushupHighestShoulderY !== undefined && repStateRef.pushupHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
          // Must push shoulders back up close to the dynamic highest point
          returnedToStart = movedDownDist < 0.12; 
        } else {
          returnedToStart = true;
        }
      } else if (mode === 'jacks') {
        // Hands must drop back BELOW the shoulders (rest position) to complete the rep
        const leftDown  = !leftWrist  || leftWrist.score  < MIN_CONF || leftWrist.y  > avgShoulderY;
        const rightDown = !rightWrist || rightWrist.score < MIN_CONF || rightWrist.y > avgShoulderY;

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
