"use client";
import React, { useEffect, useRef, useState, memo } from 'react';

const FitnessRace = ({ mode, isCameraReady }) => {
  const gameRef = useRef(null);
  const [winnerState, setWinnerState] = useState(null);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting');
  const [countdown, setCountdown] = useState(5);
  
  // Refs for DOM updates to bypass React re-renders
  const playerDistanceUITextRef = useRef(null);
  const aiDistanceUITextRef = useRef(null);

  const gameStateRef = useRef('waiting');
  const winnerRef = useRef(null);
  const playerDistanceRef = useRef(0);
  const targetDistanceRef = useRef(0);
  const aiDistanceRef = useRef(0);
  const previousRepsRef = useRef(0);
  const finishLineDistance = 15000;

  useEffect(() => {
    if (gameRef.current) return;
    gameRef.current = 'loading';
    
    let game;
    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;
      
      if (gameRef.current === null) return;

      const config = {
        type: Phaser.WEBGL, // Force WebGL for performance
        parent: 'phaser-game',
        transparent: true,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%'
        },
        physics: {
          default: 'arcade',
          arcade: { debug: false }
        },
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      };

      let player;
      let ai;
      let playerBall;
      let aiBall;
      let scene;
      const playerStartX = 200;
      const aiStartX = 200;

      function preload() {
        this.load.image('background', '/race_bg.png');
        this.load.image('player', '/ronaldo.png');
        this.load.image('ai', '/neymar.png');
      }

      function create() {
        scene = this;
        
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background').setOrigin(0, 0);
        this.background.setScrollFactor(0); 

        // Pitch lines
        this.pitchLines = this.add.graphics();
        this.pitchLines.lineStyle(4, 0xffffff, 0.5);
        this.pitchLines.beginPath();
        this.pitchLines.moveTo(0, window.innerHeight - 250);
        this.pitchLines.lineTo(window.innerWidth * 10, window.innerHeight - 250);
        this.pitchLines.strokePath();

        this.scale.on('resize', onResize, this);

        // Players & Balls
        player = this.add.sprite(playerStartX, window.innerHeight - 200, 'player');
        player.setScale(0.3);
        playerBall = this.add.circle(playerStartX + 40, window.innerHeight - 180, 10, 0xffffff);
        playerBall.setStrokeStyle(2, 0x000000);
        
        ai = this.add.sprite(aiStartX, window.innerHeight - 350, 'ai');
        ai.setScale(0.3);
        ai.setAlpha(0.8);
        aiBall = this.add.circle(aiStartX + 40, window.innerHeight - 330, 10, 0xffffff);
        aiBall.setStrokeStyle(2, 0x000000);

        // Finish signs
        this.finishLine = this.add.rectangle(finishLineDistance + playerStartX, window.innerHeight / 2, 50, window.innerHeight, 0xffffff, 0.5);
        this.add.text(finishLineDistance + playerStartX, window.innerHeight - 150, 'GOAL!', { 
            fontSize: '64px', 
            fontFamily: 'Arial', 
            color: '#fff', 
            backgroundColor: '#00cc00',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.player = player;
        this.ai = ai;
        
        this.movePlayer = () => {
            if (gameStateRef.current !== 'playing' || winnerRef.current) return;
            targetDistanceRef.current += 1000; 
            
            // Speed burst effect
            this.tweens.add({
                targets: player,
                scale: 0.35,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut'
            });

            // Ball kick effect
            this.tweens.add({
                targets: playerBall,
                x: playerBall.x + 80,
                y: playerBall.y - 30,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        };

        this.restart = () => {
            playerDistanceRef.current = 0;
            targetDistanceRef.current = 0;
            aiDistanceRef.current = 0;
            player.x = playerStartX;
            ai.x = aiStartX;
            winnerRef.current = null;
            setWinnerState(null);
            gameStateRef.current = 'ready';
            setGameStateDisplay('ready');
            if (playerDistanceUITextRef.current) playerDistanceUITextRef.current.innerText = '0';
            if (aiDistanceUITextRef.current) aiDistanceUITextRef.current.innerText = '0';
        };
      }

      function onResize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.main.setSize(width, height);
        if (this.background) {
          this.background.setSize(width, height);
        }
        if (this.pitchLines) {
           this.pitchLines.clear();
           this.pitchLines.lineStyle(4, 0xffffff, 0.5);
           this.pitchLines.beginPath();
           this.pitchLines.moveTo(0, height - 250);
           this.pitchLines.lineTo(width * 10, height - 250);
           this.pitchLines.strokePath();
        }
        if (this.finishLine) {
          this.finishLine.y = height / 2;
        }
      }

      // To avoid updating DOM every frame, only update if value changes
      let lastRenderedPlayerDist = -1;
      let lastRenderedAiDist = -1;

      function update(time, delta) {
        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        aiDistanceRef.current += 0.35 * delta; 

        // Smoothly interpolate player distance towards target
        const lerpFactor = 0.05;
        playerDistanceRef.current += (targetDistanceRef.current - playerDistanceRef.current) * lerpFactor;
        
        if (targetDistanceRef.current > 0) {
            playerDistanceRef.current += 0.1 * delta;
            targetDistanceRef.current += 0.1 * delta;
        }

        player.x = playerStartX + playerDistanceRef.current;
        ai.x = aiStartX + aiDistanceRef.current;

        // Running "Bob" animation logic
        const bobAmount = 10;
        const bobFreq = 0.01;
        player.y = (this.scale.height - 200) + Math.sin(time * bobFreq) * bobAmount;
        ai.y = (this.scale.height - 350) + Math.sin(time * bobFreq * 1.1) * bobAmount;
        
        // Ball logic - dribbling
        if (!this.tweens.isTweening(playerBall)) {
            playerBall.x = player.x + 40;
            playerBall.y = player.y + 20 + Math.abs(Math.sin(time * bobFreq * 2)) * 10;
        }
        aiBall.x = ai.x + 40;
        aiBall.y = ai.y + 20 + Math.abs(Math.sin(time * bobFreq * 2.2)) * 10;

        player.angle = 5 + Math.sin(time * 0.02) * 2;
        ai.angle = 5 + Math.sin(time * 0.022) * 2;

        const camX = player.x - 400;
        this.cameras.main.scrollX = camX;

        if (this.background) {
          this.background.tilePositionX = camX * 0.5; // Parallax
        }

        // DOM UI Updates - bypassed React Re-render
        const pDist = Math.floor(playerDistanceRef.current / 100);
        const aDist = Math.floor(aiDistanceRef.current / 100);
        
        if (pDist !== lastRenderedPlayerDist) {
            if (playerDistanceUITextRef.current) playerDistanceUITextRef.current.innerText = pDist;
            lastRenderedPlayerDist = pDist;
        }
        if (aDist !== lastRenderedAiDist) {
            if (aiDistanceUITextRef.current) aiDistanceUITextRef.current.innerText = aDist;
            lastRenderedAiDist = aDist;
        }

        // Check for winner
        if (playerDistanceRef.current >= finishLineDistance && !winnerRef.current) {
            winnerRef.current = 'PLAYER';
            setWinnerState('PLAYER');
            gameStateRef.current = 'finished';
            setGameStateDisplay('finished');
        } else if (aiDistanceRef.current >= finishLineDistance && !winnerRef.current) {
            winnerRef.current = 'AI';
            setWinnerState('AI');
            gameStateRef.current = 'finished';
            setGameStateDisplay('finished');
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

  useEffect(() => {
    if (isCameraReady && gameStateRef.current === 'waiting') {
      gameStateRef.current = 'ready';
      setGameStateDisplay('ready');
    }
  }, [isCameraReady]);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      const { reps } = e.detail;
      if (reps > previousRepsRef.current) {
        previousRepsRef.current = reps;
        if (gameRef.current && gameRef.current.scene.scenes[0]) {
          gameRef.current.scene.scenes[0].movePlayer();
        }
      }
    };

    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, []);

  const startCountdown = () => {
    gameStateRef.current = 'countdown';
    setGameStateDisplay('countdown');
    let timer = 3; // Reduced from 5s to 3s for better UX
    setCountdown(timer);
    
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        gameStateRef.current = 'playing';
        setGameStateDisplay('playing');
      }
    }, 1000);
  };

  const handleRestart = () => {
    if (gameRef.current && gameRef.current.scene.scenes[0]) {
        gameRef.current.scene.scenes[0].restart();
    }
  };

  return (
    <div id="phaser-game" style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 1,
      overflow: 'hidden',
      background: '#050505'
    }}>
      {/* Race Progress UI */}
      <div className="arcade-text" style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
        padding: '15px 30px',
        borderRadius: '20px',
        border: '2px solid var(--accent)'
      }}>
        <div style={{ color: 'var(--accent)', fontSize: '24px' }}>RACE PROGRESS</div>
        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ color: '#fff' }}>YOU: <span ref={playerDistanceUITextRef}>0</span>m</div>
          <div style={{ color: '#ff0055' }}>AI: <span ref={aiDistanceUITextRef}>0</span>m</div>
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>EXERCISE: {mode.toUpperCase()}</div>
      </div>

      {/* Camera Waiting Overlay */}
      {gameStateDisplay === 'waiting' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
          <div className="arcade-text" style={{ color: 'var(--accent)', fontSize: '24px' }}>INITIALIZING TRACK...</div>
        </div>
      )}

      {/* Tap to Start Overlay */}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
          <button className="glow-btn" onClick={startCountdown} style={{ padding: '20px 60px', fontSize: '32px' }}>READY TO RACE?</button>
          <p className="arcade-text" style={{ marginTop: '20px', color: '#fff' }}>GET IN POSITION FOR {mode.toUpperCase()}</p>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: '120px', color: 'var(--accent)' }}>{countdown}</div>
          <div className="arcade-text" style={{ fontSize: '24px', color: '#fff' }}>ON YOUR MARKS!</div>
        </div>
      )}

      {/* Winner Overlay */}
      {gameStateDisplay === 'finished' && (
        <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(0,0,0,0.85)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 100
        }}>
            <h2 className="arcade-text" style={{ fontSize: '64px', color: winnerState === 'PLAYER' ? 'var(--accent)' : '#ff0055', marginBottom: '10px' }}>
                {winnerState === 'PLAYER' ? 'YOU WIN!' : 'AI WINS!'}
            </h2>
            <p className="arcade-text" style={{ fontSize: '24px', marginBottom: '40px' }}>GREAT WORKOUT!</p>
            <button className="glow-btn" onClick={handleRestart} style={{ padding: '15px 40px' }}>RACE AGAIN</button>
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
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '5px' }}>HOW TO PLAY:</div>
        <div>Each {mode.slice(0,-1)} = SPEED BOOST & DRIBBLE</div>
        <div>Reach the GOAL first!</div>
      </div>
    </div>
  );
};

export default memo(FitnessRace);
