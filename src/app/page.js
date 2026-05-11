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
    <div style={{ position: "relative", minHeight: "100vh", minHeight: "100dvh", background: "#050505", color: "#fff", overflow: "hidden" }}>
      {!gameStarted ? (
        <main style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          height: "100dvh",
          textAlign: "center",
          padding: "clamp(12px, 3vw, 30px)",
          gap: "clamp(10px, 2vh, 20px)"
        }}>
          <h1 className="arcade-text" style={{
            fontSize: "clamp(28px, 6vw, 80px)",
            lineHeight: 1.1,
            marginBottom: 0
          }}>
            FIT<span style={{ color: "var(--accent)" }}>CLASH</span>
          </h1>

          <p style={{
            fontSize: "clamp(12px, 1.8vw, 18px)",
            maxWidth: "560px",
            opacity: 0.75,
            lineHeight: 1.5
          }}>
            Race to the finish line by performing exercises!<br />
            Each rep boosts your speed.
          </p>

          {/* Mode selector */}
          <div style={{ display: "flex", gap: "clamp(8px, 1.5vw, 15px)", flexWrap: "wrap", justifyContent: "center" }}>
            {['squats', 'pushups', 'jacks', 'fingers'].map(mode => (
              <button
                key={mode}
                className="glow-btn"
                onClick={() => setExerciseMode(mode)}
                style={{
                  background: exerciseMode === mode ? 'var(--accent)' : 'transparent',
                  color: exerciseMode === mode ? '#000' : 'var(--accent)',
                  border: '2px solid var(--accent)',
                  padding: "clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 30px)",
                  fontSize: "clamp(12px, 1.5vw, 16px)",
                }}
              >
                {mode === 'jacks' ? 'JUMPING JACKS' : mode === 'fingers' ? '☝️ FINGER' : mode.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className="glow-btn"
            style={{
              padding: "clamp(12px, 2vh, 20px) clamp(30px, 5vw, 60px)",
              fontSize: "clamp(16px, 3vw, 24px)"
            }}
            onClick={() => setGameStarted(true)}
          >
            START RACE 🏃
          </button>

          <p style={{ fontSize: "clamp(10px, 1.2vw, 13px)", opacity: 0.4 }}>
            📱 Rotate to landscape for best experience
          </p>
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

