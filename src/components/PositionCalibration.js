"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, AlertTriangle, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';

const PositionCalibration = ({ mode = null, onCalibrated, onSkip }) => {
  const [feedback, setFeedback] = useState('Initializing Sensors...');
  const [feedbackType, setFeedbackType] = useState('warning'); // warning, success, info
  const [isGood, setIsGood] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [demoReps, setDemoReps] = useState(0);
  const lastRepCountRef = useRef(0);
  const goodFramesRef = useRef(0);

  useEffect(() => {
    const handleRawPose = (e) => {
      if (mode === 'fingers') return; // Handled separately
      const pose = e.detail;
      if (!pose || !pose.keypoints) {
        setFeedback('No body detected. Step into frame.');
        setFeedbackType('warning');
        setIsGood(false);
        goodFramesRef.current = 0;
        return;
      }
      
      const keypoints = pose.keypoints;
      const getPt = (name) => keypoints.find(k => k.name === name);
      
      const leftAnkle = getPt('left_ankle');
      const rightAnkle = getPt('right_ankle');
      const leftShoulder = getPt('left_shoulder');
      const rightShoulder = getPt('right_shoulder');
      const leftHip = getPt('left_hip');
      const rightHip = getPt('right_hip');

      const thresh = 0.4; // Strict confidence required
      
      const shouldersVisible = mode === 'pushups' ? true : (leftShoulder?.score > thresh || rightShoulder?.score > thresh);
      const hipsVisible = mode === 'pushups' ? true : (leftHip?.score > thresh || rightHip?.score > thresh);
      // Treat ankles as always visible to allow table-mounted tracking
      const anklesVisible = true;

      if (!shouldersVisible && !hipsVisible) {
        setFeedback('Step into the frame so the AI can track you.');
        setFeedbackType('info');
        setIsGood(false);
        goodFramesRef.current = 0;
      } else if (!shouldersVisible) {
        setFeedback('Upper body missing. Tilt camera UP or step back.');
        setFeedbackType('warning');
        setIsGood(false);
        goodFramesRef.current = 0;
      } else if (!hipsVisible) {
        setFeedback('Hips not visible. Step further back.');
        setFeedbackType('warning');
        setIsGood(false);
        goodFramesRef.current = 0;
      } else {
        setFeedback('PERFECT POSITION! HOLD STILL...');
        setFeedbackType('success');
        setIsGood(true);
        goodFramesRef.current += 1;
      }
    };

    const handleRawHand = (e) => {
      if (mode !== 'fingers') return;
      const fc = e.detail;
      if (fc !== null && fc !== undefined) {
        setFeedback('HAND DETECTED! READY...');
        setFeedbackType('success');
        setIsGood(true);
        goodFramesRef.current += 1;
      } else {
        setFeedback('Show your hand to the camera.');
        setFeedbackType('warning');
        setIsGood(false);
        goodFramesRef.current = 0;
      }
    };

    window.addEventListener('raw-pose', handleRawPose);
    window.addEventListener('raw-hand', handleRawHand);
    return () => {
      window.removeEventListener('raw-pose', handleRawPose);
      window.removeEventListener('raw-hand', handleRawHand);
    };
  }, [mode]);

  // Reset demo reps if user steps out of position
  useEffect(() => {
    if (!isGood) {
      setDemoReps(0);
      lastRepCountRef.current = 0;
    }
  }, [isGood]);

  // Track pose-update rep increments for interactive warmup
  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (!isGood) return;
      const { reps } = e.detail;
      if (reps > lastRepCountRef.current) {
        lastRepCountRef.current = reps;
        setDemoReps(prev => {
          const next = prev + 1;
          return Math.min(2, next);
        });
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [isGood]);

  // Handle countdown after position and warmup reps are done
  useEffect(() => {
    let int;
    if (isGood && demoReps >= 2) {
      int = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(int);
            if (onCalibrated) onCalibrated();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(3);
    }
    return () => clearInterval(int);
  }, [isGood, demoReps, onCalibrated]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(2, 2, 5, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 95,
      backdropFilter: 'blur(15px)',
      pointerEvents: 'auto',
      padding: '20px'
    }}>
      
      <motion.div 
        animate={{ scale: isGood ? [1, 1.05, 1] : 1 }}
        transition={{ repeat: Infinity, duration: 1 }}
        style={{
          width: 'clamp(60px, 15vh, 100px)',
          height: 'clamp(60px, 15vh, 100px)',
          borderRadius: '50%',
          background: isGood ? (demoReps >= 2 ? 'rgba(57, 255, 20, 0.15)' : 'rgba(0, 242, 255, 0.15)') : 'rgba(255, 68, 68, 0.15)',
          border: `2px solid ${isGood ? (demoReps >= 2 ? '#39ff14' : '#00f2ff') : '#ff4444'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: `0 0 30px ${isGood ? (demoReps >= 2 ? 'rgba(57, 255, 20, 0.4)' : 'rgba(0, 242, 255, 0.4)') : 'rgba(255, 68, 68, 0.4)'}`
        }}
      >
        {isGood ? (demoReps >= 2 ? <CheckCircle size={40} color="#39ff14" /> : <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}><Scan size={40} color="#00f2ff" /></motion.div>) : <Scan size={40} color="#ff4444" />}
      </motion.div>

      <h2 className="arcade-text" style={{ 
        fontSize: 'clamp(20px, 5vw, 36px)', 
        color: isGood ? (demoReps >= 2 ? '#39ff14' : '#00f2ff') : '#ff4444', 
        marginBottom: '15px',
        textAlign: 'center',
        textShadow: `0 0 15px ${isGood ? (demoReps >= 2 ? 'rgba(57, 255, 20, 0.5)' : 'rgba(0, 242, 255, 0.5)') : 'rgba(255, 68, 68, 0.5)'}`
      }}>
        {isGood ? (demoReps >= 2 ? 'READY TO START!' : 'WARMING UP...') : 'CALIBRATING POSITION'}
      </h2>

      {/* Main feedback container */}
      <div style={{
        background: isGood ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isGood ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
        padding: '15px 25px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '30px',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: isGood ? '0 4px 20px rgba(0, 242, 255, 0.1)' : 'none'
      }}>
        {!isGood ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#ffaa00" />
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: 800 }}>
              {feedback}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <span style={{ fontSize: '14px', color: '#00f2ff', fontWeight: 900, letterSpacing: '1px' }}>
              {demoReps >= 2 ? '🎉 TRACKING VERIFIED!' : (mode === 'fingers' ? '⚡ SHOW 5 FINGERS, THEN FOLD FIST (2 TIMES)' : '⚡ PERFORM 2 QUICK WARMUP REPS TO UNLOCK')}
            </span>
            
            {/* Warmup Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginTop: '4px' }}>
              <motion.div 
                animate={{ width: `${(demoReps / 2) * 100}%` }}
                style={{ 
                  height: '100%', 
                  background: demoReps >= 2 ? 'linear-gradient(90deg, #00f2ff, #39ff14)' : '#00f2ff',
                  boxShadow: demoReps >= 2 ? '0 0 10px #39ff14' : '0 0 10px #00f2ff'
                }} 
              />
            </div>
            
            <span style={{ fontSize: '11px', color: '#fff', opacity: 0.6, fontWeight: 700 }}>
              WARMUP PROGRESS: {demoReps} / 2 DEMO REPS COMPLETED
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isGood && demoReps >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="arcade-text"
            style={{ fontSize: 'clamp(60px, 15vh, 100px)', color: '#39ff14', textShadow: '0 0 30px #39ff14', marginBottom: '20px' }}
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => onSkip && onSkip()}
        style={{
          marginTop: isGood ? '0px' : '40px',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px 20px',
          borderRadius: '30px',
          fontSize: '11px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
      >
        SKIP WARMUP & START MATCH
      </button>
    </div>
  );
};

export default PositionCalibration;
