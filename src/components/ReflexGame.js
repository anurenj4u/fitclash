"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import confetti from 'canvas-confetti';

const ReflexGame = ({ mode, isCameraReady }) => {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting'); // waiting, ready, countdown, playing, finished
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const { user } = useAuth();
  
  const gameStateRef = useRef('waiting');
  const previousRepsRef = useRef(0);
  const scoreRef = useRef(0);
  const repsRef = useRef(0);

  // Sync state to refs for Phaser
  useEffect(() => {
    gameStateRef.current = gameStateDisplay;
  }, [gameStateDisplay]);

  // Fetch highest score (Personal Best) from Firestore
  useEffect(() => {
    const fetchHighest = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "userStats", `${user.uid}_reflex_${mode}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHighestScore(docSnap.data().highestScore || 0);
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchHighest();
  }, [user, mode]);

  // Update gameState when camera/tracker is ready
  useEffect(() => {
    if (isCameraReady && gameStateDisplay === 'waiting') {
      setGameStateDisplay('ready');
    }
  }, [isCameraReady, gameStateDisplay]);

  // Handle countdown and game timer
  useEffect(() => {
    let timer;
    if (gameStateDisplay === 'playing') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleEndGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStateDisplay]);

  // End workout, update PB if needed
  const handleEndGame = async () => {
    setGameStateDisplay('finished');
    const finalScore = scoreRef.current;
    if (user && finalScore > highestScore) {
      try {
        const docRef = doc(db, "userStats", `${user.uid}_reflex_${mode}`);
        await setDoc(docRef, { highestScore: finalScore }, { merge: true });
        setHighestScore(finalScore);
      } catch (e) {
        console.error("Error saving highest score:", e);
      }
    }
    // Final celebratory confetti burst
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  };

  useEffect(() => {
    if (gameRef.current) return;
    gameRef.current = 'loading';
    
    let game;
    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;
      
      if (gameRef.current === null) return;

      const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-game',
        transparent: true,
        physics: {
          default: 'arcade',
          arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      };

      let balls;
      let goal;
      let scene;
      let feedbackText;
      let keeper;

      function preload() {
        this.load.image('keeper', '/neymar.png');
        this.load.image('football', '/football.png');
      }

      function create() {
        scene = this;
        balls = this.physics.add.group();
        
        // Grass Pitch (Bottom)
        const grass = this.add.rectangle(0, window.innerHeight - 200, window.innerWidth, 200, 0x050510, 0.4).setOrigin(0);
        this.add.line(0, window.innerHeight - 200, 0, 0, window.innerWidth, 0, 0x39ff14, 0.3).setOrigin(0);

        // Dynamic UI based on Mode
        let goalWidth = 500;
        let goalHeight = 250;
        let goalColor = 0x39ff14;

        if (mode === 'squats') {
          goalWidth = 350;
          goalHeight = 180;
          goalColor = 0xffff00;
        } else if (mode === 'jacks') {
          goalWidth = window.innerWidth - 100;
          goalHeight = 300;
          goalColor = 0x00f2ff;
        }

        const goalX = window.innerWidth / 2;
        const goalY = 180;

        // Draw Net
        const netGraphics = this.add.graphics();
        netGraphics.lineStyle(1, 0xffffff, 0.2);
        const netStep = 20;
        for (let gx = goalX - goalWidth/2; gx <= goalX + goalWidth/2; gx += netStep) {
          netGraphics.lineBetween(gx, goalY - goalHeight/2, gx, goalY + goalHeight/2);
        }
        for (let gy = goalY - goalHeight/2; gy <= goalY + goalHeight/2; gy += netStep) {
          netGraphics.lineBetween(goalX - goalWidth/2, gy, goalX + goalWidth/2, gy);
        }

        // Crossbar and Posts with Neon Glow
        goal = this.add.rectangle(goalX, goalY, goalWidth, goalHeight, 0xffffff, 0.03);
        goal.setStrokeStyle(8, 0x39ff14);
        this.physics.add.existing(goal, true);

        // Keeper (Neymar)
        keeper = this.add.sprite(goalX, goalY + goalHeight/2 - 40, 'keeper');
        keeper.setScale(0.16);
        this.physics.add.existing(keeper);
        keeper.body.setCollideWorldBounds(true);
        keeper.body.setBounce(1, 1);
        keeper.body.setVelocityX(300);

        feedbackText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 50, 'READY FOR KICK-OFF!', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '36px',
          color: '#39ff14',
          fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        // Overlap goal
        this.physics.add.overlap(balls, goal, (g, b) => {
          b.destroy();
          setScore((prev) => {
            const next = prev + 1;
            scoreRef.current = next;
            return next;
          });
          showFeedback("GOAL!!!", "#39ff14");
          // Confetti burst
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.35 }
          });
        }, null, this);

        // Overlap keeper
        this.physics.add.overlap(balls, keeper, (k, b) => {
          b.destroy();
          showFeedback("SAVED!", "#ff007f");
        }, null, this);

        this.kickBall = function() {
          if (gameStateRef.current !== 'playing') return;
          const x = window.innerWidth / 2;
          const y = window.innerHeight - 150;
          
          // Use loaded football image instead of circle
          const ball = scene.physics.add.sprite(x, y, 'football');
          ball.setScale(0.15);
          balls.add(ball);
          
          let speed = 1200;
          let targetX = Phaser.Math.Between(goalX - goalWidth/2 + 30, goalX + goalWidth/2 - 30);
          scene.physics.moveTo(ball, targetX, goalY, speed);
          
          // Rotate ball as it flies
          scene.tweens.add({
            targets: ball,
            angle: 360,
            scale: 0.05,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => {
              // Destroy ball after time if it didn't trigger overlap
              scene.time.delayedCall(100, () => {
                if (ball.active) ball.destroy();
              });
            }
          });
        };
      }

      function showFeedback(text, color) {
        feedbackText.setText(text);
        feedbackText.setColor(color);
        feedbackText.setAlpha(1);
        feedbackText.setScale(1.6);
        scene.tweens.add({
          targets: feedbackText,
          scale: 1,
          alpha: { from: 1, to: 0 },
          duration: 1200,
          ease: 'Power2'
        });
      }

      function update(time, delta) {
        if (gameStateRef.current !== 'playing') {
          if (keeper && keeper.body) keeper.body.setVelocityX(0);
          return;
        }
        if (keeper && keeper.body) {
          const currentScore = scoreRef.current;
          const speed = 250 + (currentScore * 25);
          if (keeper.body.velocityX === 0) keeper.body.setVelocityX(speed);
          if (keeper.x > window.innerWidth / 2 + 180) keeper.body.setVelocityX(-speed);
          if (keeper.x < window.innerWidth / 2 - 180) keeper.body.setVelocityX(speed);
        }
      }

      game = new Phaser.Game(config);
      gameRef.current = game;
    };

    initPhaser();

    return () => {
      if (gameRef.current && typeof gameRef.current === 'object' && gameRef.current.destroy) {
        gameRef.current.destroy(true);
      }
      gameRef.current = null;
    };
  }, []);

  // Listen for pose updates globally
  useEffect(() => {
    const handlePoseUpdate = (e) => {
      if (gameStateDisplay !== 'playing') return;
      const { reps: eventReps } = e.detail;
      if (eventReps > previousRepsRef.current) {
        previousRepsRef.current = eventReps;
        setReps((prev) => {
          const next = prev + 1;
          repsRef.current = next;
          return next;
        });
        if (gameRef.current && gameRef.current.scene.scenes[0]) {
          gameRef.current.scene.scenes[0].kickBall();
        }
      }
    };
    
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, [gameStateDisplay]);

  const startCountdown = () => {
    setGameStateDisplay('countdown');
    let timer = 3;
    setCountdown(timer);
    
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        setGameStateDisplay('playing');
      }
    }, 1000);
  };

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
      
      {/* Top HUD Display */}
      <div className="score-panel arcade-text" style={{ 
        position: 'absolute',
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: 'auto', 
        display: 'flex', 
        gap: '40px', 
        zIndex: 10,
        padding: '15px 30px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '16px',
        border: '1px solid var(--accent)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ color: 'var(--accent)' }}>GOALS: {score}</div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ color: '#fff' }}>REPS: {reps}</div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ color: timeLeft <= 10 ? 'var(--danger)' : '#ffcc00' }}>
          TIME: {timeLeft}S
        </div>
      </div>

      {/* Camera Waiting Overlay */}
      {gameStateDisplay === 'waiting' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, backdropFilter: 'blur(12px)' }}>
          <div className="loader" style={{ marginBottom: '20px' }}></div>
          <div className="arcade-text" style={{ color: 'var(--accent)', fontSize: '24px', textShadow: '0 0 10px var(--accent)' }}>INITIALIZING CAMERA...</div>
          <p className="hud-text" style={{ marginTop: '10px', opacity: 0.7 }}>Align your full body in the camera frame</p>
        </div>
      )}

      {/* Tap to Start Overlay */}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)' }}>
          <h2 className="arcade-text" style={{ fontSize: '38px', marginBottom: '25px', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
            SHOOTOUT <span style={{ color: 'var(--accent)' }}>READY</span>
          </h2>
          <button className="glow-btn pulse-glow" onClick={startCountdown} style={{ padding: '20px 50px', fontSize: '26px' }}>
            START WORKOUT ⚽
          </button>
          <p className="hud-text" style={{ marginTop: '20px', color: '#fff', opacity: 0.6 }}>Every complete rep kicks the ball past Neymar!</p>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 5, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: '150px', color: 'var(--accent)', filter: 'drop-shadow(0 0 35px var(--accent))' }}>{countdown}</div>
          <div className="arcade-text" style={{ fontSize: '20px', color: '#fff', marginTop: '10px' }}>PREPARE YOUR {mode.toUpperCase()}!</div>
        </div>
      )}

      {/* Game Finished Overlay */}
      {gameStateDisplay === 'finished' && (
        <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(2, 2, 5, 0.95)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(15px)'
        }}>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '600px', width: '90%' }}>
            <h2 className="arcade-text" style={{ fontSize: '50px', color: 'var(--accent)', marginBottom: '10px', textShadow: '0 0 20px var(--accent)' }}>SHOOTOUT ENDED</h2>
            <p className="hud-text" style={{ opacity: 0.6, marginBottom: '25px' }}>FANTASTIC EFFORT! YOU SHIELDED THE PITCH!</p>
            
            <div className="glass-card" style={{ marginBottom: '35px', padding: '30px 40px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ opacity: 0.5, fontSize: '11px', letterSpacing: '1px' }}>GOALS SCORED</p>
                  <p className="arcade-text" style={{ fontSize: '32px', color: 'var(--accent)' }}>{score}</p>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div>
                  <p style={{ opacity: 0.5, fontSize: '11px', letterSpacing: '1px' }}>TOTAL REPS</p>
                  <p className="arcade-text" style={{ fontSize: '32px', color: '#fff' }}>{reps}</p>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div>
                  <p style={{ opacity: 0.5, fontSize: '11px', letterSpacing: '1px' }}>CALORIES</p>
                  <p className="arcade-text" style={{ fontSize: '32px', color: 'var(--secondary)' }}>{Math.floor(reps * 1.5 + score * 0.5 + 15)}</p>
                </div>
              </div>

              {highestScore > 0 && (
                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🏆</span>
                  <p className="hud-text" style={{ fontSize: '12px', color: '#ffcc00', fontWeight: 'bold' }}>
                    {score >= highestScore ? 'NEW PERSONAL BEST!' : `PERSONAL BEST: ${highestScore} GOALS`}
                  </p>
                </div>
              )}
            </div>

            <button className="glow-btn" onClick={() => window.location.reload()} style={{ padding: '18px 50px', fontSize: '18px' }}>PLAY AGAIN</button>
          </motion.div>
        </div>
      )}

      {/* Instructions Overlay */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        background: 'rgba(0,0,0,0.85)', 
        padding: '15px 20px', 
        borderRadius: '12px',
        border: '1px solid var(--accent)',
        fontSize: '13px',
        pointerEvents: 'none',
        zIndex: 5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '6px', fontFamily: 'var(--font-gaming)', letterSpacing: '1px' }}>HOW TO SCORE:</div>
        <div style={{ opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div>🏃 1 {mode === 'jacks' ? 'Jumping Jack' : mode.toUpperCase().slice(0,-1)} = 1 KICK</div>
          <div>🧤 Beat goalkeeper Neymar to score a goal!</div>
          <div>⏱️ Score as many as possible in 60s</div>
        </div>
      </div>
    </div>
  );
};

export default ReflexGame;
