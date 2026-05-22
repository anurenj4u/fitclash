"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, AlertTriangle, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';

const PositionCalibration = ({ onCalibrated, onSkip }) => {
  const [feedback, setFeedback] = useState('Initializing Sensors...');
  const [feedbackType, setFeedbackType] = useState('warning'); // warning, success, info
  const [isGood, setIsGood] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const goodFramesRef = useRef(0);

  useEffect(() => {
    const handleRawPose = (e) => {
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
      
      const anklesVisible = (leftAnkle?.score > thresh || rightAnkle?.score > thresh);
      const shouldersVisible = (leftShoulder?.score > thresh || rightShoulder?.score > thresh);
      const hipsVisible = (leftHip?.score > thresh || rightHip?.score > thresh);

      if (!shouldersVisible && !hipsVisible && !anklesVisible) {
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
      } else if (!anklesVisible) {
        setFeedback('Feet not visible. Tilt camera DOWN or step back.');
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

    window.addEventListener('raw-pose', handleRawPose);
    return () => window.removeEventListener('raw-pose', handleRawPose);
  }, []);

  useEffect(() => {
    let int;
    if (isGood) {
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
  }, [isGood, onCalibrated]);

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
          background: isGood ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 68, 68, 0.15)',
          border: `2px solid ${isGood ? '#39ff14' : '#ff4444'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: `0 0 30px ${isGood ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 68, 68, 0.4)'}`
        }}
      >
        {isGood ? <CheckCircle size={40} color="#39ff14" /> : <Scan size={40} color="#ff4444" />}
      </motion.div>

      <h2 className="arcade-text" style={{ 
        fontSize: 'clamp(20px, 5vw, 36px)', 
        color: isGood ? '#39ff14' : '#ff4444', 
        marginBottom: '15px',
        textAlign: 'center',
        textShadow: `0 0 15px ${isGood ? 'rgba(57, 255, 20, 0.5)' : 'rgba(255, 68, 68, 0.5)'}`
      }}>
        {isGood ? 'POSITION LOCKED' : 'CALIBRATING POSITION'}
      </h2>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '15px 25px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '30px',
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        {!isGood && <AlertTriangle size={20} color="#ffaa00" />}
        <span style={{ fontSize: '14px', color: '#fff', fontWeight: 800, lineHeight: 1.5 }}>
          {feedback}
        </span>
      </div>

      <AnimatePresence>
        {isGood && (
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
        SKIP CALIBRATION (NOT RECOMMENDED)
      </button>
    </div>
  );
};

export default PositionCalibration;
