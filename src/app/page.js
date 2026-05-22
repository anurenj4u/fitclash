"use client";
import React, { useState, useCallback, useEffect } from "react";
import NormalWorkout from "@/components/NormalWorkout";
import FitnessRace from "@/components/FitnessRace";
import WorkoutProgramExecutor from "@/components/WorkoutProgramExecutor";
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
  ChevronRight, 
  TrendingUp, 
  Star, 
  Crown, 
  AlertTriangle, 
  X,
  Heart,
  Award,
  Flame,
  Sparkles,
  BookOpen
} from "lucide-react";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [exerciseMode, setExerciseMode] = useState('squats');
  const [playMode, setPlayMode] = useState('worldcup'); // 'normal' | 'worldcup'
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [targetDistance, setTargetDistance] = useState(1); // 1, 2, or 3 KM
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // New Fitness custom configuration state
  const [selectedGoal, setSelectedGoal] = useState('FAT BURN');
  const [selectedExercises, setSelectedExercises] = useState(['squats']);
  
  // Real-time rep counting in parent to cycle webcam mode dynamically
  const [currentReps, setCurrentReps] = useState(0);

  // Workout Programs state
  const [activeProgram, setActiveProgram] = useState(null);
  const [runningProgram, setRunningProgram] = useState(false);

  const { user, userData } = useAuth();
  const router = useRouter();

  // Unified Progression Local Storage + Firebase state
  const [progression, setProgression] = useState({
    xp: 450,
    level: 5,
    calories: 840,
    workoutStreak: 7,
    totalWorkouts: 24,
    rank: "SPRINTER",
    dailyMissions: [
      { id: 1, text: "Complete 1 Workout Session", xp: 150, completed: false },
      { id: 2, text: "Burn 100 Calories", xp: 200, completed: false },
      { id: 3, text: "Finish a structured training plan", xp: 250, completed: false }
    ],
    unlockedThemes: ["default"],
    unlockedStadiums: ["default"],
    unlockedCharacters: ["default"],
    activeTheme: "default",
    activeStadium: "default",
    activeCharacter: "default"
  });

  // Load progression state on mount
  useEffect(() => {
    setMounted(true);
    
    // Load local storage values
    const saved = localStorage.getItem("clashOfCardioProgression");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgression(parsed);
      } catch (e) {}
    } else {
      localStorage.setItem("clashOfCardioProgression", JSON.stringify(progression));
    }

    // Floating subtle ambient particles
    const generated = [...Array(10)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: 0.05 + Math.random() * 0.1,
      duration: `${10 + Math.random() * 8}s`
    }));
    setParticles(generated);

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Set default playmode based on premium state
  useEffect(() => {
    if (userData) {
      // Unlocked 'normal' (Fitness Workout) for all users for testing
      setPlayMode('normal');
    }
  }, [userData]);

  // Listen to camera pose changes to update dynamic workout rounds
  useEffect(() => {
    if (!gameStarted) {
      setCurrentReps(0);
      return;
    }
    const handlePose = (e) => {
      setCurrentReps(prev => prev + 1);
    };
    window.addEventListener('pose-update', handlePose);
    return () => window.removeEventListener('pose-update', handlePose);
  }, [gameStarted]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Standard Workout Start handler
  const startOnboarding = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Temporarily disabled daily limit for easier testing
    // if (!userData?.isPremium && userData?.gamesToday >= 5) {
    //   setShowLimitModal(true);
    //   return;
    // }
    setIsCameraReady(false); // Reset camera state for clean mount
    setShowOnboarding(true);
  };

  // Structured Workout Program Start handler
  const startProgramWorkout = (prog) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Temporarily disabled daily limit for easier testing
    // if (!userData?.isPremium && userData?.gamesToday >= 5) {
    //   setShowLimitModal(true);
    //   return;
    // }

    setIsCameraReady(false); // Reset camera state for clean mount
    setActiveProgram(prog);
    setExerciseMode(prog.exercise);
    setRunningProgram(true);
  };

  const finishOnboarding = async () => {
    setShowOnboarding(false);
    setGameStarted(true);

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userDocRef, {
          gamesToday: increment(1),
          lastPlayed: serverTimestamp()
        });
      } catch (e) {}
    }
  };

  // Callback on single workout complete
  const handleWorkoutComplete = (results) => {
    setProgression(prev => {
      const newXp = prev.xp + results.xpGained;
      const nextLevelNeeded = prev.level * 1000;
      let newLevel = prev.level;
      if (newXp >= nextLevelNeeded) {
        newLevel += 1;
      }
      
      const newStreak = prev.workoutStreak + 1;
      const newUnlockedThemes = [...prev.unlockedThemes];
      const newUnlockedStadiums = [...prev.unlockedStadiums];
      const newUnlockedCharacters = [...prev.unlockedCharacters];
      
      if (newStreak >= 3 && !newUnlockedThemes.includes("sunset")) {
        newUnlockedThemes.push("sunset");
      }
      if (newStreak >= 5 && !newUnlockedStadiums.includes("golden")) {
        newUnlockedStadiums.push("golden");
      }
      if (newStreak >= 7 && !newUnlockedCharacters.includes("ronaldo_elite")) {
        newUnlockedCharacters.push("ronaldo_elite");
      }

      const updated = {
        ...prev,
        xp: newXp % nextLevelNeeded,
        level: newLevel,
        calories: prev.calories + results.caloriesBurned,
        totalWorkouts: prev.totalWorkouts + 1,
        workoutStreak: newStreak,
        unlockedThemes: newUnlockedThemes,
        unlockedStadiums: newUnlockedStadiums,
        unlockedCharacters: newUnlockedCharacters,
        dailyMissions: prev.dailyMissions.map(m => m.id === 1 ? { ...m, completed: true } : m)
      };
      
      localStorage.setItem("clashOfCardioProgression", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      updateDoc(userDocRef, {
        xp: increment(results.xpGained),
        calories: increment(results.caloriesBurned),
        totalWorkouts: increment(1),
        workoutStreak: increment(1)
      }).catch(e => console.error("Firestore sync error:", e));
    }
  };

  // Structured Workout Plans
  const workoutPrograms = [
    { id: 'fatburn', name: "Beginner Fat Burn", desc: "Short cardiovascular work rounds designed to target lower body fat burn.", rounds: 3, workDuration: 35, restDuration: 15, exercise: "squats", difficulty: "Rookie" },
    { id: 'sprint', name: "Football Sprint Training", desc: "High-intensity metabolic drills to mimic top sprinter stamina curves.", rounds: 4, workDuration: 45, restDuration: 20, exercise: "jacks", difficulty: "Sprinter" },
    { id: 'hiit', name: "HIIT Mode", desc: "Short rests combined with rapid movement repetitions for supreme physical endurance.", rounds: 5, workDuration: 50, restDuration: 15, exercise: "squats", difficulty: "Elite Athlete" },
    { id: 'fullbody', name: "Full Body Cardio", desc: "Compound aerobic motion rounds combining multiple pose challenges.", rounds: 4, workDuration: 45, restDuration: 20, exercise: "jacks", difficulty: "Elite Athlete" }
  ];

  // Dynamic active exercise for camera tracking during customizable circuits
  const activeExerciseIndex = Math.floor(currentReps / 10);
  const activeExercise = selectedExercises[activeExerciseIndex % selectedExercises.length] || 'squats';
  const trackerMode = playMode === 'worldcup' ? exerciseMode : activeExercise;

  // Structured Workout Plan execution screen
  if (runningProgram && activeProgram) {
    return (
      <div 
        onClick={() => {
          if (typeof window !== 'undefined' && !document.fullscreenElement && !document.webkitFullscreenElement) {
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
            enterFullscreen();
          }
        }}
        style={{ 
          position: "fixed", 
          inset: 0,
          height: "100dvh", 
          background: "#020205", 
          color: "#fff", 
          overflow: "hidden",
          zIndex: 2000,
          cursor: "pointer"
        }}
      >
        <WorkoutProgramExecutor 
          program={activeProgram}
          isCameraReady={isCameraReady}
          onComplete={(results) => {
            handleWorkoutComplete(results);
            setRunningProgram(false);
            setActiveProgram(null);
            setIsCameraReady(false); // Reset camera ready state on finish
          }}
          onExit={() => {
            setRunningProgram(false);
            setActiveProgram(null);
            setIsCameraReady(false); // Reset camera ready state on exit
          }}
        />
        <MotionTracker mode={exerciseMode} onReady={handleCameraReady} />
      </div>
    );
  }

  // Standard Workout execution screen
  if (gameStarted) {
    return (
      <div 
        onClick={() => {
          if (typeof window !== 'undefined' && !document.fullscreenElement && !document.webkitFullscreenElement) {
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
            enterFullscreen();
          }
        }}
        style={{ 
          position: "fixed", 
          inset: 0,
          height: "100dvh", 
          background: "#020205", 
          color: "#fff", 
          overflow: "hidden",
          zIndex: 2000,
          cursor: "pointer"
        }}
      >
        {playMode === 'worldcup' ? (
          <FitnessRace 
            mode={exerciseMode} 
            targetKm={targetDistance} 
            isCameraReady={isCameraReady} 
            activeTheme={progression.activeTheme}
            activeStadium={progression.activeStadium}
            activeCharacter={progression.activeCharacter}
            onComplete={(reps) => {
              const caloriesBurned = Math.round(reps * 0.45 + targetDistance * 10);
              const xpGained = Math.round(reps * 6 + targetDistance * 50);
              handleWorkoutComplete({ reps, caloriesBurned, xpGained });
              setGameStarted(false);
              setIsCameraReady(false); // Reset camera ready state on completion
            }}
          />
        ) : (
          <NormalWorkout 
            selectedExercises={selectedExercises}
            targetDistance={targetDistance}
            selectedGoal={selectedGoal}
            isCameraReady={isCameraReady} 
            onComplete={(reps) => {
              const caloriesBurned = Math.round(reps * 0.45 + targetDistance * 10);
              const xpGained = Math.round(reps * 6 + targetDistance * 50);
              handleWorkoutComplete({ reps, caloriesBurned, xpGained });
              setGameStarted(false);
              setIsCameraReady(false); // Reset camera ready state on completion
            }}
          />
        )}
        <MotionTracker mode={trackerMode} onReady={handleCameraReady} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#050508", color: "#ffffff", overflow: "hidden", fontFamily: 'var(--font-body)', paddingTop: '40px' }}>
      {/* Subtle cursor halo light */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(57, 255, 20, 0.01) 0%, transparent 40%)`,
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Background stardust particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {particles.map((particle, i) => (
          <div key={i} className="particle" style={{
            position: 'absolute',
            top: particle.top,
            left: particle.left,
            width: '2px',
            height: '2px',
            background: '#ffffff',
            borderRadius: '50%',
            opacity: particle.opacity,
            animation: `float ${particle.duration} infinite linear`
          }} />
        ))}
      </div>

      {/* HERO & CONTENT SECTION */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        padding: 'clamp(10px, 2.5vh, 25px) 5% clamp(20px, 6vh, 60px) 5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        
        {/* Micro Green Header Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(57, 255, 20, 0.05)',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '9px',
          fontWeight: 800,
          color: '#39ff14',
          letterSpacing: '1px',
          marginBottom: '12px',
          fontFamily: 'var(--font-gaming)'
        }}>
          <span style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #39ff14' }} />
          THE FUTURE OF FITNESS
        </div>

        {/* Massive Glowing ClashOfCardio Title */}
        <h1 className="arcade-text animate-pulse" style={{
          fontSize: 'clamp(32px, 8vw, 78px)',
          fontWeight: 900,
          color: '#39ff14',
          letterSpacing: '4px',
          textShadow: '0 0 30px rgba(57, 255, 20, 0.6), 0 0 60px rgba(57, 255, 20, 0.2)',
          marginBottom: '6px',
          lineHeight: '1'
        }}>
          CLASHOFCARDIO
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          opacity: 0.7,
          maxWidth: '550px',
          lineHeight: 1.6,
          marginBottom: '15px',
          color: '#ffffff'
        }}>
          Achieve your fitness goals with interactive AI tracking. <span style={{ color: '#39ff14', fontWeight: 700 }}>Your body is the controller.</span>
        </p>

        {/* Floating High-Tech Calories Counter Card */}
        <div className="hero-calories-badge">
          <Flame size={20} fill="#39ff14" color="#39ff14" style={{ filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.8))' }} />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '8px', opacity: 0.5, fontWeight: 800, letterSpacing: '1px', display: 'block', color: '#fff' }}>TOTAL CALORIES BURNED</span>
            <span className="arcade-text" style={{ fontSize: '20px', color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.4)', fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              {progression.calories} <span style={{ fontSize: '10px', fontFamily: 'var(--font-body)', fontWeight: 700, color: '#fff' }}>KCAL</span>
            </span>
          </div>
        </div>


        {/* Segmented Options Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(5, 5, 8, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '8px',
          maxWidth: '550px',
          width: '100%',
          margin: '0 auto 20px auto',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              // Unlocked for testing and development
              setPlayMode('normal');
            }}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: playMode === 'normal' ? '#39ff14' : 'transparent',
              color: playMode === 'normal' ? '#000000' : '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-gaming)',
              boxShadow: playMode === 'normal' ? '0 0 25px rgba(57, 255, 20, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px'
            }}
          >
            <Zap size={14} fill={playMode === 'normal' ? '#000' : '#fff'} color={playMode === 'normal' ? '#000' : '#fff'} /> FITNESS WORKOUT
          </button>
          <button
            onClick={() => setPlayMode('worldcup')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: playMode === 'worldcup' ? '#39ff14' : 'transparent',
              color: playMode === 'worldcup' ? '#000000' : '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-gaming)',
              boxShadow: playMode === 'worldcup' ? '0 0 25px rgba(57, 255, 20, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px'
            }}
          >
            <Trophy size={14} fill={playMode === 'worldcup' ? '#000' : 'none'} color={playMode === 'worldcup' ? '#000' : '#fff'} /> WORLD CUP SPRINT
          </button>
        </div>

        {/* ABOVE-THE-FOLD PRIMARY START CONTROLS */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          alignItems: 'center',
          marginBottom: '35px',
          marginTop: '5px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={startOnboarding}
            style={{
              background: '#39ff14',
              color: '#000000',
              padding: '16px 48px',
              borderRadius: '30px',
              border: 'none',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Play size={14} fill="#000" color="#000" /> START WORKOUT ⚡
          </button>

          <button
            onClick={() => alert("Watch trailer loaded successfully!")}
            style={{
              background: 'transparent',
              color: '#ffffff',
              padding: '16px 36px',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          >
            WATCH TRAILER
          </button>
        </div>

        {/* DYNAMIC VIEWS WRAPPER */}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* ============================================================ */}
          {/* FITNESS WORKOUT CUSTOMIZER (GOAL + KILOMETERS + MULTI-SELECT) */}
          {/* ============================================================ */}
          {playMode === 'normal' && (
            <>
              {/* GOAL SELECTOR CARD */}
              <div style={{
                padding: 'clamp(14px, 3vw, 24px)',
                background: 'rgba(5, 5, 8, 0.4)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: '16px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, letterSpacing: '2px' }}>[01] SELECT YOUR WORKOUT GOAL</span>
                  <div style={{ background: 'rgba(57, 255, 20, 0.1)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
                    {selectedGoal}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  {['FAT BURN', 'STAMINA IMPROVEMENT', 'STRENGTH ENDURANCE'].map(goal => {
                    const isActive = selectedGoal === goal;
                    const icon = goal === 'FAT BURN' ? '🔥' : goal === 'STAMINA IMPROVEMENT' ? '⚡' : '🫁';
                    return (
                      <button
                        key={goal}
                        onClick={() => setSelectedGoal(goal)}
                        style={{
                          background: isActive ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? '#39ff14' : '#ffffff',
                          border: `1px solid ${isActive ? '#39ff14' : 'rgba(255,255,255,0.06)'}`,
                          padding: "14px 10px",
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontFamily: 'var(--font-gaming)',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 0 10px rgba(57, 255, 20, 0.1)' : 'none'
                        }}
                      >
                        <span>{icon}</span>
                        <span>{goal}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TARGET DISTANCE CARD (MAX 3 KM) */}
              <div style={{
                padding: 'clamp(14px, 3vw, 24px)',
                background: 'rgba(5, 5, 8, 0.4)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: '16px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, letterSpacing: '2px' }}>[02] CONFIGURE TARGET DISTANCE (MAX 3 KM)</span>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {targetDistance} KM ({targetDistance * 100} Reps Needed)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[1, 2, 3].map(km => {
                    const isActive = targetDistance === km;
                    return (
                      <button
                        key={km}
                        onClick={() => setTargetDistance(km)}
                        style={{
                          background: isActive ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? '#39ff14' : '#ffffff',
                          border: `1px solid ${isActive ? '#39ff14' : 'rgba(255,255,255,0.06)'}`,
                          padding: "16px 10px",
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          fontFamily: 'var(--font-gaming)',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 0 10px rgba(57, 255, 20, 0.1)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 900 }}>{km} KM</span>
                        <span style={{ fontSize: '8px', opacity: 0.5 }}>{km * 100} TOTAL REPS</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WORKOUT TYPE MULTI-SELECT COMBINATION */}
              <div style={{
                width: '100%',
                background: 'rgba(5, 5, 8, 0.4)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: '16px',
                padding: 'clamp(16px, 4vw, 30px) clamp(14px, 3vw, 24px)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, letterSpacing: '2px' }}>[03] CHOOSE EXERCISE COMBINATION (SELECT MULTIPLE!)</span>
                  <span style={{ fontSize: '10px', color: '#39ff14', fontWeight: 800, letterSpacing: '1px' }}>
                    {selectedExercises.length} SELECTED
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {['squats', 'pushups', 'jacks', 'fingers'].map(mode => {
                    const label = mode === 'jacks' ? 'JUMPING JACKS' : mode === 'fingers' ? 'FINGER SPRINT' : mode.toUpperCase();
                    const isActive = selectedExercises.includes(mode);
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          setSelectedExercises(prev => {
                            if (prev.includes(mode)) {
                              if (prev.length === 1) return prev; // Keep at least 1 selected
                              return prev.filter(m => m !== mode);
                            } else {
                              return [...prev, mode];
                            }
                          });
                        }}
                        style={{
                          padding: '20px 10px',
                          borderRadius: '12px',
                          background: isActive ? 'rgba(57, 255, 20, 0.05)' : 'transparent',
                          color: isActive ? '#39ff14' : '#ffffff',
                          border: `1px solid ${isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.06)'}`,
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'var(--font-gaming)',
                          boxShadow: isActive ? '0 0 15px rgba(57, 255, 20, 0.15)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{label}</span>
                        {isActive && <Zap size={12} fill="#39ff14" color="#39ff14" />}
                      </button>
                    );
                  })}
                </div>

                {/* dynamic summary text */}
                <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', color: '#fff', opacity: 0.8, lineHeight: 1.5 }}>
                  🎯 Setup Summary: <strong style={{ color: '#39ff14' }}>{selectedGoal}</strong> goal with a <strong style={{ color: '#39ff14' }}>{targetDistance} KM</strong> target. Every single completed repetition counts as <strong style={{ color: '#39ff14' }}>10 meters</strong> of progression. Your active exercise will cycle every 10 reps!
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* WORLD CUP SPRINT CUSTOMIZER (SINGLE EXERCISE SELECTOR ONLY) */}
          {/* ============================================================ */}
          {playMode === 'worldcup' && (
            <>
              {/* SPRINT DISTANCE OPTIONS (WORLD CUP ONLY) */}
              <div style={{
                padding: 'clamp(14px, 3vw, 24px)',
                background: 'rgba(5, 5, 8, 0.4)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: '16px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, letterSpacing: '2px' }}>[01] SELECT SPRINT TARGET DISTANCE</span>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {targetDistance >= 1 ? `${targetDistance} KM` : `${targetDistance * 1000} METERS`}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[1, 2, 3].map(km => (
                    <button
                      key={km}
                      onClick={() => setTargetDistance(km)}
                      style={{
                        background: targetDistance === km ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                        color: '#ffffff',
                        border: `1px solid ${targetDistance === km ? '#ffffff' : 'rgba(255,255,255,0.06)'}`,
                        padding: "14px 10px",
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        fontFamily: 'var(--font-gaming)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{km} KM</span>
                      <span style={{ fontSize: '8px', opacity: 0.4 }}>{km * 10} MINS</span>
                    </button>
                  ))}
                  
                  {/* Custom input */}
                  <div style={{
                    position: 'relative',
                    background: ![1, 2, 3].includes(targetDistance) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${![1, 2, 3].includes(targetDistance) ? '#ffffff' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 15px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="number"
                      placeholder="CUSTOM M"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0) setTargetDistance(val / 1000);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        width: '100%',
                        padding: '14px 0',
                        outline: 'none',
                        fontFamily: 'var(--font-gaming)',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SINGLE WORKOUT TYPE SELECTOR (WORLD CUP ONLY) */}
              <div style={{
                width: '100%',
                background: 'rgba(5, 5, 8, 0.4)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: '16px',
                padding: 'clamp(16px, 4vw, 30px) clamp(14px, 3vw, 24px)'
              }}>
                <p style={{
                  textAlign: 'center',
                  color: '#39ff14',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  marginBottom: '20px',
                  fontFamily: 'var(--font-gaming)'
                }}>
                  [02] SELECT SPRINT WORKOUT TYPE
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {['squats', 'pushups', 'jacks', 'fingers'].map(mode => {
                    const label = mode === 'jacks' ? 'JUMPING JACKS' : mode === 'fingers' ? 'FINGER SPRINT' : mode.toUpperCase();
                    const isActive = exerciseMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setExerciseMode(mode)}
                        style={{
                          padding: '20px 10px',
                          borderRadius: '12px',
                          background: 'transparent',
                          color: isActive ? '#39ff14' : '#ffffff',
                          border: `1px solid ${isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.06)'}`,
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'var(--font-gaming)',
                          boxShadow: isActive ? '0 0 15px rgba(57, 255, 20, 0.15)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{label}</span>
                        {isActive && <Zap size={12} fill="#39ff14" color="#39ff14" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* BOTTOM CONTROLS */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            alignItems: 'center',
            marginTop: '15px'
          }}>
            <button
              onClick={startOnboarding}
              style={{
                background: '#39ff14',
                color: '#000000',
                padding: '16px 54px',
                borderRadius: '30px',
                border: 'none',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)',
                boxShadow: '0 0 25px rgba(57, 255, 20, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Play size={14} fill="#000" color="#000" /> START
            </button>

            <button
              onClick={() => alert("Watch trailer loaded successfully!")}
              style={{
                background: 'transparent',
                color: '#ffffff',
                padding: '16px 40px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            >
              WATCH TRAILER
            </button>
          </div>

        </div>

      </section>

      {/* Calibration Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.96)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(15px)'
            }}
          >
            <div 
              style={{
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(5, 5, 8, 0.95)',
                borderRadius: '16px',
                padding: '50px 40px'
              }}
            >
              <ShieldCheck size={48} color="#ffffff" style={{ marginBottom: '20px', margin: '0 auto 20px auto' }} />
              <h2 className="arcade-text" style={{ color: '#ffffff', marginBottom: '25px', fontSize: '24px', textShadow: 'none' }}>CALIBRATING TRACKER</h2>
              <div style={{ textAlign: 'left', marginBottom: '35px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ffffff', color: '#000000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '11px' }}>1</div>
                  <p style={{ opacity: 0.7, fontSize: '13px' }}>Place device <span style={{ color: '#ffffff', fontWeight: 600 }}>5-7 feet away</span>. Ensure full body visibility.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ffffff', color: '#000000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '11px' }}>2</div>
                  <p style={{ opacity: 0.7, fontSize: '13px' }}>Good lighting is key for <span style={{ color: '#ffffff', fontWeight: 600 }}>99% tracking accuracy</span>.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ffffff', color: '#000000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '11px' }}>3</div>
                  <p style={{ opacity: 0.7, fontSize: '13px' }}>Privacy Guaranteed. All data is processed <span style={{ color: '#ffffff', fontWeight: 600 }}>locally on your device</span>.</p>
                </div>
              </div>
              <button 
                onClick={finishOnboarding}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#000000',
                  padding: '14px 0',
                  borderRadius: '30px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-gaming)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(255,255,255,0.15)',
                }}
              >
                START WORKOUT 🚀
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Game Limits modal */}
      <AnimatePresence>
        {showLimitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
          >
            <div 
              style={{
                maxWidth: '450px',
                width: '90%',
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(5, 5, 8, 0.95)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px'
              }}
            >
              <div style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer' }} onClick={() => setShowLimitModal(false)}>
                <X size={20} opacity={0.5} />
              </div>
              <AlertTriangle size={40} color="#ffffff" style={{ marginBottom: '15px', margin: '0 auto 10px auto' }} />
              <h2 className="arcade-text" style={{ fontSize: '20px', marginBottom: '12px', textShadow: 'none' }}>DAILY LIMIT REACHED</h2>
              <p style={{ opacity: 0.5, marginBottom: '25px', fontSize: '13px', lineHeight: 1.5 }}>
                You've reached your <span style={{ color: '#ffffff', fontWeight: 600 }}>5 free games</span> for today. Upgrade to Premium for unlimited gaming and elite features.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => router.push('/premium')}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    color: '#000000',
                    padding: '12px 0',
                    borderRadius: '30px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-gaming)',
                  }}
                >
                  GO PREMIUM NOW
                </button>
                <button 
                  onClick={() => setShowLimitModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.5, fontSize: '12px', cursor: 'pointer', marginTop: '5px' }}
                >
                  I'll play again tomorrow
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .particle {
          pointer-events: none;
        }
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-80px) translateX(40px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
    </div>
  );
}
