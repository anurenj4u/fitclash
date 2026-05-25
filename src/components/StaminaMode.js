"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ShieldCheck, Flame, Zap, Trophy, Award, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import PositionCalibration from './PositionCalibration';

const StaminaMode = ({ selectedExercises, isCameraReady, onComplete, staminaData, onSaveStaminaData, onExerciseChange }) => {
  const [gameState, setGameState] = useState('motivation'); // motivation, calibration_intro, playing, rest, finished
  const [countdown, setCountdown] = useState(3);
  const [restTimer, setRestTimer] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  const [reps, setReps] = useState(0);
  const [accuracy, setAccuracy] = useState(95);
  const [combo, setCombo] = useState(0);
  const maxComboRef = useRef(0);
  const [startTime, setStartTime] = useState(null);
  const [durationSecs, setDurationSecs] = useState(0);
  
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const previousRepsRef = useRef(0);
  const boostAudioRef = useRef(null);

  useEffect(() => {
    boostAudioRef.current = new Audio('/sounds/boost.mp3');
    boostAudioRef.current.volume = 0.4;
  }, []);

  const isCalibrated = staminaData?.isCalibrated || false;
  const isCalibrationRun = !isCalibrated;

  const activeExercise = selectedExercises[currentExerciseIndex] || selectedExercises[0];
  
  // Adaptive targets
  const targetReps = isCalibrationRun ? 999 : (staminaData?.currentTargets?.[activeExercise] || 30);

  useEffect(() => {
    if (onExerciseChange) onExerciseChange(currentExerciseIndex);
  }, [currentExerciseIndex, onExerciseChange]);

  useEffect(() => {
    if (gameState === 'motivation') {
      const timer = setTimeout(() => {
        setGameState(isCalibrationRun ? 'calibration_intro' : 'ready');
      }, 5000);
      return () => clearTimeout(timer);
    }
    
    if (gameState === 'calibration_intro') {
      const timer = setTimeout(() => {
        setGameState('ready');
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (gameState === 'ready' && isCameraReady) {
      setGameState('calibration');
    }
  }, [gameState, isCameraReady, isCalibrationRun]);

  useEffect(() => {
    if (gameState === 'countdown') {
      let count = 3;
      setCountdown(count);
      const int = setInterval(() => {
        count -= 1;
        if (count > 0) setCountdown(count);
        else {
          clearInterval(int);
          setGameState('playing');
        }
      }, 1000);
      return () => clearInterval(int);
    }
  }, [gameState]);

  useEffect(() => {
    let interval;
    if (gameState === 'rest' && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setGameState('ready');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, restTimer]);

  useEffect(() => {
    if (gameState === 'playing' && !startTime) {
      setStartTime(Date.now());
    }
  }, [gameState, startTime]);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (gameState !== 'playing') return;
      const { reps: eventReps } = e.detail;
      if (eventReps > previousRepsRef.current) {
        previousRepsRef.current = eventReps;
        
        if (boostAudioRef.current) {
          boostAudioRef.current.currentTime = 0;
          boostAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
        setCombo(c => {
          const nc = c + 1;
          maxComboRef.current = Math.max(maxComboRef.current, nc);
          return nc;
        });
        setAccuracy(Math.floor(92 + Math.random() * 7));
        const messages = ['KEEP GOING', 'STEADY PACE', 'PUSH IT', 'GREAT STAMINA'];
        setFeedbackMsg(messages[Math.floor(Math.random() * messages.length)]);
        setFeedbackKey(k => k + 1);
        
        setReps(prev => {
          const nextReps = prev + 1;
          
          if (!isCalibrationRun && nextReps >= targetReps) {
            if (currentExerciseIndex < selectedExercises.length - 1) {
              setGameState('rest');
              setRestTimer(20);
              setCurrentExerciseIndex(i => i + 1);
            } else {
              handleEndWorkout();
            }
          }
          return nextReps;
        });
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [gameState, currentExerciseIndex, selectedExercises.length, targetReps, isCalibrationRun]);

  const handleEndWorkout = () => {
    setGameState('finished');
    setDurationSecs(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    confetti({ particleCount: 150, spread: 75, origin: { y: 0.6 }, colors: ['#ff00ff', '#ffffff', '#00f2ff'] });
  };

  // Calibration manual finish button (because target is 999)
  const finishCalibration = () => {
    handleEndWorkout();
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  if (gameState === 'motivation') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <Zap size={48} color="#00f2ff" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 10px #00f2ff)' }} />
          <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 40px)', color: '#00f2ff', marginBottom: '15px' }}>DAILY MOTIVATION</h2>
          <p style={{ fontSize: '18px', color: '#fff', opacity: 0.8, maxWidth: '500px', lineHeight: 1.6 }}>
            {isCalibrationRun 
              ? "Today is day one. We need to find your baseline. Push as hard as you can until failure." 
              : `Yesterday you crushed it. Today's target is adaptive. Let's build that stamina.`}
          </p>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'calibration_intro') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Activity size={60} color="#ff4444" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 20px #ff4444)' }} />
          <h2 className="arcade-text" style={{ fontSize: 'clamp(30px, 6vw, 50px)', color: '#ff4444' }}>STAMINA CALIBRATION</h2>
          <p style={{ fontSize: '16px', color: '#fff', marginTop: '10px' }}>DO AS MANY {activeExercise.toUpperCase()} AS POSSIBLE.</p>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const finalCalories = Math.round(reps * 0.45 + 10);
    const xpEarned = reps * 15; // More XP for stamina
    
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto', color: '#fff', padding: '15px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '600px', width: '90%' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 42px)', color: '#00f2ff', marginBottom: '20px', textShadow: '0 0 15px #00f2ff' }}>
            {isCalibrationRun ? 'BASELINE ESTABLISHED' : 'STAMINA INCREASED'}
          </h2>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(0, 242, 255, 0.3)', borderRadius: '16px', padding: '25px', marginBottom: '25px' }}>
            <p style={{ opacity: 0.6, fontSize: '12px', marginBottom: '10px', fontWeight: 800 }}>TOTAL REPS ACHIEVED</p>
            <p className="arcade-text" style={{ fontSize: '48px', color: '#00f2ff' }}>{reps}</p>
          </div>

          <button
            className="glow-btn"
            onClick={() => {
              exitFullscreen();
              
              const newStaminaData = { ...staminaData };
              if (isCalibrationRun) {
                newStaminaData.isCalibrated = true;
                newStaminaData.baseline = { ...newStaminaData.baseline, [activeExercise]: reps };
                newStaminaData.currentTargets = { ...newStaminaData.currentTargets, [activeExercise]: Math.max(10, Math.floor(reps * 0.8)) };
              } else {
                // Adaptive logic: if completed, increase target by 10%
                newStaminaData.currentTargets = { ...newStaminaData.currentTargets, [activeExercise]: Math.floor(targetReps * 1.1) };
              }

              if (onSaveStaminaData) onSaveStaminaData(newStaminaData);
              if (onComplete) {
                onComplete({ reps, calories: finalCalories, xp: xpEarned, accuracy, duration: durationSecs, rank: 'S RANK' });
              }
            }}
            style={{
              background: '#00f2ff',
              color: '#000',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '30px',
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: '0 0 25px #00f2ff'
            }}
          >
            CONFIRM & EXIT
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, color: '#fff' }}>
      {gameState === 'ready' && !isCameraReady && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
          <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,242,255,0.1)', borderTopColor: '#00f2ff', borderRadius: '50%', animation: 'spin 1s infinite linear', marginBottom: '20px' }} />
          <h2 className="arcade-text" style={{ fontSize: '24px', color: '#00f2ff', letterSpacing: '2px' }}>CALIBRATING SENSORS...</h2>
        </div>
      )}

      {gameState === 'calibration' && (
        <PositionCalibration 
          mode={activeExercise}
          onCalibrated={() => setGameState('countdown')} 
          onSkip={() => setGameState('countdown')} 
        />
      )}

      {gameState === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
          <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="arcade-text" style={{ fontSize: '120px', color: '#00f2ff', textShadow: '0 0 30px #00f2ff' }}>
            {countdown}
          </motion.div>
        </div>
      )}

      {gameState === 'rest' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(25px)' }}>
          <motion.h2 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="arcade-text" style={{ fontSize: '40px', color: '#ff00ff', marginBottom: '20px' }}>
            CATCH YOUR BREATH
          </motion.h2>
          <div className="arcade-text" style={{ fontSize: '80px', color: '#ffffff', textShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}>
            {restTimer}
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 'clamp(10px, 3vh, 30px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
            <div>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,242,255,0.3)', padding: '8px 16px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 700, display: 'block' }}>TARGET</span>
                <span className="arcade-text" style={{ fontSize: '20px', color: '#00f2ff' }}>{isCalibrationRun ? 'MAX' : targetReps}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <h1 className="arcade-text" style={{ fontSize: 'clamp(60px, 15vh, 120px)', color: '#fff', lineHeight: 1, margin: 0, textShadow: '0 0 20px rgba(0, 242, 255, 0.3)' }}>{reps}</h1>
              
              <AnimatePresence>
                {feedbackMsg && (
                  <motion.div key={feedbackKey} initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: -40, scale: 1 }} exit={{ opacity: 0, y: -60 }} transition={{ duration: 1 }} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', color: '#ff00ff', textShadow: '0 0 10px #ff00ff', fontWeight: 900, fontSize: '18px', fontFamily: 'var(--font-gaming)' }}>
                    {feedbackMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isCalibrationRun && (
              <button onClick={finishCalibration} style={{ marginTop: '40px', background: 'transparent', border: '2px solid #ff4444', color: '#ff4444', padding: '10px 30px', borderRadius: '30px', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                GIVE UP / FINISHED
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaminaMode;
