"use client";
import React, { useEffect, useRef, useState, memo } from 'react';

const FitnessRace = ({ mode, targetKm = 1, isCameraReady }) => {
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
  // 1km = 100,000 units (where 100 units = 1m)
  const finishLineDistance = targetKm * 100000;

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

      let player, ai, ball, leaderArrow, scene;
      // Sky layers for parallax
      let skyBg, cloudLayer1, cloudLayer2, groundLayer, trackLine;
      const clouds1 = [], clouds2 = [];
      const playerStartX = 200;

      // ── Responsive helpers ──────────────────────────
      const getScale = () => {
        const w = window.innerWidth;
        if (w < 480) return 0.12;
        if (w < 768) return 0.17;
        return 0.27;
      };
      const getBallScale = () => getScale() * 0.5;
      // Both players on same track Y
      const getTrackY  = h => h - Math.round(h * 0.22);
      const getCamOff  = () => window.innerWidth < 480 ? 140 : window.innerWidth < 768 ? 240 : 420;
      // ───────────────────────────────────────────────

      function preload() {
        this.load.image('player', '/ronaldo.png');
        this.load.image('ai', '/neymar.png');
        this.load.image('football', '/football.png');
      }

      // Draw the full sky scene procedurally
      function buildSky(W, H) {
        // Sky gradient rectangle
        if (!skyBg) {
          skyBg = scene.add.graphics();
          skyBg.setScrollFactor(0);
          skyBg.setDepth(0);
        }
        skyBg.clear();
        // Sky gradient: deep blue top → lighter horizon
        skyBg.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a4a8a, 0x1a4a8a, 1);
        skyBg.fillRect(0, 0, W, H * 0.72);
        // Horizon glow
        skyBg.fillGradientStyle(0xf5a623, 0xf5a623, 0x1a4a8a, 0x1a4a8a, 0.35);
        skyBg.fillRect(0, H * 0.48, W, H * 0.24);

        // Ground strip
        if (!groundLayer) {
          groundLayer = scene.add.graphics();
          groundLayer.setScrollFactor(0);
          groundLayer.setDepth(1);
        }
        groundLayer.clear();
        // Grass
        groundLayer.fillGradientStyle(0x2d7a27, 0x2d7a27, 0x1a5217, 0x1a5217, 1);
        groundLayer.fillRect(0, H * 0.72, W, H * 0.28);
        // Track strip — gray asphalt
        groundLayer.fillGradientStyle(0x888888, 0x888888, 0x555555, 0x555555, 1);
        groundLayer.fillRect(0, H * 0.69, W, H * 0.16);
        // Track lane lines
        groundLayer.lineStyle(2, 0xffffff, 0.45);
        groundLayer.beginPath();
        groundLayer.moveTo(0, H * 0.69);
        groundLayer.lineTo(W, H * 0.69);
        groundLayer.strokePath();
        groundLayer.beginPath();
        groundLayer.moveTo(0, H * 0.85);
        groundLayer.lineTo(W, H * 0.85);
        groundLayer.strokePath();
        // Dashed centre line
        groundLayer.lineStyle(2, 0xffffff, 0.3);
        for (let x = 0; x < W; x += 60) {
          groundLayer.beginPath();
          groundLayer.moveTo(x, H * 0.77);
          groundLayer.lineTo(x + 30, H * 0.77);
          groundLayer.strokePath();
        }
      }

      function spawnClouds(W, H) {
        const numC1 = 6, numC2 = 4;
        for (let i = 0; i < numC1; i++) {
          const c = scene.add.graphics();
          c.setScrollFactor(0);
          c.setDepth(2);
          const cx = Math.random() * W * 8;
          const cy = H * (0.06 + Math.random() * 0.28);
          drawCloud(c, cx, cy, 0.8 + Math.random() * 0.6);
          c._x = cx; c._y = cy; c._speed = 0.18 + Math.random() * 0.14; c._W = W;
          clouds1.push(c);
        }
        for (let i = 0; i < numC2; i++) {
          const c = scene.add.graphics();
          c.setScrollFactor(0);
          c.setDepth(3);
          const cx = Math.random() * W * 6;
          const cy = H * (0.04 + Math.random() * 0.18);
          drawCloud(c, cx, cy, 0.5 + Math.random() * 0.4, true);
          c._x = cx; c._y = cy; c._speed = 0.08 + Math.random() * 0.08; c._W = W;
          clouds2.push(c);
        }
      }

      function drawCloud(g, cx, cy, scale = 1, small = false) {
        g.clear();
        g.fillStyle(0xffffff, small ? 0.55 : 0.82);
        const r = small ? 22 : 35;
        // Fluffy cluster
        g.fillCircle(cx, cy, r * scale);
        g.fillCircle(cx + r * 0.7 * scale, cy - r * 0.3 * scale, r * 0.75 * scale);
        g.fillCircle(cx - r * 0.6 * scale, cy - r * 0.2 * scale, r * 0.65 * scale);
        g.fillCircle(cx + r * 1.2 * scale, cy, r * 0.55 * scale);
        g.fillCircle(cx - r * 1.15 * scale, cy, r * 0.5 * scale);
      }

      function create() {
        scene = this;
        const W = this.scale.width;
        const H = this.scale.height;
        const spr = getScale();

        buildSky(W, H);
        spawnClouds(W, H);

        this.scale.on('resize', onResize, this);

        // AI (Neymar) — slightly behind and smaller (depth trick)
        ai = this.add.sprite(playerStartX, getTrackY(H), 'ai');
        ai.setScale(spr * 0.92);
        ai.setAlpha(0.88);
        ai.setDepth(8);

        // Player (Ronaldo) — in front
        player = this.add.sprite(playerStartX, getTrackY(H), 'player');
        player.setScale(spr);
        player.setDepth(9);

        // Single football — starts with player
        ball = this.add.sprite(playerStartX + 50, getTrackY(H) + 55, 'football');
        ball.setScale(getBallScale());
        ball.setDepth(10);

        // Finish line
        const goalFontSize = window.innerWidth < 480 ? '28px' : '56px';
        this.finishLine = this.add.rectangle(
          finishLineDistance + playerStartX, H / 2, 50, H, 0xffffff, 0.55
        );
        this.finishLine.setDepth(7);
        this.add.text(
          finishLineDistance + playerStartX, getTrackY(H) - 60, 'GOAL!', {
            fontSize: goalFontSize, fontFamily: 'Arial Black, Arial',
            color: '#fff', backgroundColor: '#00cc00',
            padding: { x: 14, y: 7 }
          }
        ).setOrigin(0.5).setDepth(11);

        // ── Leader arrow (green ▼ above leading player) ──
        leaderArrow = this.add.graphics();
        leaderArrow.setDepth(20);
        drawLeaderArrow(leaderArrow);

        this.player = player;
        this.ai = ai;

        this.movePlayer = () => {
          if (gameStateRef.current !== 'playing' || winnerRef.current) return;
          // Each rep adds distance: 10m (1000 units) default, 2m (200 units) for fingers specifically
          const distPerRep = mode === 'fingers' ? 200 : 1000;
          playerDistanceRef.current += distPerRep;
          this.tweens.add({ targets: player, scale: spr * 1.15, duration: 100, yoyo: true, ease: 'Back.easeOut' });
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
          if (leaderArrow) leaderArrow.setVisible(true);
        };
      }

      function onResize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.main.setSize(width, height);
        buildSky(width, height);
        if (this.finishLine) this.finishLine.y = height / 2;
        if (player) { player.setScale(getScale()); player.y = getTrackY(height); }
        if (ai)     { ai.setScale(getScale() * 0.92); ai.y = getTrackY(height); }
      }

      // Draw a downward-pointing arrow centred at (0, 0) in the graphics object
      function drawLeaderArrow(g) {
        g.clear();
        // Outer glow
        g.fillStyle(0x00ff44, 0.25);
        g.fillTriangle(-18, -36, 18, -36, 0, 0);
        // Main arrow body
        g.fillStyle(0x00ff44, 1);
        g.fillTriangle(-13, -32, 13, -32, 0, -4);
        // Stem
        g.fillRect(-5, -52, 10, 22);
      }

      let lastPDist = -1, lastADist = -1;

      function update(time, delta) {
        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        const H = this.scale.height;
        // AI drifts forward steadily - scaled with distance to maintain pace
        const aiSpeedBase = targetKm === 1 ? 0.35 : targetKm === 2 ? 0.6 : 0.8;
        aiDistanceRef.current += aiSpeedBase * delta;

        // Player movement is now direct (no interpolation accumulation)
        // Passive creep to keep momentum feel when ahead - also scaled
        if (playerDistanceRef.current > 0) {
          playerDistanceRef.current += (aiSpeedBase * 0.3) * delta;
        }

        player.x = playerStartX + playerDistanceRef.current;
        ai.x     = playerStartX + aiDistanceRef.current;

        const trackY = getTrackY(H);
        const bobFreq = 0.008;
        const bobAmt  = Math.max(4, Math.round(H * 0.012));

        // Both on SAME track Y — bob independently
        player.y = trackY + Math.sin(time * bobFreq) * bobAmt;
        ai.y     = trackY + Math.sin(time * bobFreq * 1.15 + 1.2) * bobAmt;

        // ── Leader logic: ball + arrow follow whoever is ahead ──
        const playerIsLeading = playerDistanceRef.current >= aiDistanceRef.current;
        const leader = playerIsLeading ? player : ai;
        const leaderBobFreq = playerIsLeading ? bobFreq : bobFreq * 1.15;
        const leaderBobOff  = playerIsLeading ? 0 : 1.2;

        // Ball at leader's feet
        ball.x = leader.x + 52;
        ball.y = trackY + Math.sin(time * leaderBobFreq + leaderBobOff) * bobAmt
                 + 60 + Math.abs(Math.sin(time * 0.018)) * 8;
        ball.angle += delta * 0.55;
        ball.setScale(getBallScale());

        // ── Green down-arrow: bounce above leader's head ──
        const arrowBounce = Math.sin(time * 0.005) * 6; // gentle up-down float
        const spriteHalfH = leader.displayHeight * 0.5;
        leaderArrow.x = leader.x;
        leaderArrow.y = leader.y - spriteHalfH - 18 + arrowBounce;

        // Running lean
        player.angle = 5 + Math.sin(time * 0.022) * 2.5;
        ai.angle     = 5 + Math.sin(time * 0.024) * 2.5;

        // ── Camera follows leading player ──
        const leadX = Math.max(player.x, ai.x);
        const camX = leadX - getCamOff();
        this.cameras.main.scrollX = camX;

        // ── Cloud parallax (scroll with camera at different rates) ──
        clouds1.forEach(c => {
          c._x -= c._speed * delta * 0.015;
          if (c._x < -300) c._x = c._W * 1.5;
          c.x = c._x + camX * 0.04;
        });
        clouds2.forEach(c => {
          c._x -= c._speed * delta * 0.01;
          if (c._x < -200) c._x = c._W * 1.2;
          c.x = c._x + camX * 0.015;
        });

        // ── HUD distance ──
        const pDist = Math.floor(playerDistanceRef.current / 100);
        const aDist = Math.floor(aiDistanceRef.current / 100);
        if (pDist !== lastPDist) { if (playerDistanceUITextRef.current) playerDistanceUITextRef.current.innerText = pDist; lastPDist = pDist; }
        if (aDist !== lastADist) { if (aiDistanceUITextRef.current) aiDistanceUITextRef.current.innerText = aDist; lastADist = aDist; }

        // ── Win check ──
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
      zIndex: 1, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0a1628 0%, #1a4a8a 60%, #2d7a27 100%)'
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
        <div className="arcade-text" style={{ color: 'var(--accent)', fontSize: 'clamp(9px,1.8vw,18px)' }}>RACE PROGRESS ({targetKm}KM)</div>
        <div style={{ display: 'flex', gap: 'clamp(14px,3.5vw,36px)', fontSize: 'clamp(10px,1.6vw,16px)' }}>
          <div style={{ color: '#fff' }}>YOU: <span ref={playerDistanceUITextRef}>0</span>m / {targetKm * 1000}m</div>
          <div style={{ color: '#ff0055' }}>AI: <span ref={aiDistanceUITextRef}>0</span>m / {targetKm * 1000}m</div>
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
        <div>
          {mode === 'fingers'
            ? 'Show ☝️ 1 finger = SPEED BOOST'
            : `Each ${mode === 'jacks' ? 'jack' : mode.slice(0, -1)} = SPEED BOOST`}
        </div>
        <div>Reach the GOAL first!</div>
      </div>
    </div>
  );
};

export default memo(FitnessRace);
