"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Award, Zap, Flame, Clock, ShieldCheck, ChevronRight, X, Heart } from 'lucide-react';

const WorkoutProgramExecutor = ({ program, isCameraReady, onComplete, onExit }) => {
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
    const caloriesBurned = Math.round(totalReps * 0.45 + (program.rounds * program.workDuration * 0.05));
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
      padding: '20px'
    }}>
      {/* Top Bar (Exit) */}
      {phase !== 'complete' && (
        <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 1010, pointerEvents: 'auto' }}>
          <button 
            onClick={onExit}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
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
            <X size={20} />
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
            style={{ textAlign: 'center' }}
          >
            <div className="loader" style={{ margin: '0 auto 20px auto', width: '50px', height: '50px', borderRadius: '50%', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: '#ffffff', animation: 'spin 1s infinite linear' }}></div>
            <h2 className="arcade-text" style={{ fontSize: '24px', color: '#ffffff', textShadow: 'none' }}>INITIALIZING AI ENGINE</h2>
            <p style={{ marginTop: '10px', opacity: 0.5, fontSize: '13px' }}>Waiting for camera pose calibration...</p>
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
              padding: '50px 40px', 
              border: '1px solid rgba(255, 255, 255, 0.12)', 
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: '16px',
              pointerEvents: 'auto' 
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <ShieldCheck size={32} color="#ffffff" />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', opacity: 0.5, letterSpacing: '3px' }}>PROGRAM READY</span>
            <h2 className="arcade-text" style={{ fontSize: '24px', margin: '8px 0 15px 0', textShadow: 'none' }}>{program.name}</h2>
            
            {/* Round info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '30px' }}>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px' }}>ROUNDS</p>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{program.rounds}</p>
              </div>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px' }}>WORK TIMER</p>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{program.workDuration}s</p>
              </div>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px' }}>REST PERIOD</p>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{program.restDuration}s</p>
              </div>
            </div>

            <button 
              onClick={handleStartCountdown} 
              style={{ 
                width: '100%', 
                padding: '16px 0', 
                fontSize: '14px',
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
            <div className="arcade-text" style={{ fontSize: '160px', color: '#ffffff', textShadow: 'none' }}>{countdown}</div>
          </motion.div>
        )}

        {/* Phase: Work Round Action Screen */}
        {phase === 'work' && (
          <motion.div 
            key="work"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '700px', pointerEvents: 'auto' }}
          >
            {/* Top HUD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className="arcade-text" style={{ fontSize: '12px', color: '#ffffff', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textShadow: 'none' }}>
                  ROUND {currentRound} / {program.rounds}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: 600 }}>
                  {program.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={13} color="#ffffff" style={{ opacity: 0.8 }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>ACCURACY: {accuracy}%</span>
              </div>
            </div>

            {/* Reps Tracker Center */}
            <div style={{ padding: '50px 30px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '25px', left: '50%', transform: 'translateX(-50%)', opacity: 0.4, fontSize: '10px', fontWeight: 700, letterSpacing: '2px' }}>
                ROUND REPETITIONS
              </div>
              <h1 className="arcade-text" style={{ fontSize: '130px', color: '#ffffff', lineHeight: '1', textShadow: 'none' }}>{reps}</h1>
              <p style={{ opacity: 0.4, fontSize: '12px', letterSpacing: '3px', marginTop: '10px', fontWeight: 700 }}>REPS</p>
              
              {currentRound > 1 && (
                <div style={{ marginTop: '20px', fontSize: '11px', opacity: 0.6, fontWeight: 700, letterSpacing: '0.5px' }}>
                  TOTAL ACCUMULATED REPS: {totalRepsAcrossRounds}
                </div>
              )}
            </div>

            {/* Work Timer Progress Bar */}
            <div style={{ marginTop: '35px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.5 }}>ROUND TIMER</span>
                <span className="arcade-text" style={{ fontSize: '20px', color: '#ffffff', textShadow: 'none' }}>{roundTimer}s</span>
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
            style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '50px 40px', border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', pointerEvents: 'auto' }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Heart size={28} color="#ffffff" style={{ opacity: 0.8 }} />
            </div>
            
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, letterSpacing: '3px' }}>REST INTERMISSION</span>
            <h2 className="arcade-text" style={{ fontSize: '22px', margin: '8px 0 15px 0', textShadow: 'none' }}>PREPARE FOR ROUND {currentRound + 1}</h2>

            {/* Circle Timer */}
            <div style={{ position: 'relative', width: '110px', height: '110px', margin: '25px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
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
              <div style={{ position: 'absolute', fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-gaming)', color: '#ffffff' }}>
                {restTimer}s
              </div>
            </div>

            {/* Performance info row */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ opacity: 0.5, fontSize: '13px', fontWeight: 600 }}>ROUND {currentRound} REPS:</span>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>{roundReps[roundReps.length - 1] || 0}</span>
            </div>

            {/* Hydration / Fitness tips */}
            <p style={{ opacity: 0.7, fontSize: '13px', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '15px 18px', borderRadius: '10px', borderLeft: '3px solid #ffffff', textAlign: 'left' }}>
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
            style={{ maxWidth: '600px', width: '100%', padding: '50px 40px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(5, 5, 8, 0.98)', borderRadius: '16px', textAlign: 'center', pointerEvents: 'auto' }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Award size={32} color="#ffffff" />
            </div>

            <h2 className="arcade-text" style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px', textShadow: 'none' }}>PLAN COMPLETE!</h2>
            <p style={{ opacity: 0.4, fontSize: '11px', letterSpacing: '2px', marginBottom: '30px', fontWeight: 700 }}>{program.name.toUpperCase()}</p>

            {/* Summary statistics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Flame size={18} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>CALORIES</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#ffffff', textShadow: 'none' }}>
                  {Math.round(totalRepsAcrossRounds * 0.45 + (program.rounds * program.workDuration * 0.05))}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Zap size={18} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>TOTAL REPS</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#ffffff', textShadow: 'none' }}>{totalRepsAcrossRounds}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock size={18} color="#ffffff" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                <p style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px', fontWeight: 600 }}>TOTAL XP</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#ffffff', textShadow: 'none' }}>
                  {Math.round(totalRepsAcrossRounds * 5 + (program.rounds * program.workDuration * 0.2) * (accuracy / 100))}
                </p>
              </div>
            </div>

            {/* Rounds breakdowns list */}
            <div style={{ textAlign: 'left', marginBottom: '35px', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, opacity: 0.4, letterSpacing: '1px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>ROUND BREAKDOWNS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roundReps.map((rRep, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5, fontSize: '13px', fontWeight: 600 }}>Round {idx + 1} Performance:</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>{rRep} reps</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                width: '100%', 
                padding: '16px 0', 
                fontSize: '14px',
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
