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

  let avgShoulderY = 0;
  let validShouldersCount = 0;
  if (leftShoulder && leftShoulder.score > MIN_CONF) {
    avgShoulderY += leftShoulder.y;
    validShouldersCount++;
  }
  if (rightShoulder && rightShoulder.score > MIN_CONF) {
    avgShoulderY += rightShoulder.y;
    validShouldersCount++;
  }
  if (validShouldersCount === 0) return null;
  avgShoulderY = avgShoulderY / validShouldersCount;

  let shoulderWidth = 100;
  if (leftShoulder && leftShoulder.score > MIN_CONF && rightShoulder && rightShoulder.score > MIN_CONF) {
    shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  } else {
    shoulderWidth = 120;
  }
  if (shoulderWidth < 10) shoulderWidth = 100;

  // Focus optimizations solely on mobile viewports/devices to preserve working web/desktop algorithms
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 1024 || /Mobi|Android|iPhone/i.test(navigator.userAgent));

  let isActive = false;

  if (mode === 'squats') {
    // Prevent pushups (lying down) from being falsely counted as squats
    let isLyingDown = false;
    if (leftHip && leftHip.score > MIN_CONF && leftShoulder && leftShoulder.score > MIN_CONF) {
      if (leftHip.y - leftShoulder.y < 0.5 * shoulderWidth) {
        isLyingDown = true;
      }
    } else if (rightHip && rightHip.score > MIN_CONF && rightShoulder && rightShoulder.score > MIN_CONF) {
      if (rightHip.y - rightShoulder.y < 0.5 * shoulderWidth) {
        isLyingDown = true;
      }
    }
    if (isLyingDown) {
      return null;
    }

    // 1. Initialize Standing Baseline
    if (repStateRef.squatHighestShoulderY === undefined || repStateRef.squatHighestShoulderY === null) {
      repStateRef.squatHighestShoulderY = avgShoulderY;
    }

    // 2. Drift standing baseline slowly when upright to adapt to user steps or posture changes
    if (repStateRef.current === 'up') {
      if (avgShoulderY < repStateRef.squatHighestShoulderY) {
        // Stand up higher: instant calibration
        repStateRef.squatHighestShoulderY = avgShoulderY;
      } else {
        // Steps back or shifts down slightly: drift low-pass filter
        repStateRef.squatHighestShoulderY = repStateRef.squatHighestShoulderY * 0.98 + avgShoulderY * 0.02;
      }
    }

    // 3. Compute relative displacement
    const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
    
    // Squat trigger: require shoulders to drop at least 46% of shoulder-width.
    // This demands ~80% of a full squat depth – prevents shallow knee-bends from counting.
    isActive = movedDownDist > 0.46;

    // 4. Self-Healing: Reset stuck down-state after 50 frames (~1.65s) to handle very slow squats
    if (repStateRef.current === 'down') {
      repStateRef.squatFramesInDown = (repStateRef.squatFramesInDown || 0) + 1;
      if (repStateRef.squatFramesInDown > 50) {
        repStateRef.current = 'up';
        repStateRef.squatHighestShoulderY = avgShoulderY;
        repStateRef.squatFramesInDown = 0;
      }
    } else {
      repStateRef.squatFramesInDown = 0;
    }
  } else if (mode === 'pushups') {
    // Prevent squats or jumping jacks (standing upright) from being falsely counted as pushups
    let isStanding = false;
    if (leftHip && leftHip.score > MIN_CONF && leftShoulder && leftShoulder.score > MIN_CONF) {
      if (leftHip.y - leftShoulder.y > 0.9 * shoulderWidth) {
        isStanding = true;
      }
    } else if (rightHip && rightHip.score > MIN_CONF && rightShoulder && rightShoulder.score > MIN_CONF) {
      if (rightHip.y - rightShoulder.y > 0.9 * shoulderWidth) {
        isStanding = true;
      }
    }
    if (isStanding) {
      return null;
    }

    // Push-up detection uses shoulder Y drop when user goes from plank-high (arms extended)
    // to plank-low (chest near floor). Camera is usually side-on or angled from above.
    // shoulderOk was previously undefined – this is the root cause of tracking failure.
    const shoulderOk = validShouldersCount > 0;

    if (shoulderOk && shoulderWidth > 0) {
      // 1. Initialize the "up" (arms extended) baseline
      if (repStateRef.pushupHighestShoulderY === undefined || repStateRef.pushupHighestShoulderY === null) {
        repStateRef.pushupHighestShoulderY = avgShoulderY;
      }

      // 2. Only update the baseline (highest = lowest Y value = highest on screen) when
      //    the user is in the 'up' state (arms extended, shoulders highest).
      //    This prevents the baseline from following the user down during a pushup.
      if (repStateRef.current === 'up') {
        if (avgShoulderY < repStateRef.pushupHighestShoulderY) {
          // Shoulders moved higher (smaller Y) → snap baseline up immediately
          repStateRef.pushupHighestShoulderY = avgShoulderY;
        } else {
          // Drift slowly upward to adapt to minor posture shifts
          repStateRef.pushupHighestShoulderY = repStateRef.pushupHighestShoulderY * 0.95 + avgShoulderY * 0.05;
        }
      }

      // 3. Compute how far shoulders have dropped relative to the "up" baseline
      //    Positive = shoulders dropped down (pushup lowering phase)
      const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;

      // 4. Trigger "down" when shoulders drop more than 22% of shoulder-width
      //    (works for side-view, top-down, and slightly angled camera positions)
      isActive = movedDownDist > 0.22;

      // 5. Self-healing: prevent getting permanently stuck in 'down' state
      if (repStateRef.current === 'down') {
        repStateRef.pushupFramesInDown = (repStateRef.pushupFramesInDown || 0) + 1;
        if (repStateRef.pushupFramesInDown > 40) {
          repStateRef.current = 'up';
          repStateRef.pushupHighestShoulderY = avgShoulderY;
          repStateRef.pushupFramesInDown = 0;
        }
      } else {
        repStateRef.pushupFramesInDown = 0;
      }
    }

  } else if (mode === 'jacks') {
    if (isMobile) {
      // Mobile-optimized Jumping Jacks with Elbow fallbacks when wrists go out of top frame
      const noseY = (nose?.score > MIN_CONF) ? nose.y : avgShoulderY - (shoulderWidth * 0.5);
      const aboveHeadThreshold = noseY - shoulderWidth * 0.3;

      const leftAboveHead  = leftWrist?.score  > MIN_CONF && leftWrist.y  < aboveHeadThreshold;
      const rightAboveHead = rightWrist?.score > MIN_CONF && rightWrist.y < aboveHeadThreshold;
      
      const leftElbowAboveShoulder = leftElbow?.score > MIN_CONF && leftElbow.y < (leftShoulder?.y ?? avgShoulderY);
      const rightElbowAboveShoulder = rightElbow?.score > MIN_CONF && rightElbow.y < (rightShoulder?.y ?? avgShoulderY);

      const leftRaised = leftAboveHead || leftElbowAboveShoulder;
      const rightRaised = rightAboveHead || rightElbowAboveShoulder;
      const bothHandsAboveHead = leftRaised && rightRaised;

      if (!repStateRef.headYHistory) repStateRef.headYHistory = [];
      repStateRef.headYHistory.push(noseY);
      if (repStateRef.headYHistory.length > 20) {
        repStateRef.headYHistory.shift();
      }

      let isJumping = false;
      if (repStateRef.headYHistory.length >= 8) {
        const standingFloorY = Math.max(...repStateRef.headYHistory);
        const jumpRise = standingFloorY - noseY;
        isJumping = jumpRise > shoulderWidth * 0.18;
      }

      isActive = bothHandsAboveHead && isJumping;

      if (repStateRef.current === 'down') {
        repStateRef.jacksFramesInDown = (repStateRef.jacksFramesInDown || 0) + 1;
        if (repStateRef.jacksFramesInDown > 45) {
          repStateRef.current = 'up';
          repStateRef.jacksFramesInDown = 0;
        }
      } else {
        repStateRef.jacksFramesInDown = 0;
      }
    } else {
      // Original Web/Desktop Jacks Logic
      const noseY = (nose?.score > MIN_CONF) ? nose.y : avgShoulderY - (shoulderWidth * 0.5);
      const aboveHeadThreshold = noseY - shoulderWidth * 0.3;

      const leftAboveHead  = leftWrist?.score  > MIN_CONF && leftWrist.y  < aboveHeadThreshold;
      const rightAboveHead = rightWrist?.score > MIN_CONF && rightWrist.y < aboveHeadThreshold;
      const bothHandsAboveHead = leftAboveHead && rightAboveHead;

      if (!repStateRef.headYHistory) repStateRef.headYHistory = [];
      repStateRef.headYHistory.push(noseY);
      if (repStateRef.headYHistory.length > 20) {
        repStateRef.headYHistory.shift();
      }

      let isJumping = false;
      if (repStateRef.headYHistory.length >= 8) {
        const standingFloorY = Math.max(...repStateRef.headYHistory);
        const jumpRise = standingFloorY - noseY;
        isJumping = jumpRise > shoulderWidth * 0.18;
      }

      isActive = bothHandsAboveHead && isJumping;
    }

  } else if (mode === 'highknees') {
    if (isMobile) {
      // Mobile-optimized High Knees Logic with Self-Healing
      const leftKneeHigh = leftKnee?.score > MIN_CONF && leftHip?.score > MIN_CONF && leftKnee.y < leftHip.y;
      const rightKneeHigh = rightKnee?.score > MIN_CONF && rightHip?.score > MIN_CONF && rightKnee.y < rightHip.y;
      isActive = leftKneeHigh || rightKneeHigh;

      if (repStateRef.current === 'down') {
        repStateRef.highkneesFramesInDown = (repStateRef.highkneesFramesInDown || 0) + 1;
        if (repStateRef.highkneesFramesInDown > 40) {
          repStateRef.current = 'up';
          repStateRef.highkneesFramesInDown = 0;
        }
      } else {
        repStateRef.highkneesFramesInDown = 0;
      }
    } else {
      // Original Web/Desktop High Knees Logic
      const leftKneeHigh = leftKnee?.score > MIN_CONF && leftHip?.score > MIN_CONF && leftKnee.y < leftHip.y;
      const rightKneeHigh = rightKnee?.score > MIN_CONF && rightHip?.score > MIN_CONF && rightKnee.y < rightHip.y;
      isActive = leftKneeHigh || rightKneeHigh;
    }
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
        // Rep counts when shoulders rise back to within 28% of shoulder-width from baseline
        // Hysteresis band: trigger at 0.46, release at 0.28
        if (repStateRef.squatHighestShoulderY !== undefined && repStateRef.squatHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
          returnedToStart = movedDownDist < 0.28;
        } else {
          returnedToStart = true;
        }

      } else if (mode === 'pushups') {
        if (repStateRef.pushupHighestShoulderY !== undefined && repStateRef.pushupHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
          // Rep counts when shoulders return to within 14% of shoulder-width from baseline
          // (hysteresis band: trigger at 0.22, release at 0.14)
          returnedToStart = movedDownDist < 0.14;
        } else {
          returnedToStart = true;
        }

      } else if (mode === 'jacks') {
        if (isMobile) {
          // Mobile rest check: support wrist and elbow coordinates for out-of-frame bounds
          const leftWristDown  = !leftWrist  || leftWrist.score  < MIN_CONF || leftWrist.y  > avgShoulderY;
          const rightWristDown = !rightWrist || rightWrist.score < MIN_CONF || rightWrist.y > avgShoulderY;
          
          const leftElbowDown  = !leftElbow  || leftElbow.score  < MIN_CONF || leftElbow.y  > (leftShoulder?.y ?? avgShoulderY);
          const rightElbowDown = !rightElbow || rightElbow.score < MIN_CONF || rightElbow.y > (rightShoulder?.y ?? avgShoulderY);

          returnedToStart = (leftWristDown && rightWristDown) || (leftElbowDown && rightElbowDown);
        } else {
          // Original Web/Desktop Jacks rest check
          const leftDown  = !leftWrist  || leftWrist.score  < MIN_CONF || leftWrist.y  > avgShoulderY;
          const rightDown = !rightWrist || rightWrist.score < MIN_CONF || rightWrist.y > avgShoulderY;

          returnedToStart = leftDown && rightDown;
        }
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
