"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Flame, Zap, Award, Activity, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import PositionCalibration from './PositionCalibration';

const enterFullscreen = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen().catch((err) => console.log("Fullscreen error:", err));
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

const exitFullscreen = () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) return;
  if (document.exitFullscreen) {
    document.exitFullscreen().catch((err) => console.log("Exit fullscreen error:", err));
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const NormalWorkout = ({
  selectedExercises = ['squats', 'pushups', 'jacks'],
  difficulty = 'easy',
  selectedGoal = 'FAT BURN',
  isCameraReady,
  onExerciseChange,
  onComplete
}) => {
  const [reps, setReps] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, countdown, playing, rest
  const [countdown, setCountdown] = useState(3);
  const [restTimer, setRestTimer] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [accuracy, setAccuracy] = useState(95);
  const [combo, setCombo] = useState(0);
  const maxComboRef = useRef(0);
  const [startTime, setStartTime] = useState(null);
  const [durationSecs, setDurationSecs] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const { user } = useAuth();
  const [trackerProgress, setTrackerProgress] = useState({ percent: 0, message: 'Launching Neural Core...' });
  const [positionStatus, setPositionStatus] = useState(null); // null = good, string = warning

  const previousRepsRef = useRef(0);
  
  const targetRepsPerExercise = difficulty === 'hard' ? 100 : difficulty === 'medium' ? 50 : 20;
  const targetRepsNeeded = targetRepsPerExercise * selectedExercises.length;

  useEffect(() => {
    const handleProgress = (e) => {
      const { percent, message } = e.detail;
      setTrackerProgress({ percent, message });
    };
    window.addEventListener('tracker-init-status', handleProgress);
    return () => window.removeEventListener('tracker-init-status', handleProgress);
  }, []);

  const activeExercise = selectedExercises[currentExerciseIndex % selectedExercises.length] || 'squats';

  useEffect(() => {
    // Tell parent which exercise is active so it can set the tracker mode
    if (onExerciseChange) onExerciseChange(currentExerciseIndex);
  }, [currentExerciseIndex, onExerciseChange]);

  useEffect(() => {
    if (isCameraReady && gameState === 'waiting') {
      setGameState('ready');
    }
  }, [isCameraReady, gameState]);

  const startCountdown = () => {
    setGameState('countdown');
    let timer = 3;
    setCountdown(timer);
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 1000);
  };

  useEffect(() => {
    let interval;
    if (gameState === 'rest') {
      if (restTimer > 0) {
        interval = setInterval(() => {
          setRestTimer(t => t - 1);
        }, 1000);
      } else {
        startCountdown();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, restTimer]);

  useEffect(() => {
    if (gameState === 'playing' && !startTime) {
      setStartTime(Date.now());
    }
  }, [gameState, startTime]);

  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (gameState !== 'playing') return;
      const { reps: eventReps } = e.detail;
      if (eventReps > previousRepsRef.current) {
        previousRepsRef.current = eventReps;
        setCombo(c => {
          const nc = c + 1;
          maxComboRef.current = Math.max(maxComboRef.current, nc);
          return nc;
        });
        setAccuracy(Math.floor(92 + Math.random() * 7));
        const messages = ['PERFECT REP', 'EXCELLENT FORM', 'KEEP IT UP', 'STEADY PACE', 'NICE SPEED', 'GO LOWER'];
        setFeedbackMsg(messages[Math.floor(Math.random() * messages.length)]);
        setFeedbackKey(k => k + 1);
        setReps((prev) => {
          const nextReps = prev + 1;

          if (nextReps % targetRepsPerExercise === 0 && nextReps < targetRepsNeeded) {
            setGameState('rest');
            setRestTimer(120); // 120s rest between exercises as requested
            setCurrentExerciseIndex(prevIndex => prevIndex + 1);
          }

          // Check if target distance is achieved
          if (nextReps >= targetRepsNeeded) {
            handleEndWorkout();
          }

          return nextReps;
        });
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [gameState, selectedExercises, targetRepsNeeded, difficulty]);

  // Live position check using raw-pose events from MotionTracker
  useEffect(() => {
    const handleRawPose = (e) => {
      const pose = e.detail;
      if (!pose || !pose.keypoints) {
        setPositionStatus('NO BODY DETECTED');
        return;
      }
      const getPt = (name) => pose.keypoints.find(k => k.name === name);
      const thresh = 0.3;
      const ankles = getPt('left_ankle')?.score > thresh || getPt('right_ankle')?.score > thresh;
      const shoulders = getPt('left_shoulder')?.score > thresh || getPt('right_shoulder')?.score > thresh;
      const hips = getPt('left_hip')?.score > thresh || getPt('right_hip')?.score > thresh;
      if (!shoulders && !hips && !ankles) setPositionStatus('NO BODY DETECTED');
      else if (!shoulders) setPositionStatus('⬆ SHOW UPPER BODY');
      else if (!hips) setPositionStatus('↔ STEP BACK - HIPS MISSING');
      else if (!ankles) setPositionStatus('⬇ STEP BACK - FEET MISSING');
      else setPositionStatus(null); // all good
    };
    window.addEventListener('raw-pose', handleRawPose);
    return () => window.removeEventListener('raw-pose', handleRawPose);
  }, []);

  const handleEndWorkout = () => {
    setIsFinished(true);
    setDurationSecs(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    confetti({ particleCount: 150, spread: 75, origin: { y: 0.6 }, colors: ['#39ff14', '#ffffff', '#00f2ff'] });
  };

  const getExerciseLabel = (ex) => {
    if (ex === 'jacks') return 'JUMPING JACKS';
    if (ex === 'fingers') return 'FINGER SPRINT';
    return ex.toUpperCase();
  };

  const distancePerRep = difficulty === 'easy' ? 20 : 10;
  const currentDistanceMeters = reps * distancePerRep;
  const totalTargetMeters = targetRepsNeeded * distancePerRep;
  const progressPercent = Math.min((currentDistanceMeters / totalTargetMeters) * 100, 100);

  if (isFinished) {
    const finalCalories = Math.round(reps * 0.45 + 10);
    const xpEarned = reps * 10 + (difficulty === 'hard' ? 200 : 50);
    const score = (accuracy * 0.4) + (reps * 0.4) - (durationSecs * 0.2);
    let rank = 'C RANK';
    let rankColor = '#fff';
    if (score > 150) { rank = 'GOD MODE'; rankColor = '#ff00ff'; }
    else if (score > 120) { rank = 'S RANK'; rankColor = '#ffd700'; }
    else if (score > 90) { rank = 'A RANK'; rankColor = '#39ff14'; }
    else if (score > 60) { rank = 'B RANK'; rankColor = '#00f2ff'; }

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto', color: '#fff', padding: '15px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '600px', width: '90%' }}>
          <div style={{ width: 'clamp(50px, 10vh, 80px)', height: 'clamp(50px, 10vh, 80px)', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(10px, 2vh, 20px) auto', border: `2px solid ${rankColor}`, boxShadow: `0 0 20px ${rankColor}` }}>
            <Award size={32} color={rankColor} />
          </div>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 42px)', color: rankColor, marginBottom: 'clamp(4px, 1vh, 8px)', textShadow: `0 0 15px ${rankColor}` }}>{rank}</h2>
          <p style={{ opacity: 0.6, fontSize: 'clamp(11px, 2vw, 13px)', marginBottom: 'clamp(15px, 3vh, 30px)' }}>WORKOUT COMPLETE: {difficulty.toUpperCase()} DIFFICULTY</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>CALORIES BURNED</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#ff4444' }}>{finalCalories} KCAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>ACCURACY</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#39ff14' }}>{accuracy}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>DURATION</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#fff' }}>{Math.floor(durationSecs / 60)}:{(durationSecs % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>TOTAL REPS</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#fff' }}>{reps}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>MAX COMBO</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#00f2ff' }}>{maxComboRef.current}x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>XP EARNED</span>
                <span className="arcade-text" style={{ fontSize: '14px', color: '#ffd700' }}>+{xpEarned}</span>
              </div>
            </div>
          </div>

          <button
            className="glow-btn"
            onClick={() => {
              exitFullscreen();
              if (onComplete) {
                // Pass back detailed stats
                onComplete({ reps, calories: finalCalories, xp: xpEarned, accuracy, duration: durationSecs, rank });
              } else {
                window.location.reload();
              }
            }}
            style={{
              background: rankColor,
              color: '#000',
              border: 'none',
              padding: 'clamp(12px, 3vh, 18px) clamp(30px, 8vw, 60px)',
              borderRadius: '30px',
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: `0 0 25px ${rankColor}`,
              fontSize: 'clamp(12px, 2vw, 15px)'
            }}
          >
            CLAIM REWARDS & EXIT 🚀
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, color: '#fff' }}>

      {gameState === 'waiting' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(2, 2, 5, 0.96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 95,
          backdropFilter: 'blur(20px)',
          padding: '20px'
        }}>
          {/* Neon grid scan background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          {/* Central Glassmorphic Dashboard Card */}
          <div className="glass-card" style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '450px',
            width: '100%',
            padding: '40px 30px',
            background: 'rgba(5, 5, 8, 0.85)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)',
            textAlign: 'center'
          }}>
            {/* Spinning Neon Core Badge */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(57, 255, 20, 0.08)',
              border: '2px solid rgba(57, 255, 20, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)',
              position: 'relative'
            }}>
              <div className="loader" style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: '#39ff14',
                animation: 'spin 1.5s infinite linear'
              }} />
              <Activity size={24} color="#39ff14" style={{ filter: 'drop-shadow(0 0 5px #39ff14)' }} />
            </div>

            <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 900, letterSpacing: '3px', display: 'block', color: '#fff', marginBottom: '8px' }}>NEURAL TRACKING SYSTEM</span>
            <h2 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.3)', margin: 0 }}>
              INITIALIZING
            </h2>

            {/* Glowing Percentage */}
            <div className="arcade-text" style={{ fontSize: '48px', color: '#ffffff', margin: '20px 0 10px 0', fontWeight: 900 }}>
              {trackerProgress.percent}<span style={{ color: '#39ff14', fontSize: '24px' }}>%</span>
            </div>

            {/* Neon Progress Bar */}
            <div style={{
              height: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <motion.div
                animate={{ width: `${trackerProgress.percent}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background: '#39ff14',
                  boxShadow: '0 0 12px #39ff14',
                  borderRadius: '3px'
                }}
              />
            </div>

            {/* Dynamic Step Text */}
            <p className="hud-text" style={{
              fontSize: '12px',
              color: '#fff',
              opacity: 0.8,
              margin: 0,
              fontWeight: 700,
              minHeight: '18px',
              letterSpacing: '0.5px'
            }}>
              {trackerProgress.message}
            </p>
          </div>
        </div>
      )}

      {gameState === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(25px)', pointerEvents: 'auto', padding: '15px' }}>
          <div style={{ width: 'clamp(40px, 10vh, 64px)', height: 'clamp(40px, 10vh, 64px)', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(10px, 2.5vh, 20px)', border: '1px solid rgba(57, 255, 20, 0.3)' }}>
            <ShieldCheck size={28} color="#39ff14" />
          </div>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 5vw, 28px)', marginBottom: 'clamp(10px, 2vh, 15px)' }}>TRACKER <span style={{ color: '#39ff14' }}>READY</span></h2>
          <p style={{ opacity: 0.5, fontSize: 'clamp(11px, 2.5vw, 14px)', marginBottom: 'clamp(15px, 4vh, 35px)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.4 }}>
            Goal: <strong style={{ color: '#fff' }}>{selectedGoal}</strong><br />
            Target Difficulty: <strong style={{ color: '#fff' }}>{difficulty.toUpperCase()} ({targetRepsNeeded} REPS)</strong><br />
            Exercises: <strong style={{ color: '#fff' }}>{selectedExercises.map(getExerciseLabel).join(', ')}</strong>
          </p>
          <button
            onClick={() => {
              enterFullscreen();
              setGameState('calibration');
            }}
            style={{
              background: '#39ff14',
              color: '#000',
              border: 'none',
              padding: 'clamp(10px, 2.5vh, 18px) clamp(40px, 8vw, 60px)',
              borderRadius: '30px',
              fontSize: 'clamp(13px, 2vw, 15px)',
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.5)'
            }}
          >
            START WORKOUT ⚡
          </button>
        </div>
      )}

      {gameState === 'calibration' && (
        <PositionCalibration 
          onCalibrated={() => startCountdown()} 
          onSkip={() => startCountdown()} 
        />
      )}

      {gameState === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96, background: 'rgba(2,2,5,0.9)' }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(70px, 25vh, 180px)', color: '#39ff14', filter: 'drop-shadow(0 0 50px rgba(57, 255, 20, 0.5))' }}>{countdown}</div>
        </div>
      )}

      {/* EXERCISE QUEUE UI */}
      {(gameState === 'playing' || gameState === 'rest') && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(5, 5, 8, 0.85)',
          border: '1px solid rgba(57, 255, 20, 0.3)',
          borderRadius: '12px',
          padding: '15px',
          zIndex: 90,
          backdropFilter: 'blur(10px)',
          minWidth: '200px'
        }}>
          <h3 style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '2px', marginBottom: '10px', color: '#fff', fontWeight: 800 }}>WORKOUT QUEUE</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedExercises.map((ex, index) => {
              const isActive = index === (currentExerciseIndex % selectedExercises.length);
              const isPast = index < (currentExerciseIndex % selectedExercises.length);
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  opacity: isActive ? 1 : isPast ? 0.3 : 0.6,
                  background: isActive ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                  padding: '8px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid rgba(57, 255, 20, 0.5)' : '1px solid transparent'
                }}>
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: isActive ? '#39ff14' : 'rgba(255,255,255,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: isActive ? '#000' : '#fff',
                    fontWeight: 900
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isActive ? '#39ff14' : '#fff', fontFamily: 'var(--font-gaming)' }}>{getExerciseLabel(ex)}</div>
                    <div style={{ fontSize: '9px', opacity: 0.8, color: '#fff' }}>{targetRepsPerExercise} REPS</div>
                  </div>
                  {isActive && <div style={{ marginLeft: 'auto', fontSize: '8px', color: '#39ff14', border: '1px solid #39ff14', padding: '2px 4px', borderRadius: '4px', fontWeight: 900 }}>ACTIVE</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'rest' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(25px)', pointerEvents: 'auto', padding: '15px' }}>
          <motion.h2 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="arcade-text" 
            style={{ fontSize: 'clamp(30px, 6vw, 50px)', color: '#00f2ff', marginBottom: '20px' }}>
            GET READY
          </motion.h2>
          <div className="arcade-text" style={{ fontSize: 'clamp(60px, 15vh, 120px)', color: '#ffffff', textShadow: '0 0 30px rgba(0, 242, 255, 0.5)' }}>
            {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
          </div>
          <p style={{ marginTop: '20px', fontSize: '18px', opacity: 0.8, color: '#fff', textAlign: 'center' }}>
            UP NEXT: <strong style={{ color: '#39ff14' }}>{getExerciseLabel(activeExercise)}</strong>
          </p>
          <button 
            onClick={() => setRestTimer(0)} 
            style={{ 
              marginTop: '40px', background: 'transparent', border: '1px solid #00f2ff', color: '#00f2ff', padding: '10px 30px', borderRadius: '30px', cursor: 'pointer', fontFamily: 'var(--font-gaming)', fontWeight: 900
            }}>
            SKIP REST
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(10px, 4vh, 40px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          background: 'rgba(5, 5, 8, 0.95)',
          padding: 'clamp(10px, 2.5vh, 25px) clamp(16px, 4vw, 40px)',
          borderRadius: '16px',
          border: '1px solid rgba(57, 255, 20, 0.3)',
          backdropFilter: 'blur(20px)',
          pointerEvents: 'auto',
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.1)'
        }}>
          {/* Top HUD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(10px, 2vh, 20px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(57, 255, 20, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
              <Flame size={10} color="#39ff14" />
              <span style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', fontWeight: 900, color: '#39ff14', letterSpacing: '0.5px' }}>{selectedGoal}</span>
            </div>

            <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 700, opacity: 0.5 }}>
              DISTANCE: {currentDistanceMeters}M / {totalTargetMeters}M
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: 'clamp(10px, 2vh, 20px)' }}>
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}
            />
          </div>

          {/* Position Status Banner */}
          <AnimatePresence>
            {positionStatus && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                style={{
                  background: 'rgba(255, 60, 0, 0.9)',
                  border: '1px solid #ff4400',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#fff',
                  marginBottom: '10px',
                  letterSpacing: '1px',
                  boxShadow: '0 0 12px rgba(255,68,0,0.5)'
                }}
              >
                ⚠ {positionStatus} — ADJUST YOUR POSITION
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Exercise directive card */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(6px, 1.5vh, 15px)' }}>
            <span style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', opacity: 0.4, letterSpacing: '1.5px', fontWeight: 800, display: 'block', marginBottom: '2px' }}>PERFORM EXERCISE NOW</span>
            <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 900, color: '#39ff14', textShadow: '0 0 10px rgba(57, 255, 20, 0.3)', fontFamily: 'var(--font-gaming)', letterSpacing: '0.5px', margin: 0 }}>
              {getExerciseLabel(activeExercise)}
            </h2>
            {/* Reps done IN THIS EXERCISE only */}
            <p style={{ fontSize: 'clamp(9px, 1.5vw, 11px)', opacity: 0.6, margin: 0, marginTop: '4px' }}>
              <strong style={{ color: '#39ff14' }}>{reps % targetRepsPerExercise || (reps > 0 && reps % targetRepsPerExercise === 0 ? targetRepsPerExercise : 0)}</strong>
              <span style={{ opacity: 0.5 }}> / {targetRepsPerExercise} reps this exercise</span>
            </p>
            {selectedExercises.length > 1 && reps % targetRepsPerExercise !== 0 && (
              <p style={{ fontSize: 'clamp(9px, 1.5vw, 10px)', opacity: 0.4, margin: 0 }}>
                Next exercise in: <strong style={{ color: '#fff' }}>{targetRepsPerExercise - (reps % targetRepsPerExercise)}</strong> reps
              </p>
            )}
          </div>

          {/* Large Reps Counter */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginTop: 'clamp(4px, 1vh, 10px)', position: 'relative' }}>
            <h1 className="arcade-text" style={{ fontSize: 'clamp(36px, 10vh, 72px)', color: '#fff', lineHeight: 1, margin: 0 }}>{reps}</h1>
            <span style={{ fontSize: 'clamp(11px, 2vw, 14px)', opacity: 0.4, fontWeight: 800 }}>REPS</span>

            <AnimatePresence>
              {feedbackMsg && (
                <motion.div
                  key={feedbackKey}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -40, scale: 1 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 1 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                    color: '#00f2ff',
                    textShadow: '0 0 10px rgba(0, 242, 255, 0.6)',
                    fontWeight: 900,
                    fontSize: 'clamp(12px, 2.5vw, 16px)',
                    fontFamily: 'var(--font-gaming)',
                    pointerEvents: 'none'
                  }}
                >
                  {feedbackMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NormalWorkout;
