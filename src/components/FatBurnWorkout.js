"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Flame, Award, Zap, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import PositionCalibration from './PositionCalibration';

/* ─── Constants ─────────────────────────────────────────────── */
const EXERCISES = ['squats', 'pushups', 'jacks'];
const EXERCISE_LABELS = { squats: 'SQUATS', pushups: 'PUSH-UPS', jacks: 'JUMPING JACKS' };
const EXERCISE_ICONS  = { squats: '🦵', pushups: '💪', jacks: '🏃' };
const REST_SECS = 60;
const METERS_PER_REP = 10; // Each rep = 10m in the game

const enterFullscreen = () => {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
};
const exitFullscreen = () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) return;
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
};

/* ─── Calorie formula ───────────────────────────────────────── */
const calcCalories = (repsPerEx) => {
  if (!repsPerEx || !Array.isArray(repsPerEx)) return 0;
  const squatsCal = (repsPerEx[0] || 0) * 0.5;
  const pushupsCal = (repsPerEx[1] || 0) * 0.4;
  const jacksCal = (repsPerEx[2] || 0) * 0.2;
  return Math.round(squatsCal + pushupsCal + jacksCal);
};

/* ─── Running Track Component (Side-scrolling perspective road) ─── */
const RunningTrack = ({ progressPercent, activeCharacter, exerciseIndex, isRunning, currentExercise, currentReps, targetReps }) => {
  const runnerPos = Math.min(progressPercent, 100);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 5);
    }, 120);
    return () => clearInterval(interval);
  }, [isRunning]);

  const charKey = (activeCharacter || 'ronaldo').toLowerCase();
  let frames = ['/por/Por1.png', '/por/por2.png', '/por/por3.png', '/por/por4.png', '/por/por6.png'];
  if (charKey === 'messi' || charKey === 'argentina') {
    frames = ['/arg/arg1.png', '/arg/arg2.png', '/arg/arg3.png', '/arg/arg4.png', '/arg/arg6.png'];
  } else if (charKey === 'neymar' || charKey === 'brazil') {
    frames = ['/bra/bra1.png', '/bra/bra2.png', '/bra/bra3.png', '/bra/bra4.png', '/bra/bra6.png'];
  }

  const currentFrameImg = isRunning ? frames[frame] : frames[0];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'linear-gradient(180deg, #06060c 0%, #030308 50%, #0a0a14 100%)',
      overflow: 'hidden'
    }}>
      {/* Stars */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '2px' : '1px',
          height: i % 3 === 0 ? '2px' : '1px',
          background: '#fff',
          opacity: 0.2 + Math.random() * 0.4,
          top: `${Math.random() * 45}%`,
          left: `${Math.random() * 100}%`,
          borderRadius: '50%'
        }} />
      ))}

      {/* Solid Road Track (similar to 1v1 Phaser layout) */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '24%',
        background: '#1d1e22',
        borderTop: '5px solid #39ff14', // Glowing green/cyan borders
        boxShadow: '0 -4px 20px rgba(57, 255, 20, 0.25)',
        zIndex: 5
      }} />

      {/* Track center dash marks */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: 0, right: 0,
        height: '4px',
        backgroundImage: 'linear-gradient(90deg, #ffffff 50%, transparent 50%)',
        backgroundSize: '100px 100%',
        opacity: 0.45,
        zIndex: 6
      }} />

      {/* Track bottom edge boundary */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: 0, right: 0,
        height: '3px',
        background: 'rgba(255, 255, 255, 0.08)',
        zIndex: 6
      }} />

      {/* Distance progress percentage markers */}
      {[0, 25, 50, 75, 100].map(pct => (
        <div key={pct} style={{
          position: 'absolute',
          bottom: '26%',
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.35)',
          fontFamily: 'var(--font-gaming)',
          fontWeight: 900,
          zIndex: 6
        }}>{pct}%</div>
      ))}

      {/* Finish line */}
      <div style={{
        position: 'absolute',
        right: '6%',
        bottom: '2%',
        width: '10px',
        height: '20%',
        background: 'repeating-linear-gradient(180deg, #ffffff 0px, #ffffff 6px, #000000 6px, #000000 12px)',
        opacity: 0.9,
        zIndex: 7,
        borderLeft: '2px solid #ffffff',
        borderRight: '2px solid #ffffff'
      }} />
      <div style={{
        position: 'absolute',
        right: '4%',
        bottom: '26%',
        fontSize: '10px',
        color: '#ffd700',
        fontFamily: 'var(--font-gaming)',
        fontWeight: 900,
        zIndex: 7,
        letterSpacing: '1px',
        textShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
      }}>FINISH</div>

      {/* Player character centered on our solid road */}
      <motion.div
        animate={{ left: `${5 + (runnerPos / 100) * 85}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: '8%',
          width: 'clamp(46px, 9vw, 76px)',
          height: 'clamp(68px, 13vw, 106px)',
          transform: 'translateX(-50%)',
          zIndex: 8
        }}
      >
        <img
          src={currentFrameImg}
          alt="Player"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: isRunning ? 'drop-shadow(0 0 8px rgba(57,255,20,0.65))' : 'none'
          }}
        />

        {/* Running dust effect */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '32px',
            height: '6px',
            background: 'radial-gradient(ellipse, rgba(57,255,20,0.45) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
        )}
      </motion.div>

      {/* Current exercise badge with integrated sky-level reps counter */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(5,5,15,0.85)',
        border: '1.5px solid rgba(57,255,20,0.35)',
        borderRadius: '20px',
        padding: '6px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        zIndex: 15
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{EXERCISE_ICONS[currentExercise]}</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#39ff14', fontFamily: 'var(--font-gaming)', letterSpacing: '1px' }}>
            {EXERCISE_LABELS[currentExercise]}
          </span>
          {isRunning && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 6px #39ff14', animation: 'pulse 1s infinite' }} />
          )}
        </div>
        {currentReps !== undefined && (
          <div className="arcade-text" style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', letterSpacing: '1px', lineHeight: 1.1 }}>
            {currentReps} <span style={{ fontSize: '9px', opacity: 0.5 }}>/ {targetReps} REPS</span>
          </div>
        )}
      </div>

      {/* Sky Progress track bar */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '3px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '1.5px',
        overflow: 'hidden',
        zIndex: 10
      }}>
        <motion.div
          animate={{ width: `${runnerPos}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #39ff14, #00f2ff)', boxShadow: '0 0 6px rgba(57,255,20,0.5)', borderRadius: '1.5px' }}
        />
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────── */
const FatBurnWorkout = ({
  difficulty = 'easy',
  isCameraReady,
  activeCharacter,
  onComplete,
  onExerciseChange
}) => {
  const targetRepsPerExercise = difficulty === 'hard' ? 80 : difficulty === 'medium' ? 40 : 20;
  const totalRepsNeeded = targetRepsPerExercise * 3; // 3 exercises always
  const totalDistanceM = totalRepsNeeded * METERS_PER_REP;

  const [phase, setPhase] = useState('waiting'); // waiting | ready | calibration | countdown | exercise | rest | finished
  const [exIndex, setExIndex] = useState(0);       // 0=squats 1=pushups 2=jacks
  const [repsPerEx, setRepsPerEx] = useState([0, 0, 0]);
  const [totalReps, setTotalReps] = useState(0);
  const [restTimer, setRestTimer] = useState(REST_SECS);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [accuracy, setAccuracy] = useState(95);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [combo, setCombo] = useState(0);
  const [trackerProgress, setTrackerProgress] = useState({ percent: 0, message: 'Launching Neural Core...' });
  const [positionWarning, setPositionWarning] = useState(null);
  const [characterImg, setCharacterImg] = useState(null);

  const prevRepsRef = useRef(0);
  const maxComboRef = useRef(0);
  const boostRef = useRef(null);

  const currentExercise = EXERCISES[exIndex];

  /* Load character sprite */
  useEffect(() => {
    const charMap = {
      argentina: '/arg/arg1.png',
      brazil: '/bra/bra1.png',
      portugal: '/por/por1.png',
      ronaldo: '/por/por1.png',
      messi: '/arg/arg1.png',
      neymar: '/bra/bra1.png',
      default: '/arg/arg1.png'
    };
    const key = (activeCharacter || 'default').toLowerCase();
    setCharacterImg(charMap[key] || charMap['default']);
  }, [activeCharacter]);

  /* Tracker init progress */
  useEffect(() => {
    const handler = (e) => setTrackerProgress(e.detail);
    window.addEventListener('tracker-init-status', handler);
    return () => window.removeEventListener('tracker-init-status', handler);
  }, []);

  /* Camera ready → advance to ready */
  useEffect(() => {
    if (isCameraReady && phase === 'waiting') setPhase('ready');
  }, [isCameraReady, phase]);

  /* Audio */
  useEffect(() => {
    boostRef.current = new Audio('/sounds/boost.mp3');
    boostRef.current.volume = 0.35;
    return () => exitFullscreen();
  }, []);

  /* Notify parent of exercise change */
  useEffect(() => {
    if (onExerciseChange) onExerciseChange(exIndex);
  }, [exIndex, onExerciseChange]);

  /* Start time tracking */
  useEffect(() => {
    if (phase === 'exercise' && !startTime) setStartTime(Date.now());
  }, [phase, startTime]);

  /* Countdown logic */
  const startCountdown = useCallback(() => {
    setPhase('countdown');
    let t = 3;
    setCountdown(t);
    const iv = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t === 0) { clearInterval(iv); setPhase('exercise'); }
    }, 1000);
  }, []);

  /* Rest timer logic */
  useEffect(() => {
    if (phase !== 'rest') return;
    if (restTimer <= 0) { startCountdown(); return; }
    const iv = setInterval(() => setRestTimer(t => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase, restTimer, startCountdown]);

  /* Position warning from raw pose */
  useEffect(() => {
    const handler = (e) => {
      const pose = e.detail;
      if (!pose?.keypoints) { setPositionWarning('NO BODY DETECTED'); return; }
      const get = (n) => pose.keypoints.find(k => k.name === n);
      const thresh = 0.3;
      const isPush = currentExercise === 'pushups';
      const shouldersOk = isPush || (get('left_shoulder')?.score > thresh || get('right_shoulder')?.score > thresh);
      const hipsOk = isPush || (get('left_hip')?.score > thresh || get('right_hip')?.score > thresh);
      if (!shouldersOk && !hipsOk) setPositionWarning('NO BODY DETECTED');
      else if (!shouldersOk) setPositionWarning('⬆ SHOW UPPER BODY');
      else if (!hipsOk) setPositionWarning('↔ STEP BACK — HIPS MISSING');
      else setPositionWarning(null);
    };
    window.addEventListener('raw-pose', handler);
    return () => window.removeEventListener('raw-pose', handler);
  }, [currentExercise]);

  /* Pose rep counting */
  useEffect(() => {
    if (phase !== 'exercise') return;
    const handler = (e) => {
      const { reps: eventReps } = e.detail;
      if (eventReps <= prevRepsRef.current) return;
      prevRepsRef.current = eventReps;

      if (boostRef.current) {
        boostRef.current.currentTime = 0;
        boostRef.current.play().catch(() => {});
      }

      const msgs = ['PERFECT REP!', 'NICE FORM!', 'KEEP GOING!', 'GREAT PACE!', 'POWER UP!'];
      setFeedbackMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setFeedbackKey(k => k + 1);
      setAccuracy(Math.floor(92 + Math.random() * 7));
      setCombo(c => { const n = c + 1; maxComboRef.current = Math.max(maxComboRef.current, n); return n; });

      setRepsPerEx(prev => {
        const next = [...prev];
        next[exIndex] = next[exIndex] + 1;
        const thisExReps = next[exIndex];
        const newTotal = next.reduce((a, b) => a + b, 0);
        setTotalReps(newTotal);

        if (thisExReps >= targetRepsPerExercise) {
          // Exercise complete
          if (exIndex < 2) {
            // Move to rest before next exercise
            setExIndex(i => i + 1);
            setRestTimer(REST_SECS);
            setPhase('rest');
            setCombo(0);
            prevRepsRef.current = 0;
          } else {
            // All 3 exercises done!
            setDuration(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
            setPhase('finished');
            confetti({
              particleCount: 200,
              spread: 90,
              origin: { y: 0.55 },
              colors: ['#39ff14', '#00f2ff', '#ffd700', '#ffffff']
            });
          }
        }
        return next;
      });
    };

    window.addEventListener('pose-update', handler);
    return () => window.removeEventListener('pose-update', handler);
  }, [phase, exIndex, targetRepsPerExercise, startTime]);

  /* ── Derived values ── */
  const thisExReps = repsPerEx[exIndex] || 0;
  const currentDistanceM = totalReps * METERS_PER_REP;
  const progressPercent = Math.min((currentDistanceM / totalDistanceM) * 100, 100);
  const isRunning = phase === 'exercise';

  /* ──── FINISHED SCREEN ──── */
  if (phase === 'finished') {
    const calories = calcCalories(repsPerEx);
    const xp = totalReps * 12 + (difficulty === 'hard' ? 300 : difficulty === 'medium' ? 150 : 80);
    const score = (accuracy * 0.4) + (totalReps * 0.5) - (duration * 0.1);
    let rank = 'C RANK', rankColor = '#aaa';
    if (score > 200) { rank = 'GOD MODE'; rankColor = '#ff00ff'; }
    else if (score > 150) { rank = 'S RANK'; rankColor = '#ffd700'; }
    else if (score > 100) { rank = 'A RANK'; rankColor = '#39ff14'; }
    else if (score > 60) { rank = 'B RANK'; rankColor = '#00f2ff'; }

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#020208', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, color: '#fff', padding: '20px' }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(57,255,20,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.02) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', maxWidth: '520px', width: '95%', position: 'relative', zIndex: 2 }}>

          {/* Rank badge */}
          <motion.div
            animate={{ boxShadow: [`0 0 20px ${rankColor}`, `0 0 40px ${rankColor}`, `0 0 20px ${rankColor}`] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: `rgba(${rankColor === '#ffd700' ? '255,215,0' : '57,255,20'}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: `2px solid ${rankColor}` }}
          >
            <Award size={36} color={rankColor} />
          </motion.div>

          <h2 className="arcade-text" style={{ fontSize: 'clamp(28px, 6vw, 44px)', color: rankColor, marginBottom: '4px', textShadow: `0 0 20px ${rankColor}` }}>{rank}</h2>
          <p style={{ opacity: 0.5, fontSize: '12px', marginBottom: '24px', letterSpacing: '1px' }}>FAT BURN & STAMINA — {difficulty.toUpperCase()} COMPLETE</p>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'CALORIES BURNED', value: `${calories} KCAL`, color: '#ff6b6b', icon: '🔥' },
              { label: 'TOTAL REPS', value: `${totalReps}`, color: '#fff', icon: '💪' },
              { label: 'DISTANCE RAN', value: `${currentDistanceM}M`, color: '#39ff14', icon: '🏃' },
              { label: 'ACCURACY', value: `${accuracy}%`, color: '#39ff14', icon: '🎯' },
              { label: 'DURATION', value: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, color: '#fff', icon: '⏱' },
              { label: 'XP EARNED', value: `+${xp}`, color: '#ffd700', icon: '⭐' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>{stat.icon} {stat.label}</div>
                <div className="arcade-text" style={{ fontSize: '16px', color: stat.color, fontWeight: 900 }}>{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Per-exercise breakdown */}
          <div style={{ background: 'rgba(5,5,15,0.7)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '1px', marginBottom: '12px', fontFamily: 'var(--font-gaming)' }}>EXERCISE BREAKDOWN</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {EXERCISES.map((ex, i) => (
                <div key={ex} style={{ flex: 1, textAlign: 'center', background: 'rgba(57,255,20,0.05)', borderRadius: '10px', padding: '10px 4px', border: '1px solid rgba(57,255,20,0.15)' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{EXERCISE_ICONS[ex]}</div>
                  <div style={{ fontSize: '9px', color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)', marginBottom: '2px' }}>{EXERCISE_LABELS[ex]}</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{repsPerEx[i]}</div>
                  <div style={{ fontSize: '8px', opacity: 0.4 }}>REPS</div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              exitFullscreen();
              if (onComplete) {
                onComplete({
                  reps: totalReps,
                  calories,
                  xp,
                  accuracy,
                  duration,
                  rank,
                  isFatBurn: true,
                  caloriesBurned: calories,
                  xpGained: xp
                });
              }
            }}
            style={{
              background: `linear-gradient(135deg, ${rankColor}, #00f2ff)`,
              color: '#000',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '30px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'var(--font-gaming)',
              boxShadow: `0 0 25px ${rankColor}50`,
              letterSpacing: '1px'
            }}
          >
            CLAIM REWARDS & EXIT 🚀
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ──── MAIN RENDER ──── */
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#020208', color: '#fff', overflow: 'hidden' }}>

      {/* ── WAITING (camera init) ── */}
      {phase === 'waiting' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,2,8,0.97)', zIndex: 95, backdropFilter: 'blur(20px)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(57,255,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '400px', width: '90%', textAlign: 'center', padding: '40px 30px', background: 'rgba(5,5,12,0.9)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '20px', boxShadow: '0 0 40px rgba(57,255,20,0.12)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(57,255,20,0.08)', border: '2px solid rgba(57,255,20,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#39ff14', animation: 'spin 1.5s linear infinite' }} />
              <Activity size={24} color="#39ff14" />
            </div>
            <div style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '3px', marginBottom: '8px' }}>NEURAL TRACKING SYSTEM</div>
            <h2 className="arcade-text" style={{ fontSize: '22px', color: '#39ff14', margin: '0 0 16px' }}>INITIALIZING</h2>
            <div className="arcade-text" style={{ fontSize: '44px', color: '#fff', margin: '0 0 8px' }}>
              {trackerProgress.percent}<span style={{ fontSize: '22px', color: '#39ff14' }}>%</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
              <motion.div animate={{ width: `${trackerProgress.percent}%` }} transition={{ duration: 0.3 }} style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 10px #39ff14', borderRadius: '3px' }} />
            </div>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: 0, fontWeight: 700 }}>{trackerProgress.message}</p>
          </div>
        </div>
      )}

      {/* ── READY ── */}
      {phase === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,2,8,0.96)', zIndex: 95, backdropFilter: 'blur(25px)', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(57,255,20,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.025) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 2, maxWidth: '480px', width: '95%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(57,255,20,0.4)', boxShadow: '0 0 20px rgba(57,255,20,0.2)' }}>
              <ShieldCheck size={30} color="#39ff14" />
            </div>
            <h2 className="arcade-text" style={{ fontSize: 'clamp(22px, 5vw, 30px)', marginBottom: '8px' }}>TRACKER <span style={{ color: '#39ff14' }}>READY</span></h2>
            <p style={{ opacity: 0.5, fontSize: '12px', marginBottom: '24px' }}>
              {difficulty.toUpperCase()} MODE — {targetRepsPerExercise} reps × 3 exercises = {totalRepsNeeded} total reps / {totalDistanceM}m
            </p>

            {/* Workout plan preview */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', justifyContent: 'center' }}>
              {EXERCISES.map((ex, i) => (
                <div key={ex} style={{ flex: 1, background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '12px', padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{EXERCISE_ICONS[ex]}</div>
                  <div style={{ fontSize: '10px', color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)', marginBottom: '4px' }}>{EXERCISE_LABELS[ex]}</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>{targetRepsPerExercise}</div>
                  <div style={{ fontSize: '8px', opacity: 0.4 }}>REPS</div>
                  <div style={{ fontSize: '8px', color: '#00f2ff', marginTop: '4px', fontWeight: 700 }}>{targetRepsPerExercise * METERS_PER_REP}M</div>
                  {i < 2 && <div style={{ fontSize: '8px', color: '#ffd700', marginTop: '2px' }}>+ 60s REST</div>}
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { enterFullscreen(); setPhase('calibration'); }}
              style={{ background: 'linear-gradient(135deg, #39ff14, #00f2ff)', color: '#000', border: 'none', padding: '16px 48px', borderRadius: '30px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-gaming)', boxShadow: '0 0 25px rgba(57,255,20,0.4)', letterSpacing: '1px' }}
            >
              START WORKOUT ⚡
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* ── CALIBRATION ── */}
      {phase === 'calibration' && (
        <PositionCalibration mode={currentExercise} onCalibrated={startCountdown} onSkip={startCountdown} />
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,2,8,0.92)', zIndex: 96 }}>
          <div style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '3px', marginBottom: '16px', fontFamily: 'var(--font-gaming)' }}>
            {EXERCISE_ICONS[currentExercise]} {EXERCISE_LABELS[currentExercise]} — {targetRepsPerExercise} REPS
          </div>
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="arcade-text"
            style={{ fontSize: 'clamp(80px, 25vw, 180px)', color: '#39ff14', filter: 'drop-shadow(0 0 40px rgba(57,255,20,0.5))' }}
          >
            {countdown}
          </motion.div>
        </div>
      )}

      {/* ── REST ── */}
      {phase === 'rest' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,2,8,0.96)', zIndex: 95, backdropFilter: 'blur(20px)', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,242,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.02) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <Heart size={36} color="#00f2ff" style={{ margin: '0 auto 16px', display: 'block' }} />
            <motion.h2
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="arcade-text"
              style={{ fontSize: 'clamp(28px, 6vw, 44px)', color: '#00f2ff', marginBottom: '12px' }}
            >
              REST
            </motion.h2>

            {/* Circular countdown */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
              <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,242,255,0.1)" strokeWidth="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#00f2ff" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - restTimer / REST_SECS)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px #00f2ff)' }}
                />
              </svg>
              <div className="arcade-text" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff' }}>
                {restTimer}
              </div>
            </div>

            {/* Completed exercise */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              {EXERCISES.slice(0, exIndex).map(ex => (
                <div key={ex} style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '10px', color: '#39ff14', fontWeight: 900, fontFamily: 'var(--font-gaming)' }}>
                  ✓ {EXERCISE_LABELS[ex]}
                </div>
              ))}
            </div>

            <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '24px' }}>
              UP NEXT: <strong style={{ color: '#00f2ff' }}>{EXERCISE_ICONS[currentExercise]} {EXERCISE_LABELS[currentExercise]}</strong>
            </p>
            <button onClick={() => setRestTimer(0)} style={{ background: 'transparent', border: '1px solid rgba(0,242,255,0.4)', color: '#00f2ff', padding: '10px 28px', borderRadius: '30px', cursor: 'pointer', fontFamily: 'var(--font-gaming)', fontWeight: 900, fontSize: '12px' }}>
              SKIP REST
            </button>
          </motion.div>
        </div>
      )}

      {/* ── EXERCISE GAME VIEW ── */}
      {(phase === 'exercise' || phase === 'rest') && (
        <>
          {/* Full-screen running track */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RunningTrack
              progressPercent={progressPercent}
              activeCharacter={activeCharacter}
              exerciseIndex={exIndex}
              isRunning={isRunning}
              currentExercise={currentExercise}
              currentReps={thisExReps}
              targetReps={targetRepsPerExercise}
            />
          </div>

          {/* HUD — top left: decreased size workout queue */}
          <div style={{
            position: 'absolute', top: '10px', left: '10px', zIndex: 30,
            background: 'rgba(5,5,15,0.85)', border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '10px', padding: '6px 10px', minWidth: '120px',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: '7.5px', opacity: 0.5, letterSpacing: '1px', fontWeight: 900, marginBottom: '6px', fontFamily: 'var(--font-gaming)' }}>QUEUE</div>
            {EXERCISES.map((ex, i) => {
              const isDone = i < exIndex;
              const isNow = i === exIndex;
              return (
                <div key={ex} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '3px 5px', borderRadius: '4px', marginBottom: '2px',
                  background: isNow ? 'rgba(57,255,20,0.08)' : 'transparent',
                  border: isNow ? '1px solid rgba(57,255,20,0.25)' : '1px solid transparent',
                  opacity: isDone ? 0.35 : 1
                }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: isDone ? '#39ff14' : isNow ? '#39ff14' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '7px', color: isDone || isNow ? '#000' : '#fff', fontWeight: 900
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '8.5px', fontWeight: 800, color: isNow ? '#39ff14' : '#fff', fontFamily: 'var(--font-gaming)', lineHeight: 1.1 }}>{EXERCISE_LABELS[ex]}</div>
                    <div style={{ fontSize: '7.5px', opacity: 0.6, lineHeight: 1 }}>{repsPerEx[i]}/{targetRepsPerExercise}</div>
                  </div>
                  {isNow && <div style={{ marginLeft: 'auto', fontSize: '6px', color: '#39ff14', border: '1px solid rgba(57,255,20,0.4)', padding: '0.5px 3px', borderRadius: '2px', fontWeight: 900 }}>NOW</div>}
                </div>
              );
            })}
          </div>

          {/* HUD — top right: compact live stats */}
          <div style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 30,
            background: 'rgba(5,5,15,0.85)', border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '10px', padding: '6px 10px', minWidth: '120px',
            backdropFilter: 'blur(8px)', textAlign: 'right'
          }}>
            <div style={{ fontSize: '7.5px', opacity: 0.5, letterSpacing: '1px', marginBottom: '6px', fontFamily: 'var(--font-gaming)' }}>LIVE STATS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'DIST', value: `${currentDistanceM}m`, color: '#39ff14' },
                { label: 'REPS', value: `${totalReps}/${totalRepsNeeded}`, color: '#fff' },
                { label: 'CALORIES', value: `${calcCalories(repsPerEx)} KCAL`, color: '#ff6b6b' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '7.5px', opacity: 0.5, fontWeight: 700 }}>{s.label}</span>
                  <span className="arcade-text" style={{ fontSize: '10px', color: s.color, fontWeight: 900 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Position warning - sleek top-center floating banner */}
          <AnimatePresence>
            {positionWarning && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  position: 'absolute',
                  top: '90px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255, 60, 0, 0.9)',
                  border: '1.5px solid #ff4400',
                  borderRadius: '20px',
                  padding: '6px 18px',
                  fontSize: '10px',
                  fontWeight: 900,
                  color: '#fff',
                  zIndex: 40,
                  textAlign: 'center',
                  boxShadow: '0 0 15px rgba(255, 60, 0, 0.4)',
                  letterSpacing: '0.5px',
                  pointerEvents: 'none'
                }}
              >
                ⚠ {positionWarning} — ADJUST POSITION
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating rep feedback animation centered high over the action space */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                key={feedbackKey}
                initial={{ opacity: 0, scale: 0.7, y: 30 }}
                animate={{ opacity: 1, scale: 1.15, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8 }}
                style={{
                  position: 'absolute',
                  top: '30%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#00f2ff',
                  textShadow: '0 0 15px rgba(0, 242, 255, 0.8)',
                  fontWeight: 900,
                  fontSize: '22px',
                  fontFamily: 'var(--font-gaming)',
                  pointerEvents: 'none',
                  zIndex: 35
                }}
              >
                {feedbackMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default FatBurnWorkout;
