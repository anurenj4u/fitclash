"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Crosshair, Zap, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import PositionCalibration from './PositionCalibration';

const StrengthEndurance = ({ selectedExercises, isCameraReady, onComplete }) => {
  const [stage, setStage] = useState('intro'); // intro, stage1_intro, stage1_playing, stage2_intro, stage2_playing, stage3_intro, stage3_playing, finished
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0); // for holds and boss mode
  const [reps, setReps] = useState(0);
  const [accuracy, setAccuracy] = useState(96);
  const [startTime, setStartTime] = useState(null);
  
  const previousRepsRef = useRef(0);
  const activeExercise = selectedExercises[0] || 'squats';

  useEffect(() => {
    if (stage === 'intro') {
      setTimeout(() => setStage('calibration'), 4000);
    } else if (stage === 'stage1_intro') {
      setTimeout(() => {
        setStage('stage1_playing');
        setTimer(30); // 30 second hold
        if (!startTime) setStartTime(Date.now());
      }, 4000);
    } else if (stage === 'stage2_intro') {
      setTimeout(() => {
        setStage('stage2_playing');
        setReps(0);
        previousRepsRef.current = 0;
      }, 4000);
    } else if (stage === 'stage3_intro') {
      setTimeout(() => {
        setStage('stage3_playing');
        setTimer(60); // 60 seconds boss survival
      }, 4000);
    }
  }, [stage, startTime]);

  useEffect(() => {
    let int;
    if ((stage === 'stage1_playing' || stage === 'stage3_playing') && timer > 0) {
      int = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(int);
            if (stage === 'stage1_playing') setStage('stage2_intro');
            if (stage === 'stage3_playing') handleEndWorkout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(int);
  }, [stage, timer]);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      const { reps: eventReps } = e.detail;
      
      if (stage === 'stage2_playing' || stage === 'stage3_playing') {
        if (eventReps > previousRepsRef.current) {
          previousRepsRef.current = eventReps;
          setReps(r => {
            const nextReps = r + 1;
            if (stage === 'stage2_playing' && nextReps >= 30) {
              setStage('stage3_intro');
            }
            return nextReps;
          });
          setAccuracy(Math.floor(92 + Math.random() * 7));
        }
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [stage]);

  const handleEndWorkout = () => {
    setStage('finished');
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#ff0055', '#ffffff', '#000000'] });
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  if (!isCameraReady) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
        <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,0,85,0.1)', borderTopColor: '#ff0055', borderRadius: '50%', animation: 'spin 1s infinite linear', marginBottom: '20px' }} />
        <h2 className="arcade-text" style={{ fontSize: '24px', color: '#ff0055', letterSpacing: '2px' }}>CALIBRATING SURVIVAL GEAR...</h2>
      </div>
    );
  }

  if (stage === 'intro') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }}>
          <ShieldAlert size={60} color="#ff0055" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 20px #ff0055)' }} />
          <h2 className="arcade-text" style={{ fontSize: 'clamp(30px, 6vw, 60px)', color: '#ff0055', textShadow: '0 0 20px #ff0055' }}>STRENGTH ENDURANCE GAUNTLET</h2>
          <p style={{ fontSize: '18px', color: '#fff', opacity: 0.8, marginTop: '10px' }}>3 STAGES. NO MERCY.</p>
        </motion.div>
      </div>
    );
  }

  if (stage === 'calibration') {
    return (
      <PositionCalibration 
        onCalibrated={() => setStage('stage1_intro')} 
        onSkip={() => setStage('stage1_intro')} 
      />
    );
  }

  if (stage.includes('intro') && stage !== 'intro' && stage !== 'calibration') {
    const stageNum = stage.replace('_intro', '').replace('stage', '');
    const title = stageNum === '1' ? 'STAGE 1: ISOMETRIC HOLD' : stageNum === '2' ? 'STAGE 2: BURNOUT ROUND' : 'FINAL STAGE: BOSS SURVIVAL';
    const subtitle = stageNum === '1' ? 'Hold the pose for 30 seconds.' : stageNum === '2' ? '30 Reps as fast as possible.' : 'Survive 60 seconds of maximum intensity.';
    
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 0, 85, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 40px)', color: '#ff0055', marginBottom: '10px' }}>{title}</h2>
          <p style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>{subtitle}</p>
        </motion.div>
      </div>
    );
  }

  if (stage === 'finished') {
    const durationSecs = Math.floor((Date.now() - startTime) / 1000);
    const finalCalories = Math.round(reps * 0.45 + 50); // bonus for holds
    const xpEarned = 500; // Flat large XP for surviving gauntlet
    
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto', color: '#fff', padding: '15px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '600px', width: '90%' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(30px, 6vw, 50px)', color: '#ff0055', marginBottom: '20px', textShadow: '0 0 20px #ff0055' }}>GAUNTLET SURVIVED</h2>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 0, 85, 0.3)', borderRadius: '16px', padding: '25px', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <p style={{ opacity: 0.6, fontSize: '10px', fontWeight: 800 }}>TOTAL REPS</p>
              <p className="arcade-text" style={{ fontSize: '24px', color: '#fff' }}>{reps}</p>
            </div>
            <div>
              <p style={{ opacity: 0.6, fontSize: '10px', fontWeight: 800 }}>CALORIES BURNED</p>
              <p className="arcade-text" style={{ fontSize: '24px', color: '#ff4444' }}>{finalCalories}</p>
            </div>
          </div>

          <button
            className="glow-btn"
            onClick={() => {
              exitFullscreen();
              if (onComplete) {
                onComplete({ reps, calories: finalCalories, xp: xpEarned, accuracy, duration: durationSecs, rank: 'GOD MODE' });
              }
            }}
            style={{
              background: '#ff0055',
              color: '#fff',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '30px',
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: '0 0 25px rgba(255, 0, 85, 0.6)'
            }}
          >
            CLAIM EPIC REWARDS
          </button>
        </motion.div>
      </div>
    );
  }

  // Playing stages
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, color: '#fff', padding: '20px' }}>
      
      {stage === 'stage3_playing' && timer <= 10 && (
        <motion.div animate={{ opacity: [0, 0.2, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} style={{ position: 'absolute', inset: 0, background: '#ff0000', zIndex: -1 }} />
      )}

      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,0,85,0.3)', padding: '8px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 700, display: 'block', color: '#ff0055' }}>STAGE</span>
          <span className="arcade-text" style={{ fontSize: '16px', color: '#fff' }}>
            {stage === 'stage1_playing' ? '1: HOLD' : stage === 'stage2_playing' ? '2: BURNOUT' : '3: BOSS'}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {stage === 'stage1_playing' && (
          <>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Crosshair size={48} color="#39ff14" style={{ marginBottom: '20px' }} />
            </motion.div>
            <h1 className="arcade-text" style={{ fontSize: 'clamp(80px, 20vh, 150px)', color: '#39ff14', lineHeight: 1, margin: 0, textShadow: '0 0 30px rgba(57, 255, 20, 0.5)' }}>{timer}</h1>
            <span style={{ fontSize: '14px', fontWeight: 800, marginTop: '10px', letterSpacing: '2px' }}>HOLD POSITION</span>
          </>
        )}

        {stage === 'stage2_playing' && (
          <>
            <h1 className="arcade-text" style={{ fontSize: 'clamp(80px, 20vh, 150px)', color: '#fff', lineHeight: 1, margin: 0 }}>{reps}</h1>
            <span style={{ fontSize: '14px', fontWeight: 800, marginTop: '10px', letterSpacing: '2px' }}>/ 30 REPS</span>
          </>
        )}

        {stage === 'stage3_playing' && (
          <>
            <h1 className="arcade-text" style={{ fontSize: 'clamp(80px, 20vh, 150px)', color: timer <= 10 ? '#ff0000' : '#ff0055', lineHeight: 1, margin: 0, textShadow: timer <= 10 ? '0 0 50px #ff0000' : '0 0 30px #ff0055' }}>{timer}</h1>
            <span style={{ fontSize: '14px', fontWeight: 800, marginTop: '10px', letterSpacing: '2px' }}>SURVIVE</span>
            {timer <= 10 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', top: '120%', whiteSpace: 'nowrap', color: '#ff0000', fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                DON'T GIVE UP!
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StrengthEndurance;
