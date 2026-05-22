"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import { analyzePose, analyzeFingers } from '@/utils/exerciseDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Maximize2 } from 'lucide-react';

const TARGET_FPS = 15;
const FRAME_MS = 1000 / TARGET_FPS;

const MotionTracker = ({ mode, onReady }) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [fingerCount, setFingerCount] = useState(null);
  const [positionWarning, setPositionWarning] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const workerRef = useRef(null);
  const repStateRef = useRef('up');
  const repCountRef = useRef(0);
  const isInitializingRef = useRef(false);
  const lastDetectTimeRef = useRef(0);
  const requestRef = useRef(null);
  const streamRef = useRef(null);
  const modeRef = useRef(mode);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'SET_MODE', payload: { mode } });
    }
    repStateRef.current = 'up';
    repCountRef.current = 0;
    setFingerCount(mode === 'fingers' ? 0 : null);
  }, [mode]);

  useEffect(() => {
    if (isInitializingRef.current || isActive || error) return;
    isInitializingRef.current = true;

    const setup = async () => {
      try {
        workerRef.current = new Worker(new URL('../workers/poseWorker.js', import.meta.url));
        workerRef.current.onmessage = (e) => {
          const { type, pose, fingerCount: fc, workerError, step, percent, message } = e.data;
          if (type === 'INIT_PROGRESS') {
            window.dispatchEvent(new CustomEvent('tracker-init-status', { 
              detail: { step, percent, message } 
            }));
          } else if (type === 'INIT_SUCCESS') {
            workerRef.current.postMessage({ type: 'SET_MODE', payload: { mode: modeRef.current } });
            startCamera();
          } else if (type === 'INIT_ERROR') {
            handleError(new Error(workerError || e.data.error || "Initialization failed"));
          } else if (type === 'POSE_DETECTED') {
            handlePose(pose);
          } else if (type === 'HAND_DETECTED') {
            handleHand(fc);
          }
        };
        workerRef.current.postMessage({ type: 'INIT' });
      } catch (err) { handleError(err); }
    };

    const startCamera = async () => {
      try {
        window.dispatchEvent(new CustomEvent('tracker-init-status', { 
          detail: { step: 'starting_camera', percent: 98, message: 'Requesting camera hardware access...' } 
        }));
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 30 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsActive(true);
          isInitializingRef.current = false;
          window.dispatchEvent(new CustomEvent('tracker-init-status', { 
            detail: { step: 'ready', percent: 100, message: 'Neural Engine Ready!' } 
          }));
          if (onReady) onReady();
          requestRef.current = requestAnimationFrame(detectLoop);
        }
      } catch (err) { handleError(err); }
    };
    setup();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (workerRef.current) workerRef.current.terminate();
      isInitializingRef.current = false;
    };
  }, []);

  const handleError = (err) => {
    console.error(err);
    isInitializingRef.current = false;
    const errorMsg = err.name === 'NotAllowedError' ? "PERMISSION DENIED" : "HARDWARE ERROR";
    setError(errorMsg);
    window.dispatchEvent(new CustomEvent('tracker-init-status', { 
      detail: { step: 'error', percent: 0, message: `Error: ${errorMsg}` } 
    }));
  };

  const triggerBoostUI = () => {
    setIsBoosting(true);
    setTimeout(() => setIsBoosting(false), 200);
  };

  const handlePose = (pose) => {
    if (!pose) {
      setPositionWarning('NO BODY DETECTED');
      return;
    } else {
      if (pose.keypoints) {
        const getPt = (name) => pose.keypoints.find(k => k.name === name);
        const thresh = 0.3;
        const ankles = (getPt('left_ankle')?.score > thresh || getPt('right_ankle')?.score > thresh);
        const shoulders = (getPt('left_shoulder')?.score > thresh || getPt('right_shoulder')?.score > thresh);
        const hips = (getPt('left_hip')?.score > thresh || getPt('right_hip')?.score > thresh);
        
        if (!shoulders && !hips && !ankles) setPositionWarning('NO BODY DETECTED');
        else if (!shoulders) setPositionWarning('UPPER BODY MISSING');
        else if (!hips) setPositionWarning('HIPS MISSING - STEP BACK');
        else if (!ankles) setPositionWarning('FEET MISSING - STEP BACK');
        else setPositionWarning(null);
      } else {
        setPositionWarning(null);
      }
    }

    window.dispatchEvent(new CustomEvent('raw-pose', { detail: pose }));
    const result = analyzePose(pose, modeRef.current, repStateRef, repCountRef);
    if (result) {
      triggerBoostUI();
      window.dispatchEvent(new CustomEvent('pose-update', { detail: { reps: result.reps, action: result.action } }));
    }
  };

  const handleHand = (fc) => {
    setFingerCount(fc);
    const result = analyzeFingers(fc, repStateRef, repCountRef);
    if (result) {
      triggerBoostUI();
      window.dispatchEvent(new CustomEvent('pose-update', { detail: { reps: result.reps, action: result.action } }));
    }
  };

  const detectLoop = async (time) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    if (time - lastDetectTimeRef.current >= FRAME_MS) {
      lastDetectTimeRef.current = time;
      try {
        const imageBitmap = await createImageBitmap(videoRef.current);
        if (workerRef.current) workerRef.current.postMessage({ type: 'DETECT', payload: { imageBitmap } }, [imageBitmap]);
        else imageBitmap.close();
      } catch (e) {}
    }
    requestRef.current = requestAnimationFrame(detectLoop);
  };

  if (isMinimized) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(2, 2, 5, 0.95)',
          border: '1.5px solid rgba(57, 255, 20, 0.5)',
          borderRadius: '20px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)',
          zIndex: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <span className="pulse" style={{ 
          width: '8px', 
          height: '8px', 
          background: '#39ff14', 
          borderRadius: '50%', 
          display: 'inline-block',
          boxShadow: '0 0 8px #39ff14',
          animation: 'pulse-glow 1.5s infinite' 
        }} />
        <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'var(--font-gaming)', color: '#39ff14', letterSpacing: '1px' }}>
          TRACKER ACTIVE ({mode === 'jacks' ? 'JACKS' : mode.toUpperCase()})
        </span>
        <Maximize2 size={12} color="#39ff14" style={{ marginLeft: '4px' }} />
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      width: isMobile ? '140px' : '280px', 
      zIndex: 500,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* HUD Label */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="hud-text" style={{ fontSize: '10px' }}>LINK STATUS: <span style={{ color: isActive ? 'var(--accent)' : 'var(--danger)' }}>{isActive ? 'ACTIVE' : 'CONNECTING'}</span></span>
          <span className="hud-text" style={{ fontSize: '10px' }}>{isActive ? '30 FPS' : '0 FPS'}</span>
        </div>
      )}

      {/* Camera Feed Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: isMobile ? '105px' : '210px', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '2px solid rgba(57, 255, 20, 0.4)', 
        background: '#000', 
        boxShadow: '0 0 30px rgba(0,0,0,0.6)' 
      }}>
        
        {/* Boost Flash Overlay */}
        <AnimatePresence>
          {isBoosting && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.3 }} 
              exit={{ opacity: 0 }} 
              style={{ position: 'absolute', inset: 0, background: 'var(--accent)', zIndex: 15 }}
            />
          )}
        </AnimatePresence>

        {/* Position Warning Overlay */}
        <AnimatePresence>
          {positionWarning && isActive && mode !== 'fingers' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 0, 0, 0.9)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 900,
                zIndex: 45,
                whiteSpace: 'nowrap',
                border: '1px solid #ffaa00',
                boxShadow: '0 0 15px rgba(255,0,0,0.8)'
              }}
            >
              ⚠️ {positionWarning}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimize Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          style={{
            position: 'absolute',
            top: isMobile ? '4px' : '8px',
            right: isMobile ? '4px' : '8px',
            zIndex: 40,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#39ff14'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
        >
          <Minimize2 size={12} />
        </button>

        {/* Corner Brackets */}
        <div style={{ position: 'absolute', top: isMobile ? 4 : 10, left: isMobile ? 4 : 10, width: isMobile ? 12 : 20, height: isMobile ? 12 : 20, borderLeft: '2px solid var(--accent)', borderTop: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', top: isMobile ? 4 : 10, right: isMobile ? 4 : 10, width: isMobile ? 12 : 20, height: isMobile ? 12 : 20, borderRight: '2px solid var(--accent)', borderTop: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', bottom: isMobile ? 4 : 10, left: isMobile ? 4 : 10, width: isMobile ? 12 : 20, height: isMobile ? 12 : 20, borderLeft: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', bottom: isMobile ? 4 : 10, right: isMobile ? 4 : 10, width: isMobile ? 12 : 20, height: isMobile ? 12 : 20, borderRight: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', zIndex: 20 }} />

        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 1 }} playsInline muted />
        
        {!isActive && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 30 }}>
            <div className="loader" style={{ width: '18px', height: '18px', border: '2px solid rgba(57,255,20,0.1)', borderTopColor: '#39ff14', borderRadius: '50%', animation: 'spin 1s infinite linear' }} />
          </div>
        )}
      </div>

      {/* Mode Status HUD */}
      {!isMobile && (
        <div className="glass-card" style={{ marginTop: '10px', padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p className="hud-text" style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '2px' }}>NEURAL TRACKER: ACTIVE</p>
          <p className="arcade-text" style={{ fontSize: '16px', color: 'var(--accent)', marginTop: '5px' }}>{mode === 'jacks' ? 'JUMPING JACKS' : mode.toUpperCase()}</p>
          
          {mode === 'fingers' && (
            <div style={{ marginTop: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', background: 'rgba(57, 255, 20, 0.05)', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '32px' }}>{['✊', '☝️', '✌️', '🤟', '🖖', '🖐️'][Math.min(fingerCount || 0, 5)]}</span>
              <div style={{ textAlign: 'left' }}>
                <p className="hud-text" style={{ fontSize: '12px', color: fingerCount === 1 ? 'var(--accent)' : '#fff', fontWeight: 800 }}>
                  {fingerCount === 1 ? 'LOCKED ON' : 'DETECTION REQ.'}
                </p>
                <p style={{ fontSize: '9px', opacity: 0.5 }}>{fingerCount === 1 ? 'READY FOR BOOST' : 'SHOW 1 FINGER'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* On mobile, we show a tiny mode tag below the video */}
      {isMobile && (
        <div style={{ 
          marginTop: '6px', 
          padding: '6px 8px', 
          borderRadius: '8px', 
          background: 'rgba(0,0,0,0.85)', 
          border: '1px solid rgba(57, 255, 20, 0.3)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          <span style={{ width: '5px', height: '5px', background: '#39ff14', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #39ff14' }} />
          <span style={{ fontSize: '8px', fontWeight: 900, fontFamily: 'var(--font-gaming)', color: '#39ff14', letterSpacing: '0.5px' }}>
            {mode === 'jacks' ? 'JACKS' : mode.toUpperCase()}
          </span>
          {mode === 'fingers' && (
            <span style={{ fontSize: '10px' }}>{['✊', '☝️', '✌️', '🤟', '🖖', '🖐️'][Math.min(fingerCount || 0, 5)]}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(MotionTracker);

