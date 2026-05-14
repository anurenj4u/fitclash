"use client";
import React, { useState, useCallback, useEffect } from "react";
import FitnessRace from "@/components/FitnessRace";
import MotionTracker from "@/components/MotionTracker";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Activity, 
  Users, 
  Trophy, 
  Zap, 
  ShieldCheck, 
  Camera, 
  Layout,
  ChevronRight,
  TrendingUp,
  Star
} from "lucide-react";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [exerciseMode, setExerciseMode] = useState('squats');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [targetDistance, setTargetDistance] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        background: "#020205", 
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
    <div style={{ position: "relative", minHeight: "100vh", background: "#020205", color: "#fff", overflow: "hidden" }}>
      {/* Dynamic Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(57, 255, 20, 0.07) 0%, transparent 40%)`,
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Animated Particles (Simplified CSS version) */}
      <div className="particles-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            position: 'absolute',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: '2px',
            height: '2px',
            background: 'var(--accent)',
            boxShadow: '0 0 10px var(--accent)',
            borderRadius: '50%',
            opacity: Math.random() * 0.5,
            animation: `float ${5 + Math.random() * 10}s infinite linear`
          }} />
        ))}
      </div>

      {/* Hero Section */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: "120px 20px",
        position: 'relative',
        zIndex: 2
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '1000px' }}
        >
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'rgba(57, 255, 20, 0.1)', 
            padding: '8px 20px', 
            borderRadius: '50px', 
            marginBottom: '30px',
            border: '1px solid rgba(57, 255, 20, 0.2)'
          }}>
            <Zap size={14} color="var(--accent)" fill="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '2px', color: 'var(--accent)' }}>THE FUTURE OF FITNESS</span>
          </div>

          <h1 className="arcade-text" style={{
            fontSize: "clamp(40px, 12vw, 140px)",
            lineHeight: 0.9,
            marginBottom: "20px",
            background: 'linear-gradient(to bottom, #fff 40%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(57, 255, 20, 0.3))'
          }}>
            CLASH<span style={{ color: "var(--accent)", WebkitTextFillColor: 'initial' }}>OFCARDIO</span>
          </h1>
          
          <p style={{
            fontSize: "clamp(18px, 3vw, 28px)",
            fontFamily: 'var(--font-body)',
            opacity: 0.9,
            marginBottom: "50px",
            maxWidth: "800px",
            margin: "0 auto 50px",
            lineHeight: 1.4
          }}>
            Control games using <span style={{ color: 'var(--accent)', fontWeight: 800, textShadow: '0 0 10px var(--accent-glow)' }}>REAL EXERCISE</span>.<br/>
            Your body is the controller.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button
              className="glow-btn pulse-glow"
              onClick={startOnboarding}
              style={{ fontSize: '20px', padding: '20px 60px', display: 'flex', alignItems: 'center', gap: '15px' }}
            >
              <Play fill="currentColor" size={24} /> PLAY NOW
            </button>
            <button
              className="glass-card"
              style={{ padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              WATCH GAMEPLAY
            </button>
          </div>

          {/* Integrated Mode Selector UI Upgrade */}
          <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.02)' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p className="hud-text" style={{ marginBottom: '20px' }}>[01] SELECT CHALLENGE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['squats', 'pushups', 'jacks', 'fingers'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setExerciseMode(mode)}
                        style={{
                          background: exerciseMode === mode ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                          color: exerciseMode === mode ? 'var(--accent)' : '#fff',
                          border: `1px solid ${exerciseMode === mode ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                          padding: "15px 20px",
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontFamily: 'var(--font-gaming)'
                        }}
                      >
                        {mode === 'jacks' ? 'JUMPING JACKS' : mode === 'fingers' ? 'FINGER SPRINT' : mode.toUpperCase()}
                        {exerciseMode === mode && <Zap size={14} fill="var(--accent)" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <p className="hud-text" style={{ marginBottom: '20px' }}>[02] TARGET DISTANCE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                    {[1, 2, 3].map(km => (
                      <button
                        key={km}
                        onClick={() => setTargetDistance(km)}
                        style={{
                          background: targetDistance === km ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                          color: targetDistance === km ? 'var(--secondary)' : '#fff',
                          border: `1px solid ${targetDistance === km ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                          padding: "15px 20px",
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontFamily: 'var(--font-gaming)'
                        }}
                      >
                        {km} KM RACE
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>{km * 10} MINS EST.</span>
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Live Stats Section */}
      <section style={{ padding: '80px 5%', background: 'linear-gradient(180deg, #020205 0%, #050510 100%)', position: 'relative', zIndex: 2 }}>
        <div className="features-grid">
          {[
            { label: "CALORIES BURNED", value: "124,502", icon: <Activity color="var(--accent)" />, color: 'var(--accent)' },
            { label: "ACTIVE PLAYERS", value: "842", icon: <Users color="var(--secondary)" />, color: 'var(--secondary)' },
            { label: "RACES FINISHED", value: "12,044", icon: <Trophy color="#ffcc00" />, color: '#ffcc00' },
            { label: "AVG. STREAK", value: "5 DAYS", icon: <TrendingUp color="var(--tertiary)" />, color: 'var(--tertiary)' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass-card" 
              style={{ textAlign: 'center', padding: '40px' }}
            >
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <h4 style={{ fontSize: '12px', opacity: 0.6, letterSpacing: '2px', marginBottom: '10px' }}>{stat.label}</h4>
              <p className="arcade-text" style={{ fontSize: '32px', color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section Upgrade */}
      <section style={{ padding: '120px 5%', background: '#020205', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(32px, 5vw, 60px)', marginBottom: '20px' }}>WEAPONIZE YOUR <span style={{ color: 'var(--accent)' }}>WORKOUT</span></h2>
          <p style={{ opacity: 0.6, fontSize: '20px' }}>The world's most advanced AI fitness engine.</p>
        </div>
        
        <div className="features-grid">
          {[
            { 
              title: "AI MOTION TRACKING", 
              desc: "Pro-grade pose estimation using TensorFlow.js. Zero lag, 100% privacy.", 
              icon: <Camera size={32} />,
              color: 'var(--accent)' 
            },
            { 
              title: "ARCADE RACING", 
              desc: "Battle AI opponents in high-stakes races. Your speed depends on your rep intensity.", 
              icon: <Zap size={32} />,
              color: 'var(--secondary)' 
            },
            { 
              title: "MULTIPLAYER LEAGUES", 
              desc: "Challenge friends or climb global leaderboards. Become the ultimate cardio champion.", 
              icon: <Trophy size={32} />,
              color: 'var(--tertiary)' 
            },
            { 
              title: "STREAK BONUSES", 
              desc: "Daily missions, XP gains, and unlockable runner skins keep you coming back.", 
              icon: <Star size={32} />,
              color: '#ffcc00' 
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                borderLeft: `4px solid ${f.color}`
              }}
            >
              <div style={{ color: f.color }}>{f.icon}</div>
              <h3 style={{ fontSize: '20px', letterSpacing: '1px' }}>{f.title}</h3>
              <p style={{ opacity: 0.7, lineHeight: 1.6, fontSize: '16px' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof / Activity Feed Mockup */}
      <section style={{ padding: '80px 5%', background: 'rgba(57, 255, 20, 0.02)', borderTop: '1px solid rgba(57, 255, 20, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
            <div className="pulse-glow" style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%' }} />
            <span className="hud-text">LIVE ACTIVITY FEED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { user: "NeonRacer", action: "finished 2KM Squat Race", result: "1st PLACE", time: "2m ago" },
              { user: "VortexBody", action: "burned 450 calories", result: "NEW PB", time: "5m ago" },
              { user: "CyberFit", action: "reached STREAK LEVEL 10", result: "LEVEL UP", time: "12m ago" }
            ].map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 1 - i * 0.2 }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{item.user}</span>
                  <span style={{ opacity: 0.6 }}>{item.action}</span>
                  <span style={{ background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>{item.result}</span>
                </div>
                <span style={{ fontSize: '12px', opacity: 0.4 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Modal Upgrade */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.95)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card"
              style={{
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid var(--accent)',
                padding: '60px'
              }}
            >
              <ShieldCheck size={64} color="var(--accent)" style={{ marginBottom: '30px' }} />
              <h2 className="arcade-text" style={{ color: 'var(--accent)', marginBottom: '30px', fontSize: '32px' }}>INITIALIZING NEURAL LINK</h2>
              <div style={{ textAlign: 'left', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent)', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: '12px' }}>1</div>
                  <p style={{ opacity: 0.8 }}>Place device <span style={{ color: 'var(--accent)' }}>5-7 feet away</span>. Ensure full body visibility.</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent)', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: '12px' }}>2</div>
                  <p style={{ opacity: 0.8 }}>Good lighting is key for <span style={{ color: 'var(--accent)' }}>99% tracking accuracy</span>.</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent)', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: '12px' }}>3</div>
                  <p style={{ opacity: 0.8 }}>Privacy Guaranteed. All data is processed <span style={{ color: 'var(--accent)' }}>locally on your device</span>.</p>
                </div>
              </div>
              <button className="glow-btn pulse-glow" style={{ width: '100%', fontSize: '20px' }} onClick={finishOnboarding}>
                ESTABLISH CONNECTION 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .particle {
          pointer-events: none;
        }
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-100px) translateX(50px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
    </div>
  );
}


