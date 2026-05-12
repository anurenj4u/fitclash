"use client";
import React, { useState, useCallback } from "react";
import FitnessRace from "@/components/FitnessRace";
import MotionTracker from "@/components/MotionTracker";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [exerciseMode, setExerciseMode] = useState('squats');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [targetDistance, setTargetDistance] = useState(1); // in kilometers
  
  const { user } = useAuth();
  const router = useRouter();

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const startOnboarding = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowOnboarding(true);
  };
  const finishOnboarding = () => {
    setShowOnboarding(false);
    setGameStarted(true);
  };

  if (gameStarted) {
    return (
      <div style={{ 
        position: "fixed", 
        inset: 0,
        height: "100vh", 
        background: "#050505", 
        color: "#fff", 
        overflow: "hidden",
        zIndex: 2000 
      }}>
        <FitnessRace mode={exerciseMode} targetKm={targetDistance} isCameraReady={isCameraReady} />
        <MotionTracker mode={exerciseMode} onReady={handleCameraReady} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#050505", color: "#fff" }}>
      {/* Hero Section */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "90vh",
        textAlign: "center",
        padding: "80px 20px",
        background: "radial-gradient(circle at 50% 50%, rgba(57, 255, 20, 0.05) 0%, transparent 70%)"
      }}>
        <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
          <h1 className="arcade-text" style={{
            fontSize: "clamp(40px, 10vw, 120px)",
            lineHeight: 1,
            marginBottom: "20px"
          }}>
            FIT<span style={{ color: "var(--accent)" }}>CLASH</span>
          </h1>
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 24px)",
            opacity: 0.8,
            marginBottom: "40px",
            maxWidth: "700px",
            margin: "0 auto 40px"
          }}>
            The AI-powered fitness game where <span style={{ color: 'var(--accent)', fontWeight: 800 }}>YOU</span> are the controller. 
          </p>

          {/* Integrated Mode Selector */}
          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontSize: '14px', letterSpacing: '2px', color: 'var(--accent)', marginBottom: '15px', fontWeight: 800 }}>CHOOSE YOUR CHALLENGE:</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: '25px' }}>
              {['squats', 'pushups', 'jacks', 'fingers'].map(mode => (
                <button
                  key={mode}
                  className="mode-select-btn"
                  onClick={() => setExerciseMode(mode)}
                  style={{
                    background: exerciseMode === mode ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: exerciseMode === mode ? '#000' : '#fff',
                    border: exerciseMode === mode ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)',
                    padding: "12px 24px",
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {exerciseMode === mode && <span>✓</span>}
                  {mode === 'jacks' ? 'JUMPING JACKS' : mode === 'fingers' ? '☝️ FINGER' : mode.toUpperCase()}
                </button>
              ))}
            </div>
            
            {/* Distance Selector */}
            <p style={{ fontSize: '14px', letterSpacing: '2px', color: 'var(--accent)', marginBottom: '15px', fontWeight: 800 }}>RACE DISTANCE:</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: '20px' }}>
              {[1, 2, 3].map(km => (
                <button
                  key={km}
                  onClick={() => setTargetDistance(km)}
                  style={{
                    background: targetDistance === km ? 'var(--accent)' : 'transparent',
                    color: targetDistance === km ? '#000' : 'var(--accent)',
                    border: '2px solid var(--accent)',
                    padding: "8px 20px",
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {km} KM
                </button>
              ))}
            </div>
            
            <style>{`
              .mode-select-btn:hover {
                transform: translateY(-3px);
                background: ${exerciseMode === 'mode' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
                box-shadow: 0 10px 20px rgba(0,0,0,0.3);
              }
            `}</style>
          </div>
          
          <button
            className="glow-btn"
            style={{
              padding: "20px 80px",
              fontSize: "24px",
              marginBottom: "20px",
              width: '100%',
              maxWidth: '400px'
            }}
            onClick={startOnboarding}
          >
            PLAY {exerciseMode.toUpperCase()} ⚡
          </button>
          
          <div style={{ fontSize: "14px", opacity: 0.5 }}>
            Free to play • No equipment needed • 100% Privacy
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 5%', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="arcade-text" style={{ fontSize: '32px' }}>HOW IT <span style={{ color: 'var(--accent)' }}>WORKS</span></h2>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {[
            { title: "POSITION", desc: "Place your device 5-7 feet away so your whole body is visible.", icon: "📱" },
            { title: "CALIBRATE", desc: "Our AI maps your skeletal structure in real-time.", icon: "🦴" },
            { title: "MOVE", desc: "Perform " + exerciseMode + " to boost your speed.", icon: "🏃" },
            { title: "WIN", desc: "Out-exercise the AI and reach the finish line!", icon: "🏆" }
          ].map((f, i) => (
            <div key={i} style={{
              background: 'var(--glass)',
              padding: '40px',
              borderRadius: '24px',
              border: '1px solid var(--glass-border)',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ color: 'var(--accent)', marginBottom: '15px', letterSpacing: '2px' }}>{f.title}</h3>
              <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Onboarding Modal/Overlay */}
      {showOnboarding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#111',
            padding: '40px',
            borderRadius: '32px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid var(--accent)'
          }}>
            <h2 className="arcade-text" style={{ color: 'var(--accent)', marginBottom: '30px' }}>PREPARE FOR BATTLE</h2>
            <div style={{ textAlign: 'left', marginBottom: '30px', opacity: 0.8 }}>
              <p style={{ marginBottom: '15px' }}>✅ Ensure good lighting in your room.</p>
              <p style={{ marginBottom: '15px' }}>✅ Prop your phone against a wall/water bottle.</p>
              <p style={{ marginBottom: '15px' }}>✅ Step back until your whole body is seen.</p>
              <p>✅ Allow camera access when prompted.</p>
            </div>
            <button className="glow-btn" style={{ width: '100%' }} onClick={finishOnboarding}>
              I'M READY! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


