"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import NormalWorkout from "@/components/NormalWorkout";
import FitnessRace from "@/components/FitnessRace";
import WorkoutProgramExecutor from "@/components/WorkoutProgramExecutor";
import MotionTracker from "@/components/MotionTracker";
import StaminaMode from "@/components/StaminaMode";
import FatBurnWorkout from "@/components/FatBurnWorkout";

import LandscapeGuard from "@/components/LandscapeGuard";
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
  ChevronLeft,
  ChevronRight,
  Settings,
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
import { doc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createRoom, joinRoom, startMatchmaking, leaveLobby } from "@/utils/multiplayer";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [exerciseMode, setExerciseMode] = useState('squats');
  const [playMode, setPlayMode] = useState('normal'); // 'normal' | 'worldcup'
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [targetDistance, setTargetDistance] = useState(1); // 1, 2, or 3 KM
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showWelcomeOnboarding, setShowWelcomeOnboarding] = useState(false);
  const [welcomeCountdown, setWelcomeCountdown] = useState(5);

  // New Fitness custom configuration state
  const [selectedGoal, setSelectedGoal] = useState('FAT BURN & STAMINA');
  const [showFatBurnCalendar, setShowFatBurnCalendar] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState(['squats', 'pushups', 'jacks']);
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' | 'medium' | 'hard'
  const [restDuration, setRestDuration] = useState(120); // default 120s / 2 minutes rest time
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Tracks which exercise is currently active inside NormalWorkout for the MotionTracker mode
  const [activeWorkoutExerciseIndex, setActiveWorkoutExerciseIndex] = useState(0);

  // Workout Programs state
  const [activeProgram, setActiveProgram] = useState(null);
  const [runningProgram, setRunningProgram] = useState(false);

  // World Cup Sprint Multiplayer / Matchmaking state
  const [sprintMatchType, setSprintMatchType] = useState('ai'); // 'ai' | 'online' | 'friend'

  useEffect(() => {
    const savedSettings = localStorage.getItem('fitclash_user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.matchType) setSprintMatchType(parsed.matchType);
      } catch (e) {}
    }
  }, []);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState(null);
  const [multiplayerRole, setMultiplayerRole] = useState(null); // 'host' | 'guest'
  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [matchmakerSearching, setMatchmakerSearching] = useState(false);
  const [matchmakerError, setMatchmakerError] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isLobbyCreator, setIsLobbyCreator] = useState(false);
  const [matchmakerTimer, setMatchmakerTimer] = useState(7);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSprintSetupModal, setShowSprintSetupModal] = useState(false);
  const [matchedOpponent, setMatchedOpponent] = useState(null);
  const [activeMockOpponent, setActiveMockOpponent] = useState(null);
  const [showPRNotification, setShowPRNotification] = useState(false);

  useEffect(() => {
    // Show PR recommendation notification after a short delay
    const hasSeenPR = sessionStorage.getItem("fitclash_seen_pr_recommendation_v1");
    if (!hasSeenPR) {
      const timer = setTimeout(() => {
        setShowPRNotification(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePRChallengeClick = () => {
    sessionStorage.setItem("fitclash_seen_pr_recommendation_v1", "true");
    setShowPRNotification(false);
    setPlayMode('worldcup'); // switch to 1vs1 challenge
    
    // Smooth scroll down to the Sprint Workout Customizer section
    setTimeout(() => {
      const el = document.getElementById("worldcup-section");
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const MOCK_OPPONENTS = [
    { name: "Sam", avatar: "👤", flag: "🇺🇸", character: "Neymar" },
    { name: "Alex", avatar: "🧑‍🚀", flag: "🇬🇧", character: "Neymar" },
    { name: "Jordan", avatar: "🦁", flag: "🇧🇷", character: "Neymar" },
    { name: "Taylor", avatar: "⚡", flag: "🇫🇷", character: "Neymar" },
    { name: "Morgan", avatar: "🔥", flag: "🇩🇪", character: "Neymar" }
  ];


  const { user, userData } = useAuth();
  const router = useRouter();

  // Unified Progression Local Storage + Firebase state
  const [progression, setProgression] = useState({
    xp: 450,
    level: 5,
    calories: 0,
    caloriesToday: 0,
    workoutStreak: 7,
    totalWorkouts: 24,
    gamesToday: 0,
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
    activeCharacter: "default",
    fatBurnCalendar: Array.from({ length: 30 }).map((_, i) => ({
      day: i + 1,
      status: i === 0 ? 'current' : 'locked', // 'locked', 'current', 'completed', 'missed'
      reps: 0,
      calories: 0,
      accuracy: 0,
      duration: 0
    })),
    staminaData: {
      isCalibrated: false,
      baseline: {},
      currentTargets: {},
      history: []
    }
  });

  const highestReps = useMemo(() => {
    let maxReps = 34; // default fallback as requested by user
    if (progression?.fatBurnCalendar) {
      progression.fatBurnCalendar.forEach(day => {
        if (day.status === 'completed' && day.reps > maxReps) {
          maxReps = day.reps;
        }
      });
    }
    return maxReps;
  }, [progression]);

  // Load progression state on mount
  useEffect(() => {
    setMounted(true);

    // Welcome Onboarding First-Visit Trigger
    const hasOnboarded = localStorage.getItem("fitclash_welcome_onboarded_v3");
    if (!hasOnboarded) {
      setShowWelcomeOnboarding(true);
    }

    // Load local storage values
    const saved = localStorage.getItem("clashOfCardioProgression");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgression(prev => {
          const merged = {
            ...prev,
            ...parsed,
            dailyMissions: parsed.dailyMissions || prev.dailyMissions,
            fatBurnCalendar: parsed.fatBurnCalendar || prev.fatBurnCalendar,
            staminaData: {
              ...prev.staminaData,
              ...(parsed.staminaData || {})
            }
          };
          localStorage.setItem("clashOfCardioProgression", JSON.stringify(merged));
          return merged;
        });
      } catch (e) { }
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

  // Sync progression state from Firebase to local state when available (prevent older server stats from reverting fresh local sessions)
  useEffect(() => {
    if (userData) {
      setProgression(prev => {
        let changed = false;
        const updated = { ...prev };

        if (userData.calories !== undefined && userData.calories > prev.calories) {
          updated.calories = userData.calories;
          changed = true;
        }
        if (userData.caloriesToday !== undefined && userData.caloriesToday > prev.caloriesToday) {
          updated.caloriesToday = userData.caloriesToday;
          changed = true;
        }
        if (userData.gamesToday !== undefined && userData.gamesToday > prev.gamesToday) {
          updated.gamesToday = userData.gamesToday;
          changed = true;
        }

        if (changed) {
          localStorage.setItem("clashOfCardioProgression", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [userData]);

  // Onboarding welcome Countdown Timer
  useEffect(() => {
    if (!showWelcomeOnboarding) return;
    const interval = setInterval(() => {
      setWelcomeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          localStorage.setItem("fitclash_welcome_onboarded_v3", "true");
          setShowWelcomeOnboarding(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showWelcomeOnboarding]);

  // Realtime Firestore lobby listener
  useEffect(() => {
    if (!multiplayerRoomId) {
      setLobbyDetails(null);
      return;
    }

    const roomRef = doc(db, "sprint_rooms", multiplayerRoomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLobbyDetails(data);

        // Transition to game when countdown starts
        if (data.status === 'countdown' || data.status === 'playing') {
          setShowLobbyModal(false);
          setGameStarted(true);
        }
      } else {
        // Room deleted or not found
        setLobbyDetails(null);
        setMultiplayerRoomId(null);
        setMultiplayerRole(null);
        setShowLobbyModal(false);
      }
    });

    return () => unsubscribe();
  }, [multiplayerRoomId]);

  // Online Matchmaker search timer and auto-bot trigger
  useEffect(() => {
    let interval;
    if (matchmakerSearching && sprintMatchType === 'online' && multiplayerRoomId && (!lobbyDetails || !lobbyDetails.guestUid)) {
      setMatchmakerTimer(7);
      interval = setInterval(() => {
        setMatchmakerTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Spawn a simulated CR7 Bot opponent if no player joins within 7 seconds
            handleSimulatedMatchJoin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchmakerSearching, sprintMatchType, multiplayerRoomId, lobbyDetails?.guestUid]);

  const handleSimulatedMatchJoin = async () => {
    if (!multiplayerRoomId) return;
    try {
      const roomRef = doc(db, "sprint_rooms", multiplayerRoomId);
      await updateDoc(roomRef, {
        guestUid: "simulated_ai_pro",
        guestEmail: "CR7_CHAMP",
        status: 'ready',
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error simulating match join:", e);
    }
  };

  const handleLeaveLobby = async () => {
    if (multiplayerRoomId) {
      await leaveLobby(multiplayerRoomId, multiplayerRole, user?.uid);
    }
    setMultiplayerRoomId(null);
    setMultiplayerRole(null);
    setLobbyDetails(null);
    setShowLobbyModal(false);
    setMatchmakerSearching(false);
    setRoomCodeInput('');
    setMatchedOpponent(null);
    setActiveMockOpponent(null);
  };

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
          lastPlayed: serverTimestamp()
        });
      } catch (e) { }
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

      const newFatBurnCalendar = [...(prev.fatBurnCalendar || [])];
      if (results.isFatBurn) {
        const currentDayIndex = newFatBurnCalendar.findIndex(d => d.status === 'current');
        if (currentDayIndex !== -1) {
          newFatBurnCalendar[currentDayIndex] = {
            ...newFatBurnCalendar[currentDayIndex],
            status: 'completed',
            reps: results.reps || 0,
            calories: results.caloriesBurned || 0,
            accuracy: results.accuracy || 0,
            duration: results.duration || 0
          };
          if (currentDayIndex + 1 < newFatBurnCalendar.length) {
            newFatBurnCalendar[currentDayIndex + 1] = { ...newFatBurnCalendar[currentDayIndex + 1], status: 'current' };
          }
        }
      }

      // Self-heal NaN state corruptions
      const safePrevCaloriesToday = Number.isNaN(Number(prev.caloriesToday)) ? 0 : Number(prev.caloriesToday);
      const safePrevCalories = Number.isNaN(Number(prev.calories)) ? 0 : Number(prev.calories);
      const safeBurned = Number.isNaN(Number(results.caloriesBurned)) ? 0 : Number(results.caloriesBurned);
      const updatedCaloriesToday = safePrevCaloriesToday + safeBurned;

      const updated = {
        ...prev,
        xp: newXp % nextLevelNeeded,
        level: newLevel,
        calories: safePrevCalories + safeBurned,
        caloriesToday: updatedCaloriesToday,
        totalWorkouts: prev.totalWorkouts + 1,
        gamesToday: prev.gamesToday + 1,
        workoutStreak: newStreak,
        unlockedThemes: newUnlockedThemes,
        unlockedStadiums: newUnlockedStadiums,
        unlockedCharacters: newUnlockedCharacters,
        ...(results.isFatBurn ? { fatBurnCalendar: newFatBurnCalendar } : {}),
        dailyMissions: prev.dailyMissions.map(m => {
          if (m.id === 1) return { ...m, completed: true };
          if (m.id === 2 && updatedCaloriesToday >= 100) return { ...m, completed: true };
          if (m.id === 3 && results.programName) return { ...m, completed: true };
          return m;
        })
      };

      localStorage.setItem("clashOfCardioProgression", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      updateDoc(userDocRef, {
        xp: increment(results.xpGained),
        calories: increment(results.caloriesBurned),
        caloriesToday: increment(results.caloriesBurned),
        totalWorkouts: increment(1),
        gamesToday: increment(1),
        workoutStreak: increment(1),
        lastPlayed: serverTimestamp()
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

  // Dynamic active exercise for camera tracking - driven by NormalWorkout via onExerciseChange
  const activeExercise = selectedExercises[activeWorkoutExerciseIndex % selectedExercises.length] || 'squats';
  const trackerMode = playMode === 'worldcup' ? exerciseMode : activeExercise;

  // Structured Workout Plan execution screen
  if (runningProgram && activeProgram) {
    return (
      <LandscapeGuard>
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
            userData={userData}
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
      </LandscapeGuard>
    );
  }

  // Standard Workout execution screen
  if (gameStarted) {
    return (
      <LandscapeGuard>
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
              roomId={multiplayerRoomId}
              role={multiplayerRole}
              sprintMatchType={sprintMatchType}
              opponentName={matchedOpponent ? matchedOpponent.name : null}
              onComplete={(stats) => {
                const userWeight = userData?.weight || 70;
                const scaledCalories = Math.round((stats.calories || 0) * (userWeight / 70));
                
                handleWorkoutComplete({ 
                  reps: stats.reps || 0, 
                  caloriesBurned: scaledCalories, 
                  xpGained: stats.xp || 0 
                });
                setGameStarted(false);
                setIsCameraReady(false); // Reset camera ready state on completion
                setMultiplayerRoomId(null);
                setMultiplayerRole(null);
                setMatchedOpponent(null);
              }}
              onQuit={(stats) => {
                const userWeight = userData?.weight || 70;
                const scaledCalories = Math.round((stats.calories || 0) * (userWeight / 70));
                
                handleWorkoutComplete({ 
                  reps: stats.reps || 0, 
                  caloriesBurned: scaledCalories, 
                  xpGained: stats.xp || 0 
                });
                setGameStarted(false);
                setIsCameraReady(false); // Reset camera ready state on completion
                setMultiplayerRoomId(null);
                setMultiplayerRole(null);
                setMatchedOpponent(null);
              }}
            />
          ) : (
            <FatBurnWorkout
              difficulty={difficulty}
              isCameraReady={isCameraReady}
              activeCharacter={progression.activeCharacter}
              onExerciseChange={(idx) => setActiveWorkoutExerciseIndex(idx)}
              onComplete={(stats) => {
                setActiveWorkoutExerciseIndex(0);
                const userWeight = userData?.weight || 70;
                const scaledCalories = Math.round((stats.caloriesBurned || 0) * (userWeight / 70));
                handleWorkoutComplete({
                  reps: stats.reps,
                  caloriesBurned: scaledCalories,
                  xpGained: stats.xp,
                  accuracy: stats.accuracy,
                  duration: stats.duration,
                  rank: stats.rank,
                  isFatBurn: true
                });
                setGameStarted(false);
                setIsCameraReady(false);
              }}
            />
          )}
          <MotionTracker mode={trackerMode} onReady={handleCameraReady} />
        </div>
      </LandscapeGuard>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#050508", color: "#ffffff", overflowX: "hidden", fontFamily: 'var(--font-body)', paddingTop: '80px' }}>
      {/* Subtle cursor halo light */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(57, 255, 20, 0.02) 0%, transparent 35%)`,
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Futuristic Technical Grid Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.012) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Ambient Depth Background Radial Glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(57, 255, 20, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'blur(30px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 242, 255, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'blur(40px)'
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
        padding: 'clamp(20px, 4vh, 40px) 5% clamp(20px, 6vh, 60px) 5%',
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
          letterSpacing: '2px',
          marginBottom: '15px',
          fontFamily: 'var(--font-gaming)'
        }}>
          <span style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 4px #39ff14' }} />
          THE NEXT-GEN AI FITNESS CORE
        </div>

        {/* Massive Glowing ClashOfCardio Title */}
        <h1 className="arcade-text" style={{
          fontSize: 'clamp(32px, 8vw, 72px)',
          fontWeight: 900,
          color: '#39ff14',
          letterSpacing: '4px',
          textShadow: '0 2px 10px rgba(57, 255, 20, 0.15)',
          marginBottom: '10px',
          lineHeight: '1'
        }}>
          CLASHOFCARDIO
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          opacity: 0.85,
          maxWidth: '600px',
          lineHeight: 1.6,
          marginBottom: '25px',
          color: '#e2e8f0'
        }}>
          Turn cardio into competition. Control state-of-the-art workouts with your body and train inside a real-time responsive fitness game.
        </p>

        {/* Floating High-Tech Calories Counter Card */}
        <div 
          className="hero-calories-badge"
          style={{
            background: 'rgba(5, 5, 8, 0.95)',
            border: '1.5px solid rgba(57, 255, 20, 0.15)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '16px 24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            backdropFilter: 'blur(16px)',
            zIndex: 10,
            minWidth: '260px'
          }}
        >
          {/* Progress Circle & Pulse Icon */}
          <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '48px', height: '48px' }}>
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#39ff14"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(100, (Number(progression.caloriesToday) || 0)) / 100)}`}
                style={{
                  filter: 'drop-shadow(0 0 2px #39ff14)',
                  transition: 'stroke-dashoffset 1s ease'
                }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-glow 1.5s infinite ease-in-out' }}>
              <Flame size={18} fill="#39ff14" color="#39ff14" style={{ filter: 'drop-shadow(0 0 1.5px #39ff14)' }} />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #39ff14', animation: 'pulse-glow 1.2s infinite' }} />
              <span style={{ fontSize: '8px', opacity: 0.6, fontWeight: 900, letterSpacing: '1.5px', color: '#fff' }}>LIVE CORE TELEMETRY</span>
            </div>
            <span className="arcade-text" style={{ fontSize: '22px', color: '#ffffff', fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: '4px', lineHeight: 1.1 }}>
              <span style={{ color: '#39ff14' }}>{Number(progression.caloriesToday) || 0}</span> 
              <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800 }}>KCAL Today</span>
            </span>
            <div style={{ fontSize: '8px', opacity: 0.4, fontWeight: 700, letterSpacing: '0.5px', marginTop: '2px' }}>
              DAILY TARGET: 100 KCAL ({Math.min(100, Math.round(((Number(progression.caloriesToday) || 0) / 100) * 100))}% COMPLETED)
            </div>
          </div>
        </div>


        {/* Segmented Options Selector */}
        <div className="responsive-switcher" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(5, 5, 8, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '6px',
          maxWidth: '620px',
          width: '100%',
          margin: '0 auto 25px auto',
          gap: '8px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPlayMode('normal')}
            style={{
              padding: '16px 24px',
              borderRadius: '18px',
              background: playMode === 'normal' ? 'rgba(57, 255, 20, 0.08)' : 'transparent',
              color: playMode === 'normal' ? '#39ff14' : 'rgba(255,255,255,0.5)',
              border: playMode === 'normal' ? '1px solid #39ff14' : '1px solid transparent',
              fontSize: '14px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-gaming)',
              boxShadow: playMode === 'normal' ? '0 4px 12px rgba(57, 255, 20, 0.12)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '0.5px'
            }}
          >
            <Zap size={16} fill={playMode === 'normal' ? '#39ff14' : 'none'} color={playMode === 'normal' ? '#39ff14' : 'rgba(255,255,255,0.5)'} /> FITNESS WORKOUT
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPlayMode('worldcup')}
            style={{
              padding: '16px 24px',
              borderRadius: '18px',
              background: playMode === 'worldcup' ? 'rgba(57, 255, 20, 0.08)' : 'transparent',
              color: playMode === 'worldcup' ? '#39ff14' : 'rgba(255,255,255,0.5)',
              border: playMode === 'worldcup' ? '1px solid #39ff14' : '1px solid transparent',
              fontSize: '14px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-gaming)',
              boxShadow: playMode === 'worldcup' ? '0 4px 12px rgba(57, 255, 20, 0.12)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '0.5px'
            }}
          >
            <Trophy size={16} fill={playMode === 'worldcup' ? '#39ff14' : 'none'} color={playMode === 'worldcup' ? '#39ff14' : 'rgba(255,255,255,0.5)'} /> 1<span style={{ fontSize: '0.8em', opacity: 0.7, textTransform: 'lowercase', margin: '0 1px' }}>vs</span>1 CHALLENGE
          </motion.button>
        </div>


        {/* DYNAMIC VIEWS WRAPPER */}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* ============================================================ */}
          {/* FITNESS WORKOUT CUSTOMIZER (GOAL + KILOMETERS + MULTI-SELECT) */}
          {/* ============================================================ */}
          {playMode === 'normal' && (
            <>
              {/* UNIFIED FAT BURN & STAMINA FEATURE PANEL */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  padding: '16px 20px',
                  background: 'rgba(5, 5, 8, 0.6)',
                  border: '1px solid rgba(57, 255, 20, 0.25)',
                  borderRadius: '18px',
                  textAlign: 'left',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 16px rgba(57,255,20,0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Grid bg */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.02) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', position: 'relative' }}>
                  <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>[01] FITNESS WORKOUT</span>
                  <div style={{ background: 'linear-gradient(90deg, rgba(57,255,20,0.12), rgba(0,242,255,0.12))', padding: '4px 10px', borderRadius: '4px', fontSize: '9px', fontWeight: 900, border: '1px solid rgba(57,255,20,0.25)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#39ff14' }}>🔥</span>
                    <span style={{ color: '#fff' }}>&</span>
                    <span style={{ color: '#00f2ff' }}>⚡</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '8px' }}>30-DAY COMBINED PLAN</span>
                  </div>
                </div>

                {/* Single merged card details */}
                <div style={{
                  background: 'rgba(5,5,15,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🏋️</span>
                    <h3 className="arcade-text" style={{ fontSize: '13px', fontWeight: 900, color: '#ffd700', letterSpacing: '0.5px', margin: 0, textShadow: '0 0 8px rgba(255,215,0,0.3)' }}>
                      Fat Burn & Stamina Improvement in 30 Days
                    </h3>
                  </div>
                  
                  <p style={{ fontSize: '10px', opacity: 0.7, color: '#fff', lineHeight: 1.4, margin: '2px 0' }}>
                    Maximize lipid oxidation and scale your cardiovascular thresholds through progressive interval sprints (squats, pushups, jumping jacks). The ultimate all-in-one body transformation program.
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#39ff14', background: 'rgba(57,255,20,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(57,255,20,0.2)' }}>🔥 HIGH CALORIE BURN</span>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#00f2ff', background: 'rgba(0,242,255,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(0,242,255,0.2)' }}>⚡ CARDIO ENDURANCE</span>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#ffd700', background: 'rgba(255,215,0,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.2)' }}>📅 30-DAY TIMELINE</span>
                  </div>
                </div>
              </motion.div>

              {/* OUTSIDE BUTTON ROW & CALENDAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '-18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                  <div
                    onClick={() => setShowFatBurnCalendar(prev => !prev)}
                    style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(57,255,20,0.08)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.25)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  >
                    📅 {showFatBurnCalendar ? 'HIDE CALENDAR' : '30-DAY CALENDAR'}
                  </div>

                  <button
                    onClick={() => setShowSetupModal(true)}
                    style={{ background: 'linear-gradient(135deg, #39ff14, #00f2ff)', color: '#000', padding: '10px 28px', borderRadius: '20px', border: 'none', fontWeight: 900, fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-gaming)', boxShadow: '0 0 16px rgba(57,255,20,0.35)', transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(57,255,20,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(57, 255, 20, 0.35)'; }}
                  >
                    ⚙️ SETUP WORKOUT
                  </button>
                </div>

                {/* Calendar grid */}
                {showFatBurnCalendar && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(36px, 1fr))', gap: '5px', width: '100%', background: 'rgba(5,5,12,0.9)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(57,255,20,0.25)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ gridColumn: '1 / -1', textAlign: 'left', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#39ff14', letterSpacing: '1px' }}>30-DAY TRANSFORMATION PROGRESS</span>
                      <span style={{ display: 'block', fontSize: '8px', opacity: 0.5 }}>COMPLETION TRACKER & STREAK SYSTEM</span>
                    </div>
                    {progression.fatBurnCalendar?.map((dayObj) => {
                      let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = '#fff', opacity = 1;
                      if (dayObj.status === 'completed') { bg = 'rgba(57,255,20,0.15)'; border = '1px solid #39ff14'; color = '#39ff14'; }
                      else if (dayObj.status === 'current') { bg = 'rgba(0,242,255,0.15)'; border = '1px solid #00f2ff'; color = '#00f2ff'; }
                      else if (dayObj.status === 'missed') { bg = 'rgba(255,68,68,0.1)'; border = '1px solid rgba(255,68,68,0.3)'; color = '#ff4444'; opacity = 0.5; }
                      else { opacity = 0.3; }
                      return (
                        <div key={dayObj.day} style={{ background: bg, border, borderRadius: '5px', padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity, position: 'relative' }}>
                          <span style={{ fontSize: '7px', opacity: 0.6, fontWeight: 700 }}>DAY</span>
                          <span style={{ fontSize: '11px', fontWeight: 900, color }}>{dayObj.day}</span>
                          {dayObj.status === 'completed' && <div style={{ position: 'absolute', top: -3, right: -3, background: '#39ff14', borderRadius: '50%', width: 8, height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={5} color="#000" /></div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* WORLD CUP SPRINT CUSTOMIZER (SINGLE EXERCISE SELECTOR ONLY) */}
          {/* ============================================================ */}
          {playMode === 'worldcup' && (
            <>
              {/* MATCH TYPE SELECTOR REMOVED - NOW IN PROFILE SETTINGS */}
              <div id="worldcup-section" style={{
                width: '100%',
                background: 'rgba(10, 10, 15, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: 'clamp(10px, 2vw, 16px) clamp(10px, 2.5vw, 18px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                {/* SPRINT WORKOUT TYPE SELECTOR (INLINE & OBVIOUS) */}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', fontFamily: 'var(--font-gaming)' }}>
                    <span style={{ width: '5px', height: '5px', background: '#39ff14', borderRadius: '50%', display: 'inline-block' }} />
                    [01] SELECT SPRINT WORKOUT TYPE (SQUATS ACTIVE BY DEFAULT 🦵)
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                    gap: '10px'
                  }}>
                    {[
                      { id: 'squats', label: 'SQUATS', emoji: '🦵' },
                      { id: 'pushups', label: 'PUSHUPS', emoji: '💪' },
                      { id: 'jacks', label: 'JUMPING JACKS', emoji: '🏃' }
                    ].map(m => {
                      const isActive = exerciseMode === m.id;
                      return (
                        <motion.button
                          key={m.id}
                          whileHover={{ scale: 1.02, translateY: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setExerciseMode(m.id)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '12px',
                            background: isActive ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                            color: isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.7)',
                            border: `1.5px solid ${isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.08)'}`,
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: 'var(--font-gaming)',
                            boxShadow: isActive ? '0 4px 12px rgba(57, 255, 20, 0.15)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{m.emoji}</span>
                          <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>{m.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* SPRINT TARGET DISTANCE (INLINE & OBVIOUS) */}
                <div style={{ marginTop: '24px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', fontFamily: 'var(--font-gaming)' }}>
                    <span style={{ width: '5px', height: '5px', background: '#00f2ff', borderRadius: '50%', display: 'inline-block' }} />
                    [02] SELECT TARGET DISTANCE
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '8px'
                  }}>
                    {[
                      { val: 0.2, label: '200M' },
                      { val: 0.4, label: '400M' },
                      { val: 0.6, label: '600M' },
                      { val: 1.0, label: '1 KM' }
                    ].map(preset => {
                      const isActive = targetDistance === preset.val;
                      return (
                        <motion.button
                          key={preset.val}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setTargetDistance(preset.val)}
                          style={{
                            background: isActive ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                            color: isActive ? '#00f2ff' : 'rgba(255,255,255,0.7)',
                            border: `1.5px solid ${isActive ? '#00f2ff' : 'rgba(255,255,255,0.08)'}`,
                            padding: "14px 4px",
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-gaming)',
                            transition: 'all 0.2s ease',
                            boxShadow: isActive ? '0 4px 12px rgba(0, 242, 255, 0.15)' : 'none'
                          }}
                        >
                          {preset.label}
                        </motion.button>
                      );
                    })}
                    {/* Custom input */}
                    <div style={{
                      position: 'relative',
                      background: ![0.2, 0.4, 0.6, 1.0].includes(targetDistance) ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1.5px solid ${![0.2, 0.4, 0.6, 1.0].includes(targetDistance) ? '#00f2ff' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="3"
                        placeholder="MAX 3 KM"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) {
                            const cappedVal = Math.min(3.0, val);
                            setTargetDistance(cappedVal);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 800,
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

                {/* [03] SELECT YOUR ATHLETE */}
                <div className="athlete-selector-container">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', fontFamily: 'var(--font-gaming)', width: '100%', justifyContent: 'flex-start' }}>
                    <span style={{ width: '5px', height: '5px', background: '#39ff14', borderRadius: '50%', display: 'inline-block' }} />
                    [03] SELECT YOUR ATHLETE
                  </div>
                  {(() => {
                    const athletes = [
                      { id: 'messi', name: 'LIONEL MESSI', image: '/arg/arg1.png', country: '🇦🇷 ARG', title: 'THE PLAYMAKER', desc: 'Speedy & Agile. Elite dribbling.', color: '#00a2ff', glow: 'rgba(0, 162, 255, 0.25)', borderGlow: '#00a2ff' },
                      { id: 'ronaldo', name: 'C. RONALDO', image: '/por/Por1.png', country: '🇵🇹 POR', title: 'THE STRIKER', desc: 'Powerful & Explosive. Unstoppable.', color: '#ff3333', glow: 'rgba(255, 51, 51, 0.25)', borderGlow: '#ff3333' },
                      { id: 'neymar', name: 'NEYMAR JR', image: '/bra/bra1.png', country: '🇧🇷 BRA', title: 'THE ARTIST', desc: 'Skillful & Flamboyant. Creative.', color: '#ffea00', glow: 'rgba(255, 234, 0, 0.25)', borderGlow: '#ffea00' }
                    ];
                    
                    const activeCharId = progression.activeCharacter === 'default' || !progression.activeCharacter ? 'ronaldo' : progression.activeCharacter;
                    const activeIndex = athletes.findIndex(a => a.id === activeCharId);
                    const currentAthlete = athletes[activeIndex >= 0 ? activeIndex : 1];
                    
                    const selectAthlete = (index) => {
                      const athlete = athletes[index];
                      setProgression(prev => {
                        const updated = { ...prev, activeCharacter: athlete.id };
                        localStorage.setItem("clashOfCardioProgression", JSON.stringify(updated));
                        return updated;
                      });
                    };
                    
                    const handlePrev = () => {
                      const nextIndex = (activeIndex - 1 + athletes.length) % athletes.length;
                      selectAthlete(nextIndex);
                    };
                    
                    const handleNext = () => {
                      const nextIndex = (activeIndex + 1) % athletes.length;
                      selectAthlete(nextIndex);
                    };
                    
                    return (
                      <>
                        {/* Selector Controls (Left Arrow, Circle Avatar, Right Arrow) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '24px',
                          width: '100%',
                          marginTop: '8px'
                        }}>
                          {/* Left Arrow Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handlePrev}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: currentAthlete.color,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px'
                            }}
                          >
                            <ChevronLeft size={32} style={{ filter: `drop-shadow(0 0 8px ${currentAthlete.color})` }} />
                          </motion.button>

                          {/* Avatar Circle Container */}
                          <div style={{
                            position: 'relative',
                            width: '90px',
                            height: '90px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* Technoring Glow/Pulse */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                              style={{
                                position: 'absolute',
                                inset: '-4px',
                                borderRadius: '50%',
                                border: `1.5px dashed ${currentAthlete.color}`,
                                opacity: 0.6,
                                boxShadow: `0 0 15px ${currentAthlete.glow}`
                              }}
                            />
                            {/* Inner Circle Frame */}
                            <div style={{
                              width: '90px',
                              height: '90px',
                              borderRadius: '50%',
                              background: 'rgba(5, 5, 8, 0.95)',
                              border: `2px solid ${currentAthlete.color}`,
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 0 25px ${currentAthlete.glow}, inset 0 0 12px ${currentAthlete.glow}`
                            }}>
                              <AnimatePresence mode="wait">
                                <motion.img
                                  key={currentAthlete.id}
                                  src={currentAthlete.image}
                                  alt={currentAthlete.name}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1.15 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.25 }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    marginTop: '8px'
                                  }}
                                />
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Right Arrow Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleNext}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: currentAthlete.color,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px'
                            }}
                          >
                            <ChevronRight size={32} style={{ filter: `drop-shadow(0 0 8px ${currentAthlete.color})` }} />
                          </motion.button>
                        </div>

                        {/* Athlete Details & Status Badge */}
                        <div style={{
                          textAlign: 'center',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: currentAthlete.color, letterSpacing: '1px', fontFamily: 'var(--font-gaming)' }}>
                              {currentAthlete.name}
                            </span>
                            <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              {currentAthlete.country}
                            </span>
                          </div>

                          <div style={{ fontSize: '8px', fontWeight: 800, color: currentAthlete.color, opacity: 0.8, letterSpacing: '2px', fontFamily: 'var(--font-gaming)' }}>
                            {currentAthlete.title}
                          </div>

                          <p style={{ fontSize: '10px', opacity: 0.6, maxWidth: '200px', lineHeight: 1.3, margin: '0' }}>
                            {currentAthlete.desc}
                          </p>

                          {/* SELECT PLAYER Badge */}
                          <div style={{
                            background: `${currentAthlete.color}15`,
                            border: `1.5px solid ${currentAthlete.color}`,
                            color: currentAthlete.color,
                            fontSize: '9px',
                            fontWeight: 900,
                            padding: '4px 14px',
                            borderRadius: '20px',
                            marginTop: '8px',
                            letterSpacing: '1.5px',
                            fontFamily: 'var(--font-gaming)',
                            boxShadow: `0 0 10px ${currentAthlete.glow}`
                          }}>
                            SELECT PLAYER
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Sub-actions for Play with Friend */}
                {sprintMatchType === 'friend' && (
                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <motion.button
                        whileHover={{ scale: 1.02, translateY: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          try {
                            const room = await createRoom(user, exerciseMode, targetDistance);
                            setMultiplayerRoomId(room.roomId);
                            setMultiplayerRole('host');
                            setIsLobbyCreator(true);
                            setShowLobbyModal(true);
                          } catch (e) {
                            alert(e.message);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          background: '#39ff14',
                          color: '#000000',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-gaming)',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 6px 16px rgba(57, 255, 20, 0.2)'
                        }}
                      >
                        CREATE ROOM
                      </motion.button>

                      <div style={{ display: 'flex', flex: 1, gap: '5px' }}>
                        <input
                          type="text"
                          placeholder="6-DIGIT CODE"
                          maxLength={6}
                          value={roomCodeInput}
                          onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-gaming)',
                            outline: 'none'
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02, translateY: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            if (roomCodeInput.length !== 6) {
                              alert("Please enter a valid 6-digit room code.");
                              return;
                            }
                            try {
                              const room = await joinRoom(user, roomCodeInput);
                              setMultiplayerRoomId(roomCodeInput);
                              setMultiplayerRole('guest');
                              setIsLobbyCreator(false);
                              setShowLobbyModal(true);
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                          style={{
                            padding: '0 15px',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: '#39ff14',
                            border: '1px solid #39ff14',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-gaming)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          JOIN
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM CONTROLS INLINED (START / MATCHMAKER) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  alignItems: 'center',
                  marginTop: '28px',
                  width: '100%'
                }}>
                  {sprintMatchType === 'ai' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{
                        boxShadow: [
                          "0 0 12px rgba(57, 255, 20, 0.15)",
                          "0 0 22px rgba(57, 255, 20, 0.35)",
                          "0 0 12px rgba(57, 255, 20, 0.15)"
                        ]
                      }}
                      transition={{
                        boxShadow: {
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut"
                        }
                      }}
                      onClick={() => startOnboarding()}
                      style={{
                        background: 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)',
                        color: '#000000',
                        padding: '16px 54px',
                        borderRadius: '30px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-gaming)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '0.5px',
                        transition: 'all 0.25s ease',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      ⚡ START SPRINT MATCH
                    </motion.button>
                  ) : sprintMatchType === 'online' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{
                        boxShadow: [
                          "0 0 12px rgba(57, 255, 20, 0.15)",
                          "0 0 22px rgba(57, 255, 20, 0.35)",
                          "0 0 12px rgba(57, 255, 20, 0.15)"
                        ]
                      }}
                      transition={{
                        boxShadow: {
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut"
                        }
                      }}
                      onClick={() => {
                        setMatchmakerSearching(true);
                        setMatchmakerError(null);
                        setMatchedOpponent(null);
                        setShowLobbyModal(true);

                        let shuffleCount = 0;
                        const shuffleInterval = setInterval(() => {
                          const randIdx = Math.floor(Math.random() * MOCK_OPPONENTS.length);
                          setActiveMockOpponent(MOCK_OPPONENTS[randIdx]);
                          shuffleCount++;

                          if (shuffleCount >= 20) {
                            clearInterval(shuffleInterval);
                            const finalOpponent = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
                            setMatchedOpponent(finalOpponent);
                            setMatchmakerSearching(false);

                            setTimeout(() => {
                              setShowLobbyModal(false);
                              setGameStarted(true);
                            }, 1800);
                          }
                        }, 150);
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)',
                        color: '#000000',
                        padding: '16px 54px',
                        borderRadius: '30px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-gaming)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '0.5px',
                        transition: 'all 0.25s ease',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Users size={14} color="#000" /> FIND OPPONENT
                    </motion.button>
                  ) : (
                    <div style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic', fontFamily: 'var(--font-gaming)' }}>
                      Use the controls above to create or join a private room code.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

      </section>

      {/* ATHLETE HUB & COMPETITIVE LEADERBOARDS */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        padding: '0 5% clamp(40px, 8vh, 80px) 5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        marginTop: '20px'
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          
          {/* competitive Esports Leaderboard */}
          <div className="glass-card" style={{
            background: 'rgba(5, 5, 8, 0.6)',
            border: '1px solid rgba(57, 255, 20, 0.15)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div>
              <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 900, letterSpacing: '1.5px', display: 'block', color: '#fff' }}>GLOBAL CARDIO TIERS</span>
              <span className="arcade-text" style={{ fontSize: '18px', color: '#fff', fontWeight: 900 }}>
                ESPORTS FITNESS LEADERBOARD
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { rank: 1, name: 'CR7_CHAMP', type: 'CARDIO MASTER', level: 25, xp: 15200, isSelf: false },
                { rank: 2, name: 'NEYMAR_JR', type: 'PRO ATHLETE', level: 20, xp: 12450, isSelf: false },
                { rank: 3, name: 'YOU (ATHLETE)', type: 'SPRINTER', level: progression.level, xp: 450 + Math.round((Number(progression.caloriesToday) || 0) * 6), isSelf: true },
                { rank: 4, name: 'JORDAN_CARDIO', type: 'RUNNER', level: 4, xp: 380, isSelf: false },
                { rank: 5, name: 'ALEX_SQUAD', type: 'BEGINNER', level: 3, xp: 290, isSelf: false }
              ].map(leader => (
                <div 
                  key={leader.rank} 
                  className="responsive-leaderboard-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.5fr 1fr 1fr 80px',
                    alignItems: 'center',
                    background: leader.isSelf ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1.5px solid ${leader.isSelf ? '#39ff14' : 'rgba(255, 255, 255, 0.04)'}`,
                    borderRadius: '12px',
                    padding: '10px 16px',
                    boxShadow: 'none'
                  }}
                >
                  <span className="arcade-text rank-text" style={{ fontSize: '12px', fontWeight: 900, color: leader.rank === 1 ? '#ffd700' : leader.rank === 2 ? '#c0c0c0' : leader.isSelf ? '#39ff14' : '#fff' }}>
                    #{leader.rank}
                  </span>
                  <div className="name-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: leader.isSelf ? '#39ff14' : '#fff' }}>
                      {leader.name}
                    </span>
                    {leader.rank <= 2 && <span style={{ fontSize: '10px' }}>👑</span>}
                  </div>
                  <span className="badge-text" style={{ fontSize: '9px', fontWeight: 900, color: leader.isSelf ? '#39ff14' : '#00f2ff', background: leader.isSelf ? 'rgba(57, 255, 20, 0.1)' : 'rgba(0, 242, 255, 0.1)', border: `1px solid ${leader.isSelf ? '#39ff14' : 'rgba(0, 242, 255, 0.2)'}`, padding: '2px 8px', borderRadius: '4px', justifySelf: 'start', letterSpacing: '0.5px' }}>
                    {leader.type}
                  </span>
                  <span className="lvl-text" style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>
                    LVL {leader.level}
                  </span>
                  <span className="xp-text" style={{ fontSize: '11px', fontWeight: 900, textAlign: 'right', fontFamily: 'var(--font-gaming)' }}>
                    {leader.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Setup Modal */}
      {showSetupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(22, 22, 28, 0.95) 0%, rgba(10, 10, 14, 0.98) 100%)',
            border: '1px solid rgba(57, 255, 20, 0.15)',
            borderRadius: '24px',
            padding: 'clamp(20px, 5vw, 40px)',
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(57, 255, 20, 0.05)',
            backdropFilter: 'blur(16px)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowSetupModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center' }}>
              <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: '#39ff14', textShadow: 'none', margin: 0, letterSpacing: '1px' }}>WORKOUT SETUP</h2>
              <p style={{ opacity: 0.6, fontSize: '12px', marginTop: '6px', color: 'rgba(255, 255, 255, 0.7)' }}>Configure your personalized routine</p>
            </div>

            {/* Difficulty */}
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', letterSpacing: '1.5px', fontWeight: 800, marginBottom: '10px' }}>[01] DIFFICULTY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {[
                  { id: 'easy',   label: 'EASY',   reps: 'Squats + Pushups + Jacks × 20 each = 600m' },
                  { id: 'medium', label: 'MEDIUM', reps: 'Squats + Pushups + Jacks × 40 each = 1200m' },
                  { id: 'hard',   label: 'HARD',   reps: 'Squats + Pushups + Jacks × 80 each = 2400m' }
                ].map(diff => {
                  const isDiffActive = difficulty === diff.id;
                  return (
                    <motion.button
                      key={diff.id}
                      onClick={() => setDifficulty(diff.id)}
                      whileHover={{ scale: 1.01, background: isDiffActive ? 'rgba(57, 255, 20, 0.12)' : 'rgba(255,255,255,0.04)' }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        background: isDiffActive ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${isDiffActive ? '#39ff14' : 'rgba(255,255,255,0.08)'}`,
                        color: isDiffActive ? '#39ff14' : 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-gaming)',
                        transition: 'border 0.2s, color 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: isDiffActive ? '0 0 12px rgba(57, 255, 20, 0.15)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.5px' }}>{diff.label}</span>
                      <span style={{ fontSize: '10px', opacity: isDiffActive ? 0.9 : 0.6, fontWeight: 700 }}>{diff.reps}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Fixed Exercises */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', letterSpacing: '1.5px', fontWeight: 800 }}>[02] WORKOUT EXERCISES</div>
                <div style={{ fontSize: '10px', color: '#39ff14', fontWeight: 900, background: 'rgba(57,255,20,0.1)', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(57,255,20,0.3)' }}>FIXED ORDER</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'squats',  label: 'SQUATS',        icon: '🦵', step: 1 },
                  { id: 'pushups', label: 'PUSH-UPS',      icon: '💪', step: 2 },
                  { id: 'jacks',   label: 'JUMPING JACKS', icon: '🏃', step: 3 }
                ].map(item => (
                  <div key={item.id} style={{
                    padding: '12px 8px', borderRadius: '12px', textAlign: 'center',
                    background: 'rgba(57,255,20,0.06)', border: '1.5px solid rgba(57,255,20,0.25)',
                    color: '#39ff14', fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-gaming)'
                  }}>
                    <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '4px' }}>STEP {item.step}</div>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
                    <div>{item.label}</div>
                    <div style={{ fontSize: '9px', color: '#fff', opacity: 0.6, marginTop: '3px' }}>
                      {difficulty === 'hard' ? 80 : difficulty === 'medium' ? 40 : 20} REPS
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,242,255,0.05)', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '16px' }}>⏱️</span>
                <div>
                  <div style={{ fontSize: '10px', color: '#00f2ff', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>60 SECOND REST</div>
                  <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>Automatic rest period between each exercise</div>
                </div>
              </div>
            </div>

            {/* UX Telemetry Summary Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.2px', fontFamily: 'var(--font-gaming)' }}>WORKOUT TELEMETRY SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                  <span style={{ opacity: 0.5 }}>DIFFICULTY:</span>
                  <span style={{ color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>{difficulty.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                  <span style={{ opacity: 0.5 }}>REPS EACH:</span>
                  <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                    {difficulty === 'hard' ? 80 : difficulty === 'medium' ? 40 : 20} REPS
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ opacity: 0.5 }}>TOTAL DISTANCE:</span>
                  <span style={{ color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                    {(difficulty === 'hard' ? 80 : difficulty === 'medium' ? 40 : 20) * 3 * 10}M
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ opacity: 0.5 }}>EST. DURATION:</span>
                  <span style={{ color: '#00f2ff', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                    ~{difficulty === 'hard' ? '20' : difficulty === 'medium' ? '12' : '6'} MINS
                  </span>
                </div>
              </div>
            </div>

            {/* Start Workout Button */}
            <motion.button
              onClick={() => {
                setShowSetupModal(false);
                startOnboarding();
              }}
              disabled={selectedExercises.length !== 3}
              whileHover={selectedExercises.length === 3 ? { scale: 1.02 } : {}}
              whileTap={selectedExercises.length === 3 ? { scale: 0.98 } : {}}
              animate={selectedExercises.length === 3 ? {
                boxShadow: [
                  "0 0 15px rgba(57, 255, 20, 0.3)",
                  "0 0 25px rgba(57, 255, 20, 0.5)",
                  "0 0 15px rgba(57, 255, 20, 0.3)"
                ]
              } : { boxShadow: 'none' }}
              transition={{
                boxShadow: {
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut"
                }
              }}
              style={{
                background: selectedExercises.length === 3 
                  ? 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)' 
                  : 'rgba(255,255,255,0.05)',
                color: selectedExercises.length === 3 ? '#000' : 'rgba(255,255,255,0.3)',
                border: selectedExercises.length === 3 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                padding: '16px',
                borderRadius: '30px',
                fontWeight: 900,
                fontSize: '14px',
                cursor: selectedExercises.length === 3 ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-gaming)',
                marginTop: '6px',
                boxShadow: selectedExercises.length === 3 ? '0 0 15px rgba(57, 255, 20, 0.3)' : 'none',
                letterSpacing: '1px'
              }}
            >
              START WORKOUT ⚡
            </motion.button>
          </div>
        </div>
      )}

      {/* Sprint Workout Match Setup Alert Box / Modal */}
      {showSprintSetupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 2, 5, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
          backdropFilter: 'blur(15px)'
        }}>
          {/* Grid bg */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          <div className="glass-card" style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(5, 5, 8, 0.95)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 40px)',
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 4.5vw, 28px)', color: '#39ff14', textShadow: 'none', margin: 0 }}>MATCH SETUP</h2>
              <p style={{ opacity: 0.6, fontSize: '12px', marginTop: '8px' }}>Configure target distance and workout type</p>
            </div>

            {/* Target Distance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#fff', opacity: 0.6, letterSpacing: '1px', fontWeight: 700 }}>[01] SELECT SPRINT TARGET DISTANCE</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {targetDistance >= 1 ? `${targetDistance} KM` : `${Math.round(targetDistance * 1000)} METERS`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { val: 0.2, label: '200M', sub: '2 MINS' },
                  { val: 0.4, label: '400M', sub: '4 MINS' },
                  { val: 0.6, label: '600M', sub: '6 MINS' },
                  { val: 1.0, label: '1 KM', sub: '10 MINS' }
                ].map(preset => {
                  const isPresetActive = targetDistance === preset.val;
                  return (
                    <button
                      key={preset.val}
                      onClick={() => setTargetDistance(preset.val)}
                      style={{
                        background: isPresetActive ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.02)',
                        color: '#ffffff',
                        border: `1px solid ${isPresetActive ? '#39ff14' : 'rgba(255,255,255,0.06)'}`,
                        padding: "8px 6px",
                        borderRadius: '12px',
                        fontSize: '11px',
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
                      <span>{preset.label}</span>
                      <span style={{ fontSize: '7px', opacity: 0.4 }}>{preset.sub}</span>
                    </button>
                  );
                })}
                {/* Custom input */}
                <div style={{
                  position: 'relative',
                  background: ![0.2, 0.4, 0.6, 1.0].includes(targetDistance) ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${![0.2, 0.4, 0.6, 1.0].includes(targetDistance) ? '#39ff14' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="3"
                    placeholder="MAX 3 KM"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > 0) {
                        const cappedVal = Math.min(3.0, val);
                        setTargetDistance(cappedVal);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      width: '100%',
                      padding: '8px 0',
                      outline: 'none',
                      fontFamily: 'var(--font-gaming)',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Workout Type Selector */}
            <div>
              <div style={{ fontSize: '10px', color: '#fff', opacity: 0.6, letterSpacing: '1px', fontWeight: 700, marginBottom: '12px' }}>
                [02] SELECT SPRINT WORKOUT TYPE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                {['squats', 'pushups', 'jacks'].map(mode => {
                  const label = mode === 'jacks' ? 'JUMPING JACKS' : mode.toUpperCase();
                  const isActive = exerciseMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setExerciseMode(mode)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.02)',
                        color: isActive ? '#39ff14' : '#ffffff',
                        border: `1px solid ${isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.06)'}`,
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'var(--font-gaming)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{label}</span>
                      {isActive && <Zap size={12} fill="#39ff14" color="#39ff14" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Close / Confirm */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowSprintSetupModal(false);
                if (sprintMatchType === 'ai') {
                  startOnboarding();
                }
              }}
              style={{
                background: '#39ff14',
                color: '#000',
                border: 'none',
                padding: '16px',
                borderRadius: '30px',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)',
                boxShadow: '0 8px 24px rgba(57, 255, 20, 0.25)',
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%'
              }}
            >
              {sprintMatchType === 'ai' ? (
                <>
                  <Play size={14} fill="#000" color="#000" /> START SPRINT MATCH
                </>
              ) : (
                'CONFIRM SETTINGS'
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Multiplayer Lobby / Matchmaker Waiting Modal */}
      {showLobbyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 2, 5, 0.96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Subtle tech background grid pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          <div className="glass-card" style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(5, 5, 8, 0.85)',
            border: '1px solid rgba(57, 255, 20, 0.25)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 40px)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 0 50px rgba(57, 255, 20, 0.15)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Header */}
            <div>
              <span style={{
                fontSize: '9px',
                opacity: 0.5,
                fontWeight: 900,
                letterSpacing: '3px',
                display: 'block',
                color: '#fff',
                marginBottom: '8px'
              }}>
                {sprintMatchType === 'online' ? 'REALTIME MATCHMAKING' : 'PRIVATE MULTIPLAYER ROOM'}
              </span>
              <h2 className="arcade-text" style={{
                fontSize: 'clamp(20px, 4.5vw, 28px)',
                color: '#39ff14',
                margin: 0,
                textShadow: '0 0 10px rgba(57, 255, 20, 0.2)'
              }}>
                {sprintMatchType === 'online' ? 'FINDING OPPONENT' : 'LOBBY WAITING ROOM'}
              </h2>
            </div>

            {/* Room Code display (only for friend mode) */}
            {sprintMatchType === 'friend' && multiplayerRoomId && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(57, 255, 20, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onClick={() => {
                navigator.clipboard.writeText(multiplayerRoomId);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(57, 255, 20, 0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                  TAP ROOM CODE TO COPY & SHARE
                </div>
                <div className="arcade-text" style={{ fontSize: '38px', color: '#ffffff', letterSpacing: '4px', fontWeight: 900 }}>
                  {multiplayerRoomId}
                </div>
                {copiedCode && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: '#39ff14',
                    fontWeight: 900
                  }}>
                    COPIED TO CLIPBOARD!
                  </div>
                )}
              </div>
            )}

            {/* Simulated Matchmaker Roulette Search HUD */}
            {sprintMatchType === 'online' && matchmakerSearching && activeMockOpponent && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.05)', border: '2px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  {activeMockOpponent.avatar}
                </div>
                <div className="arcade-text" style={{ fontSize: '20px', color: '#39ff14', textShadow: 'none', letterSpacing: '2px' }}>
                  {activeMockOpponent.flag} {activeMockOpponent.name}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: 700, letterSpacing: '1px' }}>
                  CONNECTING TO FITNESS NETWORKS...
                </div>
                <div className="loader" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#39ff14', animation: 'spin 1s infinite linear', marginTop: '10px' }} />
              </div>
            )}

            {/* Simulated Matchmaker Match Found transition card */}
            {sprintMatchType === 'online' && matchedOpponent && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="arcade-text" style={{ fontSize: '24px', color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.3)', animation: 'bounce 0.5s ease' }}>
                  ⚡ MATCH FOUND! ⚡
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', margin: '15px 0' }}>
                  {/* You */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', border: '2px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                      👤
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{user?.email?.split('@')[0]?.toUpperCase() || 'YOU'}</span>
                    <span style={{ fontSize: '8px', color: '#39ff14', fontWeight: 700 }}>HOST</span>
                  </div>

                  <span className="arcade-text" style={{ fontSize: '20px', opacity: 0.3 }}>VS</span>

                  {/* Opponent */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 242, 255, 0.1)', border: '2px solid #00f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', animation: 'pulse 1s infinite' }}>
                      {matchedOpponent.avatar}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{matchedOpponent.name.toUpperCase()}</span>
                    <span style={{ fontSize: '8px', color: '#00f2ff', fontWeight: 700 }}>{matchedOpponent.flag} GUEST</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic', fontFamily: 'var(--font-gaming)' }}>
                  Starting synced 3D sprint... Get ready!
                </div>
              </div>
            )}

            {/* Matchmaker error */}
            {matchmakerError && (
              <div style={{ color: '#ff3333', fontSize: '12px', fontWeight: 700 }}>
                {matchmakerError}
              </div>
            )}

            {/* Lobby Players List */}
            {lobbyDetails && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, letterSpacing: '1px', textAlign: 'left' }}>
                  CONNECTED PLAYERS
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 50px 1fr',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  {/* Host */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#39ff14' }}>H</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lobbyDetails.hostEmail?.split('@')[0]}
                    </span>
                    <span style={{ fontSize: '8px', color: '#39ff14', fontWeight: 700 }}>HOST</span>
                  </div>

                  {/* VS */}
                  <div className="arcade-text" style={{ fontSize: '14px', opacity: 0.3, fontWeight: 900 }}>
                    VS
                  </div>

                  {/* Guest */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    {lobbyDetails.guestUid ? (
                      <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 242, 255, 0.1)', border: '1px solid #00f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: '#00f2ff' }}>
                            {lobbyDetails.guestUid === 'simulated_ai_pro' ? 'C' : 'G'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lobbyDetails.guestUid === 'simulated_ai_pro' ? 'CR7_CHAMP' : lobbyDetails.guestEmail?.split('@')[0]}
                        </span>
                        <span style={{ fontSize: '8px', color: '#00f2ff', fontWeight: 700 }}>
                          {lobbyDetails.guestUid === 'simulated_ai_pro' ? 'CHAMPION' : 'GUEST'}
                        </span>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}>
                          <span style={{ fontSize: '16px', opacity: 0.2 }}>?</span>
                        </div>
                        <span style={{ fontSize: '10px', opacity: 0.3, fontStyle: 'italic', fontWeight: 700 }}>
                          Waiting...
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {/* Host Start Match Button */}
              {lobbyDetails && isLobbyCreator && (
                <motion.button
                  disabled={!lobbyDetails.guestUid}
                  whileHover={lobbyDetails.guestUid ? { scale: 1.02 } : {}}
                  whileTap={lobbyDetails.guestUid ? { scale: 0.98 } : {}}
                  animate={lobbyDetails.guestUid ? {
                    boxShadow: [
                      "0 0 12px rgba(57, 255, 20, 0.15)",
                      "0 0 22px rgba(57, 255, 20, 0.35)",
                      "0 0 12px rgba(57, 255, 20, 0.15)"
                    ]
                  } : { boxShadow: 'none' }}
                  transition={{
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut"
                    }
                  }}
                  onClick={async () => {
                    const roomRef = doc(db, "sprint_rooms", multiplayerRoomId);
                    await updateDoc(roomRef, {
                      status: 'countdown',
                      updatedAt: serverTimestamp()
                    });
                  }}
                  style={{
                    background: lobbyDetails.guestUid 
                      ? 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    color: lobbyDetails.guestUid ? '#000000' : 'rgba(255, 255, 255, 0.3)',
                    padding: '16px',
                    borderRadius: '30px',
                    border: lobbyDetails.guestUid ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: lobbyDetails.guestUid ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-gaming)',
                    transition: 'background 0.25s, color 0.25s, border 0.25s',
                    letterSpacing: '0.5px'
                  }}
                >
                  START SPRINT MATCH ⚡
                </motion.button>
              )}

              {/* Guest Waiting Indicator */}
              {lobbyDetails && !isLobbyCreator && (
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(57, 255, 20, 0.05)',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                  color: '#39ff14',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-gaming)',
                  animation: 'pulse 2s infinite'
                }}>
                  {lobbyDetails.status === 'ready' ? 'READY! WAITING FOR HOST TO START...' : 'LOBBY CONNECTED, WAITING...'}
                </div>
              )}

              {/* Cancel/Exit button */}
              <button
                onClick={handleLeaveLobby}
                style={{
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '12px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-gaming)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                EXIT LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

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

      <AnimatePresence>
        {showWelcomeOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 8, 0.98)',
              zIndex: 5000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(24px)',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            {/* Grid bg scanning lines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.012) 1px, transparent 1px)',
              backgroundSize: '45px 45px',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            <div style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: '1000px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px'
            }}>
              {/* Header section */}
              <div>
                <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 900, letterSpacing: '3px', color: '#fff', display: 'block', marginBottom: '8px' }}>
                  AI FITNESS PROTOCOL
                </span>
                <h1 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: '#39ff14', textShadow: 'none', margin: 0 }}>
                  WELCOME TO CLASHOFCARDIO
                </h1>
                <p style={{ opacity: 0.8, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', maxWidth: '650px', lineHeight: 1.5 }}>
                  Your webcam becomes a real-time AI fitness tracker. Read the short 5-second guide below to get calibrated and start crushing reps!
                </p>
              </div>

              {/* Split layout: Visual HUD on left, Steps & Countdown on right */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                width: '100%',
                alignItems: 'stretch',
                marginTop: '10px'
              }}>
                {/* Visual HUD Simulator (Left Column) */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(57, 255, 20, 0.15)',
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  minHeight: '340px'
                }}>
                  {/* Cyber corners */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderTop: '2px solid #39ff14', borderLeft: '2px solid #39ff14' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', borderTop: '2px solid #39ff14', borderRight: '2px solid #39ff14' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '12px', borderBottom: '2px solid #39ff14', borderLeft: '2px solid #39ff14' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderBottom: '2px solid #39ff14', borderRight: '2px solid #39ff14' }} />

                  {/* Header text for HUD */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#ff3b30', borderRadius: '50%', animation: 'redDotBlink 1s infinite' }} />
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', fontFamily: 'var(--font-gaming)' }}>
                        LIVE FEED CALIBRATION
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#39ff14', background: 'rgba(57, 255, 20, 0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-gaming)' }}>
                      AI: ACTIVE
                    </span>
                  </div>

                  {/* Simulator Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', flexGrow: 1 }}>
                    {/* SVG Skeleton Viewport */}
                    <div style={{
                      background: 'rgba(5, 5, 8, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <svg width="100%" height="220" viewBox="0 0 100 120" style={{ overflow: 'visible' }}>
                        <defs>
                          <pattern id="hudGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(57, 255, 20, 0.04)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hudGrid)" />
                        
                        {/* Bounding box */}
                        <rect x="5" y="5" width="90" height="110" rx="4" fill="none" stroke="rgba(57, 255, 20, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                        
                        {/* Scanning line inside SVG */}
                        <line x1="5" y1="0" x2="95" y2="0" stroke="#39ff14" strokeWidth="1.5" style={{ opacity: 0.8, animation: 'scanLine 3s infinite linear' }} />
                        
                        {/* Floor Target */}
                        <ellipse cx="50" cy="105" rx="25" ry="6" fill="rgba(57, 255, 20, 0.05)" stroke="rgba(57, 255, 20, 0.3)" strokeWidth="1" strokeDasharray="2 2" />

                        {/* Human Skeleton Elements */}
                        <g style={{ animation: 'squatAnimation 3s infinite ease-in-out' }}>
                          {/* Head */}
                          <circle cx="50" cy="25" r="5" fill="#141419" stroke="#39ff14" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px rgba(57, 255, 20, 0.6))' }} />
                          {/* Torso/Spine */}
                          <line x1="50" y1="30" x2="50" y2="55" stroke="#39ff14" strokeWidth="2.5" />
                          {/* Shoulders */}
                          <line x1="40" y1="35" x2="60" y2="35" stroke="#39ff14" strokeWidth="2" />
                          {/* Left Arm */}
                          <line x1="40" y1="35" x2="32" y2="48" stroke="#39ff14" strokeWidth="2" />
                          <line x1="32" y1="48" x2="25" y2="40" stroke="#39ff14" strokeWidth="2" />
                          {/* Right Arm */}
                          <line x1="60" y1="35" x2="68" y2="48" stroke="#39ff14" strokeWidth="2" />
                          <line x1="68" y1="48" x2="75" y2="40" stroke="#39ff14" strokeWidth="2" />
                          {/* Left Leg */}
                          <line x1="50" y1="55" x2="42" y2="78" stroke="#39ff14" strokeWidth="2.5" />
                          <line x1="42" y1="78" x2="42" y2="105" stroke="#39ff14" strokeWidth="2.5" />
                          {/* Right Leg */}
                          <line x1="50" y1="55" x2="58" y2="78" stroke="#39ff14" strokeWidth="2.5" />
                          <line x1="58" y1="78" x2="58" y2="105" stroke="#39ff14" strokeWidth="2.5" />
                          
                          {/* Joint Tracker Dots */}
                          <circle cx="50" cy="30" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="40" cy="35" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="60" cy="35" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="32" cy="48" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="68" cy="48" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="50" cy="55" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="42" cy="78" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="58" cy="78" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="42" cy="105" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                          <circle cx="58" cy="105" r="1.5" fill="#fff" stroke="#39ff14" strokeWidth="1" />
                        </g>
                      </svg>
                      
                      {/* Calibration Overlay indicators */}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <span style={{ fontSize: '8px', color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)', letterSpacing: '0.5px' }}>TARGET: SQUAT</span>
                        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>JOINT MATCH: 100%</span>
                      </div>

                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(57,255,20,0.1)',
                        border: '1px solid rgba(57,255,20,0.4)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontSize: '7px', color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)', display: 'block', animation: 'pulse 1.5s infinite' }}>
                          FORM: OK
                        </span>
                      </div>
                    </div>

                    {/* Stats & Mini Track */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'space-between' }}>
                      {/* Telemetry panel */}
                      <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                          <span>XP RATE</span>
                          <span style={{ color: '#39ff14' }}>+15 XP</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                          <span>CALORIES RATIO</span>
                          <span style={{ color: '#ffffff' }}>0.45 kcal</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                          <span>SENSOR LATENCY</span>
                          <span style={{ color: '#00ff88' }}>12ms</span>
                        </div>
                      </div>

                      {/* Race simulation track */}
                      <div style={{
                        background: 'rgba(5, 5, 8, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        flexGrow: 1,
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', marginBottom: '2px', display: 'block', fontFamily: 'var(--font-gaming)' }}>
                          1VS1 CHALLENGE
                        </span>
                        
                        {/* Lane 1: Player */}
                        <div style={{ position: 'relative', height: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          {/* Lane line */}
                          <div style={{ position: 'absolute', left: 0, right: 0, top: '8px', height: '1px', background: 'rgba(57,255,20,0.15)' }} />
                          {/* Runner */}
                          <div style={{
                            position: 'absolute',
                            left: '5px',
                            top: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            animation: 'playerRunnerAnimation 6s infinite ease-in-out'
                          }}>
                            <span style={{ fontSize: '8px' }}>🏃</span>
                            <span style={{ fontSize: '6px', fontWeight: 900, color: '#39ff14', fontFamily: 'var(--font-gaming)', whiteSpace: 'nowrap' }}>YOU</span>
                          </div>
                        </div>

                        {/* Lane 2: Opponent */}
                        <div style={{ position: 'relative', height: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          {/* Lane line */}
                          <div style={{ position: 'absolute', left: 0, right: 0, top: '8px', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                          {/* Runner */}
                          <div style={{
                            position: 'absolute',
                            left: '5px',
                            top: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            animation: 'opponentRunnerAnimation 6s infinite linear'
                          }}>
                            <span style={{ fontSize: '8px' }}>👑</span>
                            <span style={{ fontSize: '6px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-gaming)', whiteSpace: 'nowrap' }}>PRO_ATHLETE</span>
                          </div>
                        </div>

                        {/* Mini live race comment */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '7px', color: '#39ff14', fontWeight: 700 }}>YOU LEADING!</span>
                          <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)' }}>SPEED: 4.8m/s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding Info & Action Steps (Right Column) */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  textAlign: 'left'
                }}>
                  {/* Three step cards */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%'
                  }}>
                    {[
                      {
                        step: '🎥 STEP 1',
                        title: 'POSITION WEBCAM',
                        desc: 'Step back 2-3 meters so your full body fits in the camera frame. The AI tracks joints for absolute precision!'
                      },
                      {
                        step: '🏋️ STEP 2',
                        title: 'CHOOSE GAMEPLAY',
                        desc: 'Select customized single-player FITNESS WORKOUTS or compete in our real-time 1vs1 CHALLENGE!'
                      },
                      {
                        step: '📈 STEP 3',
                        title: 'SWEAT & COMPETE',
                        desc: 'Perform real reps to race your runner forward, level up your ranking, and claim victory!'
                      }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#39ff14', letterSpacing: '1px', fontFamily: 'var(--font-gaming)' }}>{item.step}</span>
                        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{item.title}</h3>
                        <p style={{ fontSize: '11px', opacity: 0.65, color: '#fff', lineHeight: 1.4, margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Countdown & Action section */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    {/* Visual Countdown Progress bar */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-gaming)' }}>
                        <span>INITIALIZING...</span>
                        <span>AUTO ENTER IN {welcomeCountdown}S</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${(welcomeCountdown / 5) * 100}%` }}
                          transition={{ ease: 'linear', duration: 1 }}
                          style={{ height: '100%', width: `${(welcomeCountdown / 5) * 100}%`, background: 'linear-gradient(90deg, #39ff14, #00ff88)' }}
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        localStorage.setItem("fitclash_welcome_onboarded_v3", "true");
                        setShowWelcomeOnboarding(false);
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)',
                        color: '#000000',
                        padding: '14px 0',
                        borderRadius: '30px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-gaming)',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(57, 255, 20, 0.2)'
                      }}
                    >
                      SKIP INTRO & CRUSH IT ⚡
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Personal Record (PR) / 1vs1 Challenge recommendation chat box */}
      <AnimatePresence>
        {showPRNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '420px',
              background: 'rgba(5, 5, 12, 0.94)',
              border: '1.5px solid rgba(57, 255, 20, 0.4)',
              borderRadius: '16px',
              padding: '12px 18px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(57, 255, 20, 0.1)',
              zIndex: 1000,
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              textAlign: 'left'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                sessionStorage.setItem("fitclash_seen_pr_recommendation_v1", "true");
                setShowPRNotification(false);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '18px',
                cursor: 'pointer',
                fontWeight: 900,
                transition: 'color 0.2s',
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#39ff14'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span className="arcade-text" style={{ fontSize: '11px', color: '#39ff14', letterSpacing: '1.5px' }}>
                AI COACH
              </span>
            </div>

            {/* Message Body */}
            <p style={{ fontSize: '14px', color: '#fff', opacity: 0.95, lineHeight: 1.45, margin: '2px 0 4px 0', fontWeight: 500 }}>
              Hey champion! Try the **1vs1 Sprint** feature today! Your last highest was <strong style={{ color: '#39ff14' }}>{highestReps} reps</strong>. Try today to make a new **Personal Record (PR)**!
            </p>

            {/* CTA action button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePRChallengeClick}
              style={{
                background: 'linear-gradient(135deg, #39ff14 0%, #00f2ff 100%)',
                color: '#000000',
                border: 'none',
                padding: '11px 18px',
                borderRadius: '20px',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(57, 255, 20, 0.25)',
                letterSpacing: '0.5px',
                marginTop: '2px'
              }}
            >
              CHALLENGE NOW ⚡
            </motion.button>
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
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(110px); }
          100% { transform: translateY(0); }
        }
        @keyframes squatAnimation {
          0%, 100% {
            transform: scaleY(1);
            transform-origin: 50px 105px;
          }
          45%, 55% {
            transform: scaleY(0.65);
            transform-origin: 50px 105px;
          }
        }
        @keyframes playerRunnerAnimation {
          0% { transform: translateX(0); }
          20% { transform: translateX(10px); }
          25% { transform: translateX(45px); }
          45% { transform: translateX(45px); }
          50% { transform: translateX(85px); }
          70% { transform: translateX(85px); }
          75% { transform: translateX(120px); }
          90% { transform: translateX(120px); }
          100% { transform: translateX(0); }
        }
        @keyframes opponentRunnerAnimation {
          0% { transform: translateX(0); }
          90% { transform: translateX(105px); }
          100% { transform: translateX(0); }
        }
        @keyframes redDotBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
