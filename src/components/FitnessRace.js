"use client";
import React, { useEffect, useRef, useState, memo } from 'react';

const FitnessRace = ({ mode, isCameraReady }) => {
  const gameRef = useRef(null);
  const [winnerState, setWinnerState] = useState(null);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting');
  const [countdown, setCountdown] = useState(3);

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
        type: Phaser.WEBGL,
        parent: 'phaser-game',
        transparent: true,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%'
        },
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: { preload, create, update }
      };

      let player, ai, playerBall, aiBall, scene;
      const playerStartX = 200;

      // ── Responsive helpers ──────────────────────────
      const getScale = () => {
        const w = window.innerWidth;
        if (w < 480) return 0.12;
        if (w < 768) return 0.17;
        return 0.27;
      };
      const getBallR  = () => window.innerWidth < 480 ? 5 : window.innerWidth < 768 ? 7 : 10;
      const getPlayerY = h => h - Math.round(h * 0.18);
      const getAiY     = h => h - Math.round(h * 0.42);
      const getPitchY  = h => h - Math.round(h * 0.22);
      const getCamOff  = () => window.innerWidth < 480 ? 140 : window.innerWidth < 768 ? 240 : 400;
      // ───────────────────────────────────────────────

      function preload() {
        this.load.image('background', '/race_bg.png');
        this.load.image('player', '/ronaldo.png');
        this.load.image('ai', '/neymar.png');
      }

      function drawPitchLine(W, H) {
        this.pitchLines.clear();
        this.pitchLines.lineStyle(3, 0xffffff, 0.35);
        this.pitchLines.beginPath();
        this.pitchLines.moveTo(0, getPitchY(H));
        this.pitchLines.lineTo(W * 10, getPitchY(H));
        this.pitchLines.strokePath();
      }

      function create() {
        scene = this;
        const W = this.scale.width;
        const H = this.scale.height;
        const spr = getScale();
        const br  = getBallR();

        // Background
        this.background = this.add.tileSprite(0, 0, W, H, 'background').setOrigin(0, 0);
        this.background.setScrollFactor(0);

        // Pitch line
        this.pitchLines = this.add.graphics();
        drawPitchLine.call(this, W, H);

        this.scale.on('resize', onResize, this);

        // Player (Ronaldo)
        player = this.add.sprite(playerStartX, getPlayerY(H), 'player');
        player.setScale(spr);
        playerBall = this.add.circle(playerStartX + 28, getPlayerY(H) + 12, br, 0xffffff);
        playerBall.setStrokeStyle(2, 0x222222);

        // AI (Neymar) — runs on the lane above
        ai = this.add.sprite(playerStartX, getAiY(H), 'ai');
        ai.setScale(spr);
        ai.setAlpha(0.85);
        aiBall = this.add.circle(playerStartX + 28, getAiY(H) + 12, br, 0xffffff);
        aiBall.setStrokeStyle(2, 0x222222);

        // Finish line
        const goalFontSize = window.innerWidth < 480 ? '28px' : '56px';
        this.finishLine = this.add.rectangle(
          finishLineDistance + playerStartX, H / 2, 50, H, 0xffffff, 0.5
        );
        this.add.text(
          finishLineDistance + playerStartX, H - Math.round(H * 0.12), 'GOAL!', {
            fontSize: goalFontSize, fontFamily: 'Arial Black, Arial',
            color: '#fff', backgroundColor: '#00cc00',
            padding: { x: 14, y: 7 }
          }
        ).setOrigin(0.5);

        this.player = player;
        this.ai = ai;

        this.movePlayer = () => {
          if (gameStateRef.current !== 'playing' || winnerRef.current) return;
          targetDistanceRef.current += 1000;
          this.tweens.add({ targets: player, scale: spr * 1.15, duration: 100, yoyo: true, ease: 'Back.easeOut' });
          this.tweens.add({ targets: playerBall, x: playerBall.x + 55, y: playerBall.y - 22, duration: 140, yoyo: true, ease: 'Sine.easeInOut' });
        };

        this.restart = () => {
          playerDistanceRef.current = 0;
          targetDistanceRef.current = 0;
          aiDistanceRef.current = 0;
          player.x = playerStartX;
          ai.x = playerStartX;
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
        if (this.background) this.background.setSize(width, height);
        if (this.pitchLines) drawPitchLine.call(this, width, height);
        if (this.finishLine) this.finishLine.y = height / 2;
        if (player) player.setScale(getScale());
        if (ai) ai.setScale(getScale());
      }

      let lastPDist = -1, lastADist = -1;

      function update(time, delta) {
        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        const H = this.scale.height;
        aiDistanceRef.current += 0.35 * delta;

        playerDistanceRef.current += (targetDistanceRef.current - playerDistanceRef.current) * 0.05;
        if (targetDistanceRef.current > 0) {
          playerDistanceRef.current += 0.1 * delta;
          targetDistanceRef.current += 0.1 * delta;
        }

        player.x = playerStartX + playerDistanceRef.current;
        ai.x     = playerStartX + aiDistanceRef.current;

        const bobFreq = 0.01;
        const bobAmt  = Math.max(4, Math.round(H * 0.012));
        player.y = getPlayerY(H) + Math.sin(time * bobFreq) * bobAmt;
        ai.y     = getAiY(H)    + Math.sin(time * bobFreq * 1.1) * bobAmt;

        if (!this.tweens.isTweening(playerBall)) {
          playerBall.x = player.x + 28;
          playerBall.y = player.y + 12 + Math.abs(Math.sin(time * bobFreq * 2)) * 7;
        }
        aiBall.x = ai.x + 28;
        aiBall.y = ai.y + 12 + Math.abs(Math.sin(time * bobFreq * 2.2)) * 7;

        player.angle = 4 + Math.sin(time * 0.02) * 2;
        ai.angle     = 4 + Math.sin(time * 0.022) * 2;

        const camX = player.x - getCamOff();
        this.cameras.main.scrollX = camX;
        if (this.background) this.background.tilePositionX = camX * 0.5;

        const pDist = Math.floor(playerDistanceRef.current / 100);
        const aDist = Math.floor(aiDistanceRef.current / 100);
        if (pDist !== lastPDist) { if (playerDistanceUITextRef.current) playerDistanceUITextRef.current.innerText = pDist; lastPDist = pDist; }
        if (aDist !== lastADist) { if (aiDistanceUITextRef.current) aiDistanceUITextRef.current.innerText = aDist; lastADist = aDist; }

        if (playerDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'PLAYER'; setWinnerState('PLAYER');
          gameStateRef.current = 'finished'; setGameStateDisplay('finished');
        } else if (aiDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'AI'; setWinnerState('AI');
          gameStateRef.current = 'finished'; setGameStateDisplay('finished');
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
    let timer = 3;
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
      width: '100vw', height: '100dvh',
      position: 'fixed', top: 0, left: 0,
      zIndex: 1, overflow: 'hidden', background: '#050505'
    }}>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: '10px', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        zIndex: 10, background: 'rgba(0,0,0,0.55)',
        padding: 'clamp(5px,1.2vw,12px) clamp(10px,2.5vw,24px)',
        borderRadius: '14px', border: '2px solid var(--accent)', whiteSpace: 'nowrap'
      }}>
        <div className="arcade-text" style={{ color: 'var(--accent)', fontSize: 'clamp(9px,1.8vw,18px)' }}>RACE PROGRESS</div>
        <div style={{ display: 'flex', gap: 'clamp(14px,3.5vw,36px)', fontSize: 'clamp(10px,1.6vw,16px)' }}>
          <div style={{ color: '#fff' }}>YOU: <span ref={playerDistanceUITextRef}>0</span>m</div>
          <div style={{ color: '#ff0055' }}>AI: <span ref={aiDistanceUITextRef}>0</span>m</div>
        </div>
        <div style={{ fontSize: 'clamp(8px,1vw,12px)', opacity: 0.65 }}>MODE: {mode.toUpperCase()}</div>
      </div>

      {/* Waiting */}
      {gameStateDisplay === 'waiting' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
          <div className="arcade-text" style={{ color: 'var(--accent)', fontSize: 'clamp(14px,2.5vw,26px)' }}>INITIALIZING TRACK...</div>
        </div>
      )}

      {/* Ready */}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, gap: '14px' }}>
          <button className="glow-btn" onClick={startCountdown} style={{ padding: 'clamp(10px,2vh,18px) clamp(20px,4vw,50px)', fontSize: 'clamp(14px,2.5vw,26px)' }}>
            READY TO RACE? 🏃
          </button>
          <p className="arcade-text" style={{ color: '#fff', fontSize: 'clamp(10px,1.6vw,17px)' }}>GET IN POSITION FOR {mode.toUpperCase()}</p>
        </div>
      )}

      {/* Countdown */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(55px,16vw,130px)', color: 'var(--accent)' }}>{countdown}</div>
          <div className="arcade-text" style={{ fontSize: 'clamp(13px,2.5vw,24px)', color: '#fff' }}>ON YOUR MARKS!</div>
        </div>
      )}

      {/* Winner */}
      {gameStateDisplay === 'finished' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, gap: '10px' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(28px,7vw,68px)', color: winnerState === 'PLAYER' ? 'var(--accent)' : '#ff0055' }}>
            {winnerState === 'PLAYER' ? '🏆 YOU WIN!' : '🤖 AI WINS!'}
          </h2>
          <p className="arcade-text" style={{ fontSize: 'clamp(12px,2.2vw,22px)', marginBottom: '12px' }}>GREAT WORKOUT!</p>
          <button className="glow-btn" onClick={handleRestart} style={{ padding: 'clamp(9px,1.8vh,14px) clamp(20px,4vw,40px)', fontSize: 'clamp(12px,1.8vw,18px)' }}>
            RACE AGAIN
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(65px,11vh,120px)',
        left: '10px',
        background: 'rgba(0,0,0,0.5)',
        padding: 'clamp(7px,1.2vw,13px)',
        borderRadius: '9px',
        border: '1px solid var(--accent)',
        fontSize: 'clamp(8px,1.2vw,12px)',
        pointerEvents: 'none', zIndex: 10
      }}>
        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '3px' }}>HOW TO PLAY:</div>
        <div>Each {mode === 'jacks' ? 'jack' : mode.slice(0, -1)} = SPEED BOOST</div>
        <div>Reach the GOAL first!</div>
      </div>
    </div>
  );
};

export default memo(FitnessRace);
