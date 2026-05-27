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

  // Focus optimizations solely on mobile viewports/devices to preserve working web/desktop algorithms
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 1024 || /Mobi|Android|iPhone/i.test(navigator.userAgent));

  let isActive = false;

  if (mode === 'squats') {
    // 1. Joint Angle Calculators for Squat Depth
    const getAngle = (p1, p2, p3) => {
      const theta1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
      const theta2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
      let angle = Math.abs((theta1 - theta2) * 180.0 / Math.PI);
      if (angle > 180.0) angle = 360.0 - angle;
      return angle;
    };

    const hasLeftKnee = leftHip?.score > MIN_CONF && leftKnee?.score > MIN_CONF && leftAnkle?.score > MIN_CONF;
    const hasRightKnee = rightHip?.score > MIN_CONF && rightKnee?.score > MIN_CONF && rightAnkle?.score > MIN_CONF;
    const leftKneeAngle = hasLeftKnee ? getAngle(leftHip, leftKnee, leftAnkle) : null;
    const rightKneeAngle = hasRightKnee ? getAngle(rightHip, rightKnee, rightAnkle) : null;

    const hasLeftHip = leftShoulder?.score > MIN_CONF && leftHip?.score > MIN_CONF && leftKnee?.score > MIN_CONF;
    const hasRightHip = rightShoulder?.score > MIN_CONF && rightHip?.score > MIN_CONF && rightKnee?.score > MIN_CONF;
    const leftHipAngle = hasLeftHip ? getAngle(leftShoulder, leftHip, leftKnee) : null;
    const rightHipAngle = hasRightHip ? getAngle(rightShoulder, rightHip, rightKnee) : null;

    let angleSaysStanding = false;
    let angleSaysSquatting = false;

    if (hasLeftKnee || hasRightKnee) {
      // If ankles are fully visible, use knee angles
      const kAngles = [leftKneeAngle, rightKneeAngle].filter(a => a !== null);
      const minKnee = Math.min(...kAngles);
      const maxKnee = Math.max(...kAngles);
      angleSaysStanding = maxKnee > 155;
      angleSaysSquatting = minKnee < 135;
    } else if (hasLeftHip || hasRightHip) {
      // If ankles are clipped (table mount / low camera angle), use hip angles fallback
      const hAngles = [leftHipAngle, rightHipAngle].filter(a => a !== null);
      const minHip = Math.min(...hAngles);
      const maxHip = Math.max(...hAngles);
      angleSaysStanding = maxHip > 150;
      angleSaysSquatting = minHip < 125;
    }

    // 2. Adaptive Shoulder Displacement Tracker
    if (shoulderOk && shoulderWidth > 0) {
      if (repStateRef.squatHighestShoulderY === undefined || repStateRef.squatHighestShoulderY === null) {
        repStateRef.squatHighestShoulderY = avgShoulderY;
      }

      // Self-Calibrating: If joint angles confirm user stood up, synchronize baseline
      if (angleSaysStanding) {
        repStateRef.squatHighestShoulderY = avgShoulderY;
        if (repStateRef.current === 'down') {
          repStateRef.current = 'up';
          repStateRef.squatFramesInDown = 0;
        }
      }

      if (repStateRef.current === 'up') {
        repStateRef.squatHighestShoulderY = Math.min(repStateRef.squatHighestShoulderY, avgShoulderY);
        repStateRef.squatHighestShoulderY = repStateRef.squatHighestShoulderY * 0.95 + avgShoulderY * 0.05;
      }

      const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
      const shoulderSaysSquatting = movedDownDist > 0.30;
      
      isActive = angleSaysSquatting || shoulderSaysSquatting;

      // Self-Healing: Reset stuck down-state after 40 frames (~1.3s)
      if (repStateRef.current === 'down') {
        repStateRef.squatFramesInDown = (repStateRef.squatFramesInDown || 0) + 1;
        if (repStateRef.squatFramesInDown > 40) {
          repStateRef.current = 'up';
          repStateRef.squatHighestShoulderY = avgShoulderY;
          repStateRef.squatFramesInDown = 0;
        }
      } else {
        repStateRef.squatFramesInDown = 0;
      }
    }

  } else if (mode === 'pushups') {
    if (isMobile) {
      // Mobile-optimized Pushup Logic with Self-Healing
      if (shoulderOk && shoulderWidth > 0) {
        if (repStateRef.pushupHighestShoulderY === undefined || repStateRef.pushupHighestShoulderY === null) {
          repStateRef.pushupHighestShoulderY = avgShoulderY;
        }
        
        if (repStateRef.current === 'up') {
          repStateRef.pushupHighestShoulderY = Math.min(repStateRef.pushupHighestShoulderY, avgShoulderY);
          repStateRef.pushupHighestShoulderY = repStateRef.pushupHighestShoulderY * 0.90 + avgShoulderY * 0.10; 
        }

        const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
        isActive = movedDownDist > 0.20; 

        if (repStateRef.current === 'down') {
          repStateRef.pushupFramesInDown = (repStateRef.pushupFramesInDown || 0) + 1;
          if (repStateRef.pushupFramesInDown > 45) {
            repStateRef.current = 'up';
            repStateRef.pushupHighestShoulderY = avgShoulderY;
            repStateRef.pushupFramesInDown = 0;
          }
        } else {
          repStateRef.pushupFramesInDown = 0;
        }
      }
    } else {
      // Original Web/Desktop Pushup Logic
      if (shoulderOk && shoulderWidth > 0) {
        if (repStateRef.pushupHighestShoulderY === undefined || repStateRef.pushupHighestShoulderY === null) {
          repStateRef.pushupHighestShoulderY = avgShoulderY;
        }
        
        if (repStateRef.current === 'up') {
          repStateRef.pushupHighestShoulderY = Math.min(repStateRef.pushupHighestShoulderY, avgShoulderY);
          repStateRef.pushupHighestShoulderY = repStateRef.pushupHighestShoulderY * 0.90 + avgShoulderY * 0.10; 
        }

        const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
        isActive = movedDownDist > 0.20; 
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
        // Unified stand-up verification (joint angles + displacement fallback)
        const getAngle = (p1, p2, p3) => {
          const theta1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
          const theta2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
          let angle = Math.abs((theta1 - theta2) * 180.0 / Math.PI);
          if (angle > 180.0) angle = 360.0 - angle;
          return angle;
        };

        const hasLeftKnee = leftHip?.score > MIN_CONF && leftKnee?.score > MIN_CONF && leftAnkle?.score > MIN_CONF;
        const hasRightKnee = rightHip?.score > MIN_CONF && rightKnee?.score > MIN_CONF && rightAnkle?.score > MIN_CONF;
        const leftKneeAngle = hasLeftKnee ? getAngle(leftHip, leftKnee, leftAnkle) : null;
        const rightKneeAngle = hasRightKnee ? getAngle(rightHip, rightKnee, rightAnkle) : null;

        const hasLeftHip = leftShoulder?.score > MIN_CONF && leftHip?.score > MIN_CONF && leftKnee?.score > MIN_CONF;
        const hasRightHip = rightShoulder?.score > MIN_CONF && rightHip?.score > MIN_CONF && rightKnee?.score > MIN_CONF;
        const leftHipAngle = hasLeftHip ? getAngle(leftShoulder, leftHip, leftKnee) : null;
        const rightHipAngle = hasRightHip ? getAngle(rightShoulder, rightHip, rightKnee) : null;

        let angleSaysStanding = false;
        if (hasLeftKnee || hasRightKnee) {
          const kAngles = [leftKneeAngle, rightKneeAngle].filter(a => a !== null);
          angleSaysStanding = Math.max(...kAngles) > 155;
        } else if (hasLeftHip || hasRightHip) {
          const hAngles = [leftHipAngle, rightHipAngle].filter(a => a !== null);
          angleSaysStanding = Math.max(...hAngles) > 150;
        }

        if (angleSaysStanding) {
          returnedToStart = true;
        } else if (repStateRef.squatHighestShoulderY !== undefined && repStateRef.squatHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.squatHighestShoulderY) / shoulderWidth;
          returnedToStart = movedDownDist < 0.15;
        } else {
          returnedToStart = true;
        }

      } else if (mode === 'pushups') {
        if (repStateRef.pushupHighestShoulderY !== undefined && repStateRef.pushupHighestShoulderY !== null) {
          const movedDownDist = (avgShoulderY - repStateRef.pushupHighestShoulderY) / shoulderWidth;
          returnedToStart = movedDownDist < 0.12; 
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
