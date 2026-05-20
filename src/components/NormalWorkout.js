"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Flame, Zap, Award, Activity, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

const NormalWorkout = ({ 
  selectedExercises = ['squats'], 
  targetDistance = 1, 
  selectedGoal = 'FAT BURN',
  isCameraReady, 
  onComplete 
}) => {
  const [reps, setReps] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, countdown, playing
  const [countdown, setCountdown] = useState(3);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const { user } = useAuth();
  
  const previousRepsRef = useRef(0);
  const targetRepsNeeded = Math.round((targetDistance * 1000) / 10); // 1 rep = 10 meters

  const activeExercise = selectedExercises[currentExerciseIndex % selectedExercises.length] || 'squats';

  useEffect(() => {
    if (isCameraReady && gameState === 'waiting') {
      setGameState('ready');
    }
  }, [isCameraReady, gameState]);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (gameState !== 'playing') return;
      const { reps: eventReps } = e.detail;
      if (eventReps > previousRepsRef.current) {
        previousRepsRef.current = eventReps;
        setReps((prev) => {
          const nextReps = prev + 1;
          
          // Cycle exercise modes every 10 reps if multiple exercises are selected
          if (selectedExercises.length > 1 && nextReps % 10 === 0) {
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
  }, [gameState, selectedExercises, targetRepsNeeded]);

  const handleEndWorkout = () => {
    setIsFinished(true);
    confetti({ particleCount: 150, spread: 75, origin: { y: 0.6 }, colors: ['#39ff14', '#ffffff', '#00f2ff'] });
  };

  const getExerciseLabel = (ex) => {
    if (ex === 'jacks') return 'JUMPING JACKS';
    if (ex === 'fingers') return 'FINGER SPRINT';
    return ex.toUpperCase();
  };

  const currentDistanceMeters = reps * 10;
  const totalTargetMeters = targetDistance * 1000;
  const progressPercent = Math.min((currentDistanceMeters / totalTargetMeters) * 100, 100);

  if (isFinished) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 8, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto', color: '#fff' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '500px', width: '90%' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(57, 255, 20, 0.3)' }}>
            <Award size={36} color="#39ff14" />
          </div>
          <h2 className="arcade-text" style={{ fontSize: '32px', color: '#39ff14', marginBottom: '10px', textShadow: '0 0 15px rgba(57, 255, 20, 0.4)' }}>GOAL ACCOMPLISHED!</h2>
          <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '25px' }}>You successfully traveled your customized {targetDistance} KM distance target!</p>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '25px', marginBottom: '35px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div>
                <p style={{ opacity: 0.4, fontSize: '9px', marginBottom: '4px', fontWeight: 700 }}>TOTAL REPS</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#fff' }}>{reps}</p>
              </div>
              <div>
                <p style={{ opacity: 0.4, fontSize: '9px', marginBottom: '4px', fontWeight: 700 }}>DISTANCE</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#39ff14' }}>{targetDistance} KM</p>
              </div>
              <div>
                <p style={{ opacity: 0.4, fontSize: '9px', marginBottom: '4px', fontWeight: 700 }}>CALORIES</p>
                <p className="arcade-text" style={{ fontSize: '18px', color: '#ff4444' }}>{Math.round(reps * 0.45 + 10)}</p>
              </div>
            </div>
          </div>

          <button 
            className="glow-btn" 
            onClick={() => {
              if (onComplete) {
                onComplete(reps);
              } else {
                window.location.reload();
              }
            }} 
            style={{ 
              background: '#39ff14', 
              color: '#000', 
              border: 'none', 
              padding: '16px 60px', 
              borderRadius: '30px', 
              fontWeight: 900, 
              cursor: 'pointer', 
              fontFamily: 'var(--font-gaming)',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)'
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
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(25px)' }}>
          <div className="loader" style={{ margin: '0 auto 20px auto', width: '50px', height: '50px', borderRadius: '50%', border: '3px solid rgba(57, 255, 20, 0.1)', borderTopColor: '#39ff14', animation: 'spin 1s infinite linear' }}></div>
          <h2 className="arcade-text" style={{ fontSize: '24px', color: '#39ff14' }}>INITIALIZING TRACKER</h2>
          <p style={{ marginTop: '10px', opacity: 0.5, fontSize: '13px' }}>Preparing camera pose detector...</p>
        </div>
      )}

      {gameState === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(25px)', pointerEvents: 'auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(57, 255, 20, 0.3)' }}>
            <ShieldCheck size={32} color="#39ff14" />
          </div>
          <h2 className="arcade-text" style={{ fontSize: '28px', marginBottom: '15px' }}>TRACKER <span style={{ color: '#39ff14' }}>READY</span></h2>
          <p style={{ opacity: 0.5, fontSize: '14px', marginBottom: '35px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
            Goal: <strong style={{ color: '#fff' }}>{selectedGoal}</strong><br/>
            Target Distance: <strong style={{ color: '#fff' }}>{targetDistance} KM ({totalTargetMeters}M)</strong><br/>
            Exercises: <strong style={{ color: '#fff' }}>{selectedExercises.map(getExerciseLabel).join(', ')}</strong>
          </p>
          <button 
            onClick={() => { 
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
            }} 
            style={{ 
              background: '#39ff14', 
              color: '#000', 
              border: 'none', 
              padding: '18px 60px', 
              borderRadius: '30px', 
              fontSize: '15px', 
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

      {gameState === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96, background: 'rgba(2,2,5,0.9)' }}>
          <div className="arcade-text" style={{ fontSize: '180px', color: '#39ff14', filter: 'drop-shadow(0 0 50px rgba(57, 255, 20, 0.5))' }}>{countdown}</div>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{ 
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '650px',
          background: 'rgba(5, 5, 8, 0.95)', 
          padding: '30px 40px', 
          borderRadius: '24px', 
          border: '1px solid rgba(57, 255, 20, 0.3)', 
          backdropFilter: 'blur(20px)', 
          pointerEvents: 'auto',
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.1)'
        }}>
          {/* Top HUD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(57, 255, 20, 0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
              <Flame size={12} color="#39ff14" />
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#39ff14', letterSpacing: '0.5px' }}>{selectedGoal}</span>
            </div>
            
            <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5 }}>
              DISTANCE: {currentDistanceMeters}M / {totalTargetMeters}M
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '25px' }}>
            <motion.div 
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}
            />
          </div>

          {/* Active Exercise directive card */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '2px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>PERFORM EXERCISE NOW</span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#39ff14', textShadow: '0 0 10px rgba(57, 255, 20, 0.3)', fontFamily: 'var(--font-gaming)', letterSpacing: '0.5px' }}>
              {getExerciseLabel(activeExercise)}
            </h2>
            {selectedExercises.length > 1 && (
              <span style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginTop: '4px', fontWeight: 700 }}>
                Next exercise in: <strong style={{ color: '#fff' }}>{10 - (reps % 10)}</strong> reps
              </span>
            )}
          </div>

          {/* Large Reps Counter */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
            <h1 className="arcade-text" style={{ fontSize: '80px', color: '#fff', lineHeight: 1 }}>{reps}</h1>
            <span style={{ fontSize: '16px', opacity: 0.4, fontWeight: 800 }}>REPS</span>
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
