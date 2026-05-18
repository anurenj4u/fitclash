"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const NormalWorkout = ({ mode, isCameraReady }) => {
  const [reps, setReps] = useState(0);
  const [highestReps, setHighestReps] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, countdown, playing
  const [countdown, setCountdown] = useState(3);
  const { user } = useAuth();
  
  const previousRepsRef = useRef(0);

  useEffect(() => {
    const fetchHighest = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "userStats", `${user.uid}_${mode}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHighestReps(docSnap.data().highestReps || 0);
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchHighest();
  }, [user, mode]);

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
        setReps((prev) => prev + 1);
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [gameState]);

  const handleEndWorkout = async () => {
    if (user && reps > highestReps) {
      try {
        const docRef = doc(db, "userStats", `${user.uid}_${mode}`);
        await setDoc(docRef, { highestReps: reps }, { merge: true });
        setHighestReps(reps);
      } catch (e) {
        console.error("Error saving highest reps:", e);
      }
    }
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <h2 className="arcade-text" style={{ fontSize: '60px', color: 'var(--accent)', marginBottom: '20px' }}>WORKOUT COMPLETE</h2>
          <div className="glass-card" style={{ marginBottom: '40px', padding: '30px 60px' }}>
            <p className="hud-text" style={{ fontSize: '20px' }}>TOTAL REPS: {reps}</p>
            {reps > highestReps && highestReps > 0 && <p style={{ color: 'var(--secondary)', marginTop: '10px' }}>NEW PERSONAL BEST!</p>}
          </div>
          <button className="glow-btn" onClick={() => window.location.reload()} style={{ padding: '20px 60px' }}>DONE</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, pointerEvents: 'none' }}>
      
      {gameState === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
          <h2 className="arcade-text" style={{ fontSize: '40px', marginBottom: '30px' }}>TRACKER <span style={{ color: 'var(--accent)' }}>READY</span></h2>
          <button className="glow-btn pulse-glow" onClick={() => { 
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
          }} style={{ padding: '25px 60px', fontSize: '24px' }}>START WORKOUT ⚡</button>
        </div>
      )}

      {gameState === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: '180px', color: 'var(--accent)', filter: 'drop-shadow(0 0 50px var(--accent))' }}>{countdown}</div>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '40px 80px', borderRadius: '30px', border: '2px solid var(--accent)', backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
          <h2 className="hud-text" style={{ fontSize: '24px', opacity: 0.8, marginBottom: '20px' }}>{mode.toUpperCase()} WORKOUT</h2>
          <div className="arcade-text" style={{ fontSize: '120px', color: 'var(--accent)', lineHeight: '1' }}>{reps}</div>
          <div style={{ fontSize: '16px', opacity: 0.5, marginTop: '10px' }}>REPS</div>
          
          {highestReps > 0 && (
            <div style={{ marginTop: '20px', color: 'var(--secondary)', fontSize: '14px', fontWeight: 'bold' }}>
              PERSONAL BEST: {highestReps}
            </div>
          )}
          
          <button 
            className="glow-btn" 
            onClick={handleEndWorkout} 
            style={{ marginTop: '40px', padding: '15px 40px', fontSize: '18px', pointerEvents: 'auto' }}
          >
            END WORKOUT
          </button>
        </div>
      )}
    </div>
  );
};

export default NormalWorkout;
