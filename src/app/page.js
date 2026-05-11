"use client";
import React, { useState, useCallback } from "react";
import FitnessRace from "@/components/FitnessRace";
import MotionTracker from "@/components/MotionTracker";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [exerciseMode, setExerciseMode] = useState('squats');
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#050505", color: "#fff", overflow: "hidden" }}>
      {!gameStarted ? (
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", textAlign: "center", padding: "20px" }}>
          <h1 className="arcade-text" style={{ fontSize: "clamp(40px, 8vw, 80px)", marginBottom: "20px" }}>
            FITNESS<br/><span style={{ color: "var(--accent)" }}>RACE PRO</span>
          </h1>
          <p style={{ fontSize: "18px", maxWidth: "600px", opacity: 0.8, marginBottom: "30px" }}>
            RACE TO THE FINISH LINE BY PERFORMING EXERCISES!<br/>
            Each rep boosts your speed.
          </p>

          <div style={{ display: "flex", gap: "15px", marginBottom: "40px", flexWrap: "wrap", justifyContent: "center" }}>
            <button 
              className="glow-btn" 
              onClick={() => setExerciseMode('squats')} 
              style={{ 
                background: exerciseMode === 'squats' ? 'var(--accent)' : 'transparent', 
                color: exerciseMode === 'squats' ? '#000' : 'var(--accent)',
                padding: "10px 30px"
              }}
            >SQUATS</button>
            <button 
              className="glow-btn" 
              onClick={() => setExerciseMode('pushups')} 
              style={{ 
                background: exerciseMode === 'pushups' ? 'var(--accent)' : 'transparent', 
                color: exerciseMode === 'pushups' ? '#000' : 'var(--accent)',
                padding: "10px 30px"
              }}
            >PUSHUPS</button>
            <button 
              className="glow-btn" 
              onClick={() => setExerciseMode('jacks')} 
              style={{ 
                background: exerciseMode === 'jacks' ? 'var(--accent)' : 'transparent', 
                color: exerciseMode === 'jacks' ? '#000' : 'var(--accent)',
                padding: "10px 30px"
              }}
            >JACKS</button>
          </div>

          <button className="glow-btn" style={{ padding: "20px 60px", fontSize: "24px" }} onClick={() => setGameStarted(true)}>START RACE</button>
        </main>
      ) : (
        <>
          <FitnessRace mode={exerciseMode} isCameraReady={isCameraReady} />
          <MotionTracker mode={exerciseMode} onReady={handleCameraReady} />
        </>
      )}
    </div>
  );
}
