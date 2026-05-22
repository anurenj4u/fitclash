"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

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

const exitFullscreen = () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) return;
  if (document.exitFullscreen) {
    document.exitFullscreen().catch((err) => console.log("Exit fullscreen error:", err));
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const FlappyFitness = ({ poseData, mode, isCameraReady }) => {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting'); // UI state
  const [countdown, setCountdown] = useState(5);
  
  // Refs for Phaser logic to avoid stale closures
  const gameStateRef = useRef('waiting'); 
  const isGameOverRef = useRef(false);
  const previousRepsRef = useRef(0);
  const [trackerProgress, setTrackerProgress] = useState({ percent: 0, message: 'Launching Neural Core...' });

  useEffect(() => {
    const handleProgress = (e) => {
      const { percent, message } = e.detail;
      setTrackerProgress({ percent, message });
    };
    window.addEventListener('tracker-init-status', handleProgress);
    return () => window.removeEventListener('tracker-init-status', handleProgress);
  }, []);


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
          arcade: {
            gravity: { y: 1000 },
            debug: false
          }
        },
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      };

      let bird;
      let pipes;
      let scene;
      let cursors;
      let scoreText;
      let gameVelocity = -200;
      let pipeTimer;

      function preload() {
        this.load.image('player', '/ronaldo.png');
      }

      function create() {
        scene = this;
        pipes = this.physics.add.group();

        // Create Player (Ronaldo)
        bird = this.add.sprite(100, window.innerHeight / 2, 'player');
        bird.setScale(0.15); // Adjust scale for flappy game
        
        this.physics.add.existing(bird);
        bird.body.setCollideWorldBounds(true);
        bird.body.setCircle(30);
        
        // Start paused
        this.physics.pause();
        bird.body.setAllowGravity(false);

        // Input for testing
        cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', flap);

        // Pipe spawning (initially stopped)
        pipeTimer = this.time.addEvent({
          delay: 2000,
          callback: spawnPipes,
          callbackScope: this,
          loop: true,
          paused: true
        });

        // Collision
        this.physics.add.collider(bird, pipes, hitPipe, null, this);

        this.flap = flap;
        this.startGame = () => {
            console.log("Phaser: Starting Game");
            this.physics.resume();
            bird.body.setAllowGravity(true);
            pipeTimer.paused = false;
        };
        this.restart = () => {
            scene.scene.restart();
            setScore(0);
            setIsGameOverState(false);
            isGameOverRef.current = false;
            gameStateRef.current = 'ready';
            setGameStateDisplay('ready');
        };
      }

      function flap() {
        if (gameStateRef.current !== 'playing' || isGameOverRef.current) return;
        bird.body.setVelocityY(-400);
        
        // Tilt animation
        scene.tweens.add({
          targets: bird,
          angle: -20,
          duration: 100,
          yoyo: true,
          ease: 'Power1'
        });
      }

      function spawnPipes() {
        if (isGameOverRef.current || gameStateRef.current !== 'playing') return;

        const gap = 250;
        const minHeight = 100;
        const maxHeight = window.innerHeight - gap - minHeight;
        const pipeY = Phaser.Math.Between(minHeight, maxHeight);

        // Top Pipe
        const topPipe = scene.add.rectangle(window.innerWidth + 50, pipeY - gap/2 - 400, 60, 800, 0x00f2ff, 1);
        topPipe.setStrokeStyle(3, 0xffffff);
        pipes.add(topPipe);
        topPipe.body.setAllowGravity(false);
        topPipe.body.setVelocityX(gameVelocity);

        // Bottom Pipe
        const bottomPipe = scene.add.rectangle(window.innerWidth + 50, pipeY + gap/2 + 400, 60, 800, 0x00f2ff, 1);
        bottomPipe.setStrokeStyle(3, 0xffffff);
        pipes.add(bottomPipe);
        bottomPipe.body.setAllowGravity(false);
        bottomPipe.body.setVelocityX(gameVelocity);

        // Score Trigger (invisible sensor)
        const sensor = scene.add.rectangle(window.innerWidth + 80, pipeY, 10, gap, 0x000000, 0);
        pipes.add(sensor);
        sensor.body.setAllowGravity(false);
        sensor.body.setVelocityX(gameVelocity);
        sensor.isSensor = true;
      }

      function hitPipe(b, p) {
        if (p.isSensor) {
            p.destroy();
            setScore(prev => prev + 1);
            return;
        }
        
        this.physics.pause();
        bird.setAlpha(0.5);
        isGameOverRef.current = true;
        setIsGameOverState(true);
        gameStateRef.current = 'gameover';
        setGameStateDisplay('gameover');
        pipeTimer.remove();
      }

      function update() {
        if (isGameOverRef.current || gameStateRef.current !== 'playing') return;

        // Rotation based on velocity
        if (bird.body.velocity.y > 0) {
          bird.angle = Math.min(bird.angle + 2, 90);
        }

        // Clean up pipes
        pipes.getChildren().forEach(pipe => {
          if (pipe.x < -100) pipe.destroy();
        });

        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            flap();
        }
      }

      game = new Phaser.Game(config);
      gameRef.current = game;
    };

    initPhaser();

    return () => {
      exitFullscreen();
      if (gameRef.current && typeof gameRef.current === 'object' && gameRef.current.destroy) {
        gameRef.current.destroy(true);
      }
      gameRef.current = null;
    };
  }, []);

  // Update gameState when camera is ready
  useEffect(() => {
    if (isCameraReady && gameStateRef.current === 'waiting') {
      gameStateRef.current = 'ready';
      setGameStateDisplay('ready');
    }
  }, [isCameraReady]);

  // Listen for pose updates globally
  useEffect(() => {
    const handlePoseUpdate = (e) => {
      const { reps } = e.detail;
      if (reps > previousRepsRef.current) {
        setReps(reps);
        previousRepsRef.current = reps;
        if (gameRef.current && gameRef.current.scene.scenes[0]) {
          gameRef.current.scene.scenes[0].flap();
        }
      }
    };
    
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, []);

  const startCountdown = () => {
    gameStateRef.current = 'countdown';
    setGameStateDisplay('countdown');
    let timer = 5;
    setCountdown(timer);
    
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        gameStateRef.current = 'playing';
        setGameStateDisplay('playing');
        if (gameRef.current && gameRef.current.scene.scenes[0]) {
            gameRef.current.scene.scenes[0].startGame();
        }
      }
    }, 1000);
  };

  const handleRestart = () => {
    if (gameRef.current && gameRef.current.scene.scenes[0]) {
        gameRef.current.scene.scenes[0].restart();
    }
    setScore(0);
    setIsGameOverState(false);
    isGameOverRef.current = false;
    gameStateRef.current = 'ready';
    setGameStateDisplay('ready');
  };

  return (
    <div 
      id="phaser-game" 
      onClick={() => {
        if (typeof window !== 'undefined' && !document.fullscreenElement && !document.webkitFullscreenElement) {
          enterFullscreen();
        }
      }}
      style={{ width: '100vw', height: '100dvh', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
    >
      <div className="score-panel arcade-text" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', width: 'auto', display: 'flex', gap: '40px', zIndex: 10 }}>
        <div style={{ color: 'var(--accent)' }}>SCORE: {score}</div>
        <div style={{ color: '#fff' }}>REPS: {reps}</div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>MODE: {mode.toUpperCase()}</div>
      </div>

      {/* Camera Waiting Overlay */}
      {gameStateDisplay === 'waiting' && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(2, 2, 5, 0.96)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 95, 
          backdropFilter: 'blur(20px)',
          padding: '20px'
        }}>
          {/* Neon grid scan background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          {/* Central Glassmorphic Dashboard Card */}
          <div className="glass-card" style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '450px',
            width: '100%',
            padding: '40px 30px',
            background: 'rgba(5, 5, 8, 0.85)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)',
            textAlign: 'center'
          }}>
            {/* Spinning Neon Core Badge */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(57, 255, 20, 0.08)',
              border: '2px solid rgba(57, 255, 20, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)',
              position: 'relative'
            }}>
              <div className="loader" style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: '#39ff14',
                animation: 'spin 1.5s infinite linear'
              }} />
              <Activity size={24} color="#39ff14" style={{ filter: 'drop-shadow(0 0 5px #39ff14)' }} />
            </div>

            <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 900, letterSpacing: '3px', display: 'block', color: '#fff', marginBottom: '8px' }}>NEURAL TRACKING SYSTEM</span>
            <h2 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.3)', margin: 0 }}>
              INITIALIZING ENGINE
            </h2>

            {/* Glowing Percentage */}
            <div className="arcade-text" style={{ fontSize: '48px', color: '#ffffff', margin: '20px 0 10px 0', fontWeight: 900 }}>
              {trackerProgress.percent}<span style={{ color: '#39ff14', fontSize: '24px' }}>%</span>
            </div>

            {/* Neon Progress Bar */}
            <div style={{ 
              height: '6px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '3px', 
              overflow: 'hidden', 
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <motion.div 
                animate={{ width: `${trackerProgress.percent}%` }}
                transition={{ duration: 0.3 }}
                style={{ 
                  height: '100%', 
                  background: '#39ff14', 
                  boxShadow: '0 0 12px #39ff14',
                  borderRadius: '3px'
                }}
              />
            </div>

            {/* Dynamic Step Text */}
            <p className="hud-text" style={{ 
              fontSize: '12px', 
              color: '#fff', 
              opacity: 0.8,
              margin: 0,
              fontWeight: 700,
              minHeight: '18px',
              letterSpacing: '0.5px'
            }}>
              {trackerProgress.message}
            </p>
          </div>
        </div>
      )}

      {/* Tap to Start Overlay */}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
          <button className="glow-btn" onClick={() => { enterFullscreen(); startCountdown(); }} style={{ padding: '20px 60px', fontSize: '32px' }}>TAP TO START</button>
          <p className="arcade-text" style={{ marginTop: '20px', color: '#fff' }}>GET READY IN FRONT OF THE CAMERA</p>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: '120px', color: 'var(--accent)' }}>{countdown}</div>
          <div className="arcade-text" style={{ fontSize: '24px', color: '#fff' }}>PREPARE YOUR {mode.toUpperCase()}!</div>
        </div>
      )}

      {isGameOverState && (
        <div style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 100
        }}>
            <h2 className="arcade-text" style={{ fontSize: '48px', color: '#ff0055', marginBottom: '20px' }}>GAME OVER</h2>
            <p className="arcade-text" style={{ fontSize: '24px', marginBottom: '40px' }}>FINAL SCORE: {score}</p>
            <button className="glow-btn" onClick={handleRestart} style={{ padding: '15px 40px' }}>RETRY</button>
        </div>
      )}

      {/* Instructions Overlay */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        background: 'rgba(0,0,0,0.5)', 
        padding: '15px', 
        borderRadius: '10px',
        border: '1px solid var(--accent)',
        fontSize: '14px',
        pointerEvents: 'none'
      }}>
        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '5px' }}>HOW TO PLAY:</div>
        <div>Each 1 {mode.slice(0,-1)} = 1 FLAP</div>
        <div>Avoid the neon barriers!</div>
      </div>
    </div>
  );
};

export default FlappyFitness;
