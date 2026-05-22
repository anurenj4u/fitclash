"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Award, Zap, Flame, Clock, ShieldCheck, ChevronRight, X, Heart, Activity } from 'lucide-react';

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

const WorkoutProgramExecutor = ({ program, isCameraReady, onComplete, onExit, userData }) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState('waiting'); // waiting, countdown, work, rest, complete
  const [countdown, setCountdown] = useState(3);
  const [roundTimer, setRoundTimer] = useState(program.workDuration);
  const [restTimer, setRestTimer] = useState(program.restDuration);
  const [reps, setReps] = useState(0);
  const [roundReps, setRoundReps] = useState([]);
  const [accuracy, setAccuracy] = useState(94); // Mock high-fidelity pose accuracy

  const previousRepsRef = useRef(0);
  const totalRepsAcrossRounds = roundReps.reduce((a, b) => a + b, 0) + reps;
  const [trackerProgress, setTrackerProgress] = useState({ percent: 0, message: 'Launching Neural Core...' });

  useEffect(() => {
    const handleProgress = (e) => {
      const { percent, message } = e.detail;
      setTrackerProgress({ percent, message });
    };
    window.addEventListener('tracker-init-status', handleProgress);
    return () => window.removeEventListener('tracker-init-status', handleProgress);
  }, []);

  // Hydration Tips during Rest Period
  const fitnessTips = [
    "🔥 Keep moving! Step side to side to keep your heart rate in the fat-burn zone.",
    "💧 Take small sips of water. Stay hydrated but avoid drinking too fast.",
    "🫁 Focus on deep nasal breathing to optimize oxygen intake.",
    "💪 Stretch your legs slightly. Release any built-up lactic acid.",
    "🏆 Great effort! You are building elite cardio endurance."
  ];

  const currentTip = fitnessTips[currentRound % fitnessTips.length];

  // Camera Ready listener
  useEffect(() => {
    if (isCameraReady && phase === 'waiting') {
      setPhase('ready');
    }
  }, [isCameraReady, phase]);

  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  // Motion Detection pose-update listener
  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (phase !== 'work') return;
      const { reps: eventReps } = e.detail;
      if (eventReps > previousRepsRef.current) {
        previousRepsRef.current = eventReps;
        setReps((prev) => prev + 1);
        setAccuracy(Math.floor(92 + Math.random() * 7));
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [phase]);

  // Work Round Timer Loop
  useEffect(() => {
    let interval;
    if (phase === 'work') {
      interval = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleRoundComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Rest Timer Loop
  useEffect(() => {
    let interval;
    if (phase === 'rest') {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            startNextRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const handleRoundComplete = () => {
    const updatedRounds = [...roundReps, reps];
    setRoundReps(updatedRounds);

    if (currentRound < program.rounds) {
      setPhase('rest');
      setRestTimer(program.restDuration);
      previousRepsRef.current = 0;
      setReps(0);
    } else {
      handleProgramFinished(updatedRounds);
    }
  };

  const startNextRound = () => {
    setCurrentRound((prev) => prev + 1);
    setPhase('work');
    setRoundTimer(program.workDuration);
  };

  const handleProgramFinished = (finalRounds) => {
    setPhase('complete');
    const totalReps = finalRounds.reduce((a, b) => a + b, 0);
    const weight = userData?.weight || 70;
    const caloriesBurned = Math.round((totalReps * 0.45 + (program.rounds * program.workDuration * 0.05)) * (weight / 70));
    const xpGained = Math.round(totalReps * 5 + (program.rounds * program.workDuration * 0.2) * (accuracy / 100));

    if (onComplete) {
      onComplete({
        totalReps,
        caloriesBurned,
        xpGained,
        programName: program.name
      });
    }
  };

  const handleStartCountdown = () => {
    enterFullscreen();
    setPhase('countdown');
    let timer = 3;
    setCountdown(timer);
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        setPhase('work');
        setRoundTimer(program.workDuration);
      }
    }, 1000);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      background: 'rgba(5, 5, 8, 0.98)',
      backdropFilter: 'blur(20px)',
      color: '#ffffff',
      padding: 'clamp(10px, 3vh, 20px)'
    }}>
      {/* Top Bar (Exit) */}
      {phase !== 'complete' && (
        <div style={{ position: 'absolute', top: 'clamp(10px, 4vh, 30px)', right: 'clamp(10px, 4vw, 30px)', zIndex: 1010, pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              exitFullscreen();
              onExit();
            }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: 'clamp(32px, 8vh, 45px)',
              height: 'clamp(32px, 8vh, 45px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* Phase: Waiting for Pose Calibration */}
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: '450px',
              width: '100%',
              padding: '40px 30px',
              background: 'rgba(5, 5, 8, 0.85)',
              border: '1px solid rgba(57, 255, 20, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)',
              textAlign: 'center',
              pointerEvents: 'auto'
            }}
          >
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
          </motion.div>
        )}

        {/* Phase: Calibrated & Ready */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center',
              padding: 'clamp(15px, 3.5vh, 40px) clamp(20px, 5vw, 40px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: '16px',
              pointerEvents: 'auto'
            }}
          >
            <div style={{ width: 'clamp(40px, 8vh, 64px)', height: 'clamp(40px, 8vh, 64px)', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(8px, 2vh, 20px) auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: 700, color: '#ffffff', opacity: 0.5, letterSpacing: '3px' }}>PROGRAM READY</span>
            <h2 className="arcade-text" style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', margin: '8px 0 clamp(10px, 2.5vh, 15px) 0', textShadow: 'none' }}>{program.name}</h2>

            {/* Round info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(6px, 1.5vw, 15px)', background: 'rgba(255,255,255,0.02)', padding: 'clamp(8px, 2vh, 15px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 'clamp(12px, 3vh, 30px)' }}>
              <div>
                <p style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', opacity: 0.4, marginBottom: '4px' }}>ROUNDS</p>
                <p style={{ fontWeight: 700, fontSize: 'clamp(13px, 2.5vw, 16px)', color: '#ffffff' }}>{program.rounds}</p>
              </div>
              <div>
                <p style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', opacity: 0.4, marginBottom: '4px' }}>WORK TIMER</p>
                <p style={{ fontWeight: 700, fontSize: 'clamp(13px, 2.5vw, 16px)', color: '#ffffff' }}>{program.workDuration}s</p>
              </div>
              <div>
                <p style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', opacity: 0.4, marginBottom: '4px' }}>REST PERIOD</p>
                <p style={{ fontWeight: 700, fontSize: 'clamp(13px, 2.5vw, 16px)', color: '#ffffff' }}>{program.restDuration}s</p>
              </div>
            </div>

            <button
              onClick={handleStartCountdown}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vh, 16px) 0',
                fontSize: 'clamp(12px, 2vw, 14px)',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '30px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)'
              }}
            >
              START WORKOUT PLAN ⚡
            </button>
          </motion.div>
        )}

        {/* Phase: Start Countdown */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="arcade-text" style={{ fontSize: 'clamp(70px, 25vh, 160px)', color: '#ffffff', textShadow: 'none' }}>{countdown}</div>
          </motion.div>
        )}

        {/* Phase: Work Round Action Screen */}
        {phase === 'work' && (
          <motion.div
            key="work"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '650px', pointerEvents: 'auto' }}
          >
            {/* Top HUD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(10px, 2.5vh, 25px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className="arcade-text" style={{ fontSize: 'clamp(9px, 2vw, 12px)', color: '#ffffff', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textShadow: 'none' }}>
                  ROUND {currentRound} / {program.rounds}
                </span>
                <span style={{ fontSize: 'clamp(10px, 2vw, 12px)', opacity: 0.5, fontWeight: 600 }}>
                  {program.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={11} color="#ffffff" style={{ opacity: 0.8 }} />
                <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: 700, color: '#ffffff' }}>ACCURACY: {accuracy}%</span>
              </div>
            </div>

            {/* Reps Tracker Center */}
            <div style={{ padding: 'clamp(15px, 4vh, 40px) clamp(16px, 4vw, 30px)', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 'clamp(6px, 1.5vh, 18px)', left: '50%', transform: 'translateX(-50%)', opacity: 0.4, fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: 700, letterSpacing: '2px', width: '100%', textAlign: 'center' }}>
                ROUND REPETITIONS
              </div>
              <h1 className="arcade-text" style={{ fontSize: 'clamp(44px, 16vh, 100px)', color: '#ffffff', lineHeight: '1', textShadow: 'none', margin: 'clamp(10px, 2vh, 16px) 0 0 0' }}>{reps}</h1>
              <p style={{ opacity: 0.4, fontSize: 'clamp(10px, 1.8vw, 12px)', letterSpacing: '3px', marginTop: 'clamp(4px, 1vh, 10px)', fontWeight: 700, margin: 0 }}>REPS</p>

              {currentRound > 1 && (
                <div style={{ marginTop: 'clamp(8px, 2vh, 20px)', fontSize: 'clamp(9px, 1.5vw, 11px)', opacity: 0.6, fontWeight: 700, letterSpacing: '0.5px' }}>
                  TOTAL ACCUMULATED REPS: {totalRepsAcrossRounds}
                </div>
              )}
            </div>

            {/* Work Timer Progress Bar */}
            <div style={{ marginTop: 'clamp(10px, 2.5vh, 30px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(4px, 1vh, 10px)' }}>
                <span style={{ fontSize: 'clamp(9px, 1.8vw, 11px)', fontWeight: 700, opacity: 0.5 }}>ROUND TIMER</span>
                <span className="arcade-text" style={{ fontSize: 'clamp(14px, 3vw, 20px)', color: '#ffffff', textShadow: 'none' }}>{roundTimer}s</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(roundTimer / program.workDuration) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  style={{
                    height: '100%',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase: Rest Countdown Interval */}
        {phase === 'rest' && (
          <motion.div
            key="rest"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: 'clamp(15px, 3.5vh, 40px) clamp(20px, 5vw, 40px)', border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', pointerEvents: 'auto' }}
          >
            <div style={{ width: 'clamp(36px, 8vh, 60px)', height: 'clamp(36px, 8vh, 60px)', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(8px, 2vh, 16px) auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Heart size={20} color="#ffffff" style={{ opacity: 0.8 }} />
            </div>

            <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: 700, opacity: 0.5, letterSpacing: '3px' }}>REST INTERMISSION</span>
            <h2 className="arcade-text" style={{ fontSize: 'clamp(16px, 4vw, 22px)', margin: '8px 0 clamp(8px, 2vh, 15px) 0', textShadow: 'none' }}>PREPARE FOR ROUND {currentRound + 1}</h2>

            {/* Circle Timer */}
            <div style={{ position: 'relative', width: 'clamp(70px, 18vh, 110px)', height: 'clamp(70px, 18vh, 110px)', margin: 'clamp(10px, 2.5vh, 25px) auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="55" cy="55" r="48" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r="48"
                  stroke="#ffffff"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - restTimer / program.restDuration)}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', fontSize: 'clamp(18px, 4.5vh, 28px)', fontWeight: 800, fontFamily: 'var(--font-gaming)', color: '#ffffff' }}>
                {restTimer}s
              </div>
            </div>

            {/* Performance info row */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(8px, 2vh, 12px) clamp(12px, 3vw, 20px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 'clamp(10px, 2.5vh, 20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ opacity: 0.5, fontSize: 'clamp(11px, 2vw, 13px)', fontWeight: 600 }}>ROUND {currentRound} REPS:</span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(13px, 2.5vw, 16px)', color: '#ffffff' }}>{roundReps[roundReps.length - 1] || 0}</span>
            </div>

            {/* Hydration / Fitness tips */}
            <p style={{ opacity: 0.7, fontSize: 'clamp(11px, 2vw, 13px)', lineHeight: 1.4, background: 'rgba(255,255,255,0.03)', padding: 'clamp(10px, 2vh, 15px) clamp(12px, 2.5vw, 18px)', borderRadius: '10px', borderLeft: '3px solid #ffffff', textAlign: 'left', margin: 0 }}>
              {currentTip}
            </p>
          </motion.div>
        )}

        {/* Phase: Complete Workout Summary */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '550px', width: '100%', padding: 'clamp(15px, 3.5vh, 40px) clamp(20px, 5vw, 40px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(5, 5, 8, 0.98)', borderRadius: '16px', textAlign: 'center', pointerEvents: 'auto' }}
          >
            <div style={{ width: 'clamp(40px, 8vh, 64px)', height: 'clamp(40px, 8vh, 64px)', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(8px, 2vh, 16px) auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Award size={24} color="#ffffff" />
            </div>

            <h2 className="arcade-text" style={{ fontSize: 'clamp(18px, 4.5vw, 26px)', color: '#ffffff', marginBottom: '4px', textShadow: 'none' }}>PLAN COMPLETE!</h2>
            <p style={{ opacity: 0.4, fontSize: 'clamp(8px, 1.5vw, 11px)', letterSpacing: '2px', marginBottom: 'clamp(12px, 3vh, 30px)', fontWeight: 700, margin: 0 }}>{program.name.toUpperCase()}</p>

            {/* Summary statistics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(6px, 1.5vw, 12px)', marginBottom: 'clamp(12px, 3vh, 30px)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(10px, 2vh, 16px) clamp(6px, 1vw, 12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Flame size={14} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>CALORIES</p>
                <p className="arcade-text" style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: '#ffffff', textShadow: 'none', margin: 0 }}>
                  {Math.round((totalRepsAcrossRounds * 0.45 + (program.rounds * program.workDuration * 0.05)) * ((userData?.weight || 70) / 70))}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(10px, 2vh, 16px) clamp(6px, 1vw, 12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Zap size={14} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>TOTAL REPS</p>
                <p className="arcade-text" style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: '#ffffff', textShadow: 'none', margin: 0 }}>{totalRepsAcrossRounds}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(10px, 2vh, 16px) clamp(6px, 1vw, 12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock size={14} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>TOTAL XP</p>
                <p className="arcade-text" style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: '#ffffff', textShadow: 'none', margin: 0 }}>
                  {Math.round(totalRepsAcrossRounds * 5 + (program.rounds * program.workDuration * 0.2) * (accuracy / 100))}
                </p>
              </div>
            </div>

            {/* Rounds breakdowns list */}
            <div style={{ textAlign: 'left', marginBottom: 'clamp(12px, 3vh, 35px)', background: 'rgba(255,255,255,0.01)', padding: 'clamp(10px, 2.5vh, 20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: 700, opacity: 0.4, letterSpacing: '1px', marginBottom: 'clamp(6px, 1.5vh, 12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: 0 }}>ROUND BREAKDOWNS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {roundReps.map((rRep, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5, fontSize: 'clamp(11px, 2vw, 13px)', fontWeight: 600 }}>Round {idx + 1} Performance:</span>
                    <span style={{ fontWeight: 700, fontSize: 'clamp(11px, 2vw, 13px)', color: '#ffffff' }}>{rRep} reps</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                exitFullscreen();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vh, 16px) 0',
                fontSize: 'clamp(12px, 2vw, 14px)',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '30px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)'
              }}
            >
              COMPLETE & CLAIM REWARDS 🚀
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WorkoutProgramExecutor;
