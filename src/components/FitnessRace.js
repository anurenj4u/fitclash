"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import confetti from 'canvas-confetti';
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

// ---------------------------------------------------------------------------
// Stickman drawing helper
//   color : 0xRRGGBB Phaser hex color
//   frame : 0–7, drives the running cycle (arms & legs swing)
//   scale : pixel multiplier (pixels per "unit")
// ---------------------------------------------------------------------------
function drawStickman(gfx, color, frame, scale) {
  const t = (frame / 8) * Math.PI * 2; // angle in full cycle

  // Body proportions (all in abstract units, then scaled)
  const headR   = 10 * scale;
  const bodyLen = 26 * scale;
  const armLen  = 18 * scale;
  const legLen  = 22 * scale;
  const lineW   = Math.max(3, 4 * scale);

  // Anchor = hip centre
  const hx = 0;
  const hy = 0;

  // Spine top = shoulder
  const shoulderY = hy - bodyLen;

  // Head centre
  const headY = shoulderY - headR - 2 * scale;

  gfx.clear();
  gfx.lineStyle(lineW, color, 1);
  gfx.fillStyle(color, 1);

  // --- HEAD ---
  gfx.fillCircle(hx, headY, headR);

  // --- BODY (torso) ---
  gfx.beginPath();
  gfx.moveTo(hx, shoulderY);
  gfx.lineTo(hx, hy);
  gfx.strokePath();

  // --- ARMS ---
  // Arms swing opposite phase to each other
  const armSwing = Math.sin(t) * 0.7; // radians

  // Left arm (swings forward when right leg goes forward)
  const lArmEndX = hx + Math.sin(-armSwing) * armLen;
  const lArmEndY = shoulderY + 8 * scale + Math.cos(armSwing) * armLen * 0.4;
  gfx.beginPath();
  gfx.moveTo(hx, shoulderY + 8 * scale);
  gfx.lineTo(lArmEndX, lArmEndY);
  gfx.strokePath();

  // Right arm
  const rArmEndX = hx + Math.sin(armSwing) * armLen;
  const rArmEndY = shoulderY + 8 * scale + Math.cos(-armSwing) * armLen * 0.4;
  gfx.beginPath();
  gfx.moveTo(hx, shoulderY + 8 * scale);
  gfx.lineTo(rArmEndX, rArmEndY);
  gfx.strokePath();

  // --- LEGS ---
  const legSwing = Math.sin(t) * 0.65;

  // Left leg (thigh → shin with knee bend)
  const lThighX = hx + Math.sin(legSwing) * legLen * 0.5;
  const lThighY = hy + Math.cos(legSwing) * legLen * 0.5;
  const lShinX  = lThighX + Math.sin(legSwing * 0.5 + 0.5) * legLen * 0.5;
  const lShinY  = lThighY + legLen * 0.5;
  gfx.beginPath();
  gfx.moveTo(hx, hy);
  gfx.lineTo(lThighX, lThighY);
  gfx.lineTo(lShinX, lShinY);
  gfx.strokePath();

  // Right leg (opposite phase)
  const rThighX = hx + Math.sin(-legSwing) * legLen * 0.5;
  const rThighY = hy + Math.cos(-legSwing) * legLen * 0.5;
  const rShinX  = rThighX + Math.sin(-legSwing * 0.5 + 0.5) * legLen * 0.5;
  const rShinY  = rThighY + legLen * 0.5;
  gfx.beginPath();
  gfx.moveTo(hx, hy);
  gfx.lineTo(rThighX, rThighY);
  gfx.lineTo(rShinX, rShinY);
  gfx.strokePath();
}

const FitnessRace = ({ 
  mode, 
  targetKm = 1, 
  isCameraReady, 
  activeTheme = 'default', 
  activeStadium = 'default', 
  onComplete 
}) => {
  const gameRef = useRef(null);
  const [winnerState, setWinnerState] = useState(null);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting');
  const [countdown, setCountdown] = useState(3);
  const [combo, setCombo] = useState(0);

  const playerDistanceUITextRef = useRef(null);
  const aiDistanceUITextRef = useRef(null);
  const comboTimeoutRef = useRef(null);

  const gameStateRef = useRef('waiting');
  const winnerRef = useRef(null);
  const playerDistanceRef = useRef(0);
  const aiDistanceRef = useRef(0);
  const previousRepsRef = useRef(0);
  const finishLineDistance = targetKm * 100000;
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

      // Stickman graphics objects
      let playerGfx, aiGfx;
      let playerFrame = 0, aiFrame = 0;
      let frameTimer = 0;
      const FRAME_INTERVAL = 80; // ms per animation frame

      let leaderArrow, scene;
      let skyBg, groundLayer, mountains, clouds = [];

      const playerStartX = 200;
      const STICKMAN_SCALE = window.innerWidth < 480 ? 0.5 : window.innerWidth < 768 ? 0.7 : 1.0;

      const getTrackY = h => h - Math.round(h * 0.28);

      function preload() {
        // No external images needed – stickmen are drawn with Phaser Graphics
        this.load.image('spark', 'https://labs.phaser.io/assets/particles/blue.png');
      }

      function buildStadium(W, H) {
        if (!skyBg) {
          skyBg = scene.add.graphics();
          skyBg.setScrollFactor(0).setDepth(0);
        }
        skyBg.clear();

        let skyTop    = activeTheme === 'sunset' ? 0xff3300 : 0x0066cc;
        let skyBottom = activeTheme === 'sunset' ? 0xff8800 : 0x44aaff;
        skyBg.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
        skyBg.fillRect(0, 0, W, H * 0.75);

        let grassColor = activeStadium === 'golden' ? 0xffd700 : 0x2d9a27;
        skyBg.fillStyle(grassColor, 1);
        skyBg.fillRect(0, H * 0.75, W, H * 0.25);

        if (!mountains) {
          mountains = scene.add.graphics();
          mountains.setScrollFactor(0.05, 0).setDepth(1);
        }
        mountains.clear();
        let mtColor = activeStadium === 'golden' ? 0xb59410 : 0x004d66;
        mountains.fillStyle(mtColor, 0.45);
        mountains.beginPath();
        mountains.moveTo(0, H * 0.75);
        mountains.lineTo(W * 0.15, H * 0.4);
        mountains.lineTo(W * 0.35, H * 0.6);
        mountains.lineTo(W * 0.55, H * 0.35);
        mountains.lineTo(W * 0.75, H * 0.65);
        mountains.lineTo(W * 0.9,  H * 0.45);
        mountains.lineTo(W * 1.2,  H * 0.75);
        mountains.closePath();
        mountains.fillPath();

        clouds = [];
        for (let i = 0; i < 8; i++) {
          const cloud = scene.add.graphics();
          const cx = Math.random() * W * 1.5;
          const cy = 30 + Math.random() * (H * 0.35);
          const sc = 0.4 + Math.random() * 0.8;
          cloud.fillStyle(0xffffff, 0.9);
          cloud.fillCircle(0, 0, 25);
          cloud.fillCircle(-20, 3, 16);
          cloud.fillCircle(20, 3, 16);
          cloud.fillRoundedRect(-35, 3, 70, 16, 8);
          cloud.x = cx; cloud.y = cy; cloud.setScale(sc);
          cloud.setScrollFactor(0.12, 0).setDepth(2);
          cloud.driftSpeed = 0.15 + Math.random() * 0.25;
          clouds.push(cloud);
        }

        if (!groundLayer) {
          groundLayer = scene.add.graphics();
          groundLayer.setScrollFactor(1).setDepth(3);
        }
        groundLayer.clear();
        const roadWidth = finishLineDistance + 3000;
        groundLayer.fillStyle(activeStadium === 'golden' ? 0x4a3c00 : 0x1e1f24, 1);
        groundLayer.fillRect(0, H * 0.75, roadWidth, H * 0.25);
        groundLayer.lineStyle(6, activeStadium === 'golden' ? 0xffea00 : 0xffd000, 0.95);
        groundLayer.strokeLineShape(new Phaser.Geom.Line(0, H * 0.75, roadWidth, H * 0.75));
        groundLayer.strokeLineShape(new Phaser.Geom.Line(0, H - 15, roadWidth, H - 15));
        groundLayer.lineStyle(4, 0xffffff, 0.7);
        for (let rx = 0; rx < roadWidth; rx += 140) {
          groundLayer.strokeLineShape(new Phaser.Geom.Line(rx, H * 0.86, rx + 70, H * 0.86));
        }

        // Finish line
        const finishGfx = scene.add.graphics().setDepth(4);
        finishGfx.lineStyle(6, 0xffffff, 1);
        finishGfx.strokeLineShape(new Phaser.Geom.Line(
          playerStartX + finishLineDistance, H * 0.75,
          playerStartX + finishLineDistance, H
        ));
        // Checkered finish pattern
        const stripeH = (H * 0.25) / 10;
        for (let si = 0; si < 10; si++) {
          const col = si % 2 === 0 ? 0xffffff : 0x000000;
          finishGfx.fillStyle(col, 0.9);
          finishGfx.fillRect(playerStartX + finishLineDistance, H * 0.75 + si * stripeH, 16, stripeH);
        }
      }

      function create() {
        scene = this;
        const W = this.scale.width;
        const H = this.scale.height;

        buildStadium(W, H);

        // Particle trail for player boost
        this.trailParticles = this.add.particles(0, 0, 'spark', {
          speed: 80,
          scale: { start: 0.08, end: 0 },
          blendMode: 'ADD',
          lifespan: 250,
          alpha: { start: 0.5, end: 0 },
          frequency: -1
        });
        this.trailParticles.setDepth(5);

        // AI stickman (blue)
        aiGfx = scene.add.graphics();
        aiGfx.setDepth(8);
        aiGfx.x = playerStartX;
        aiGfx.y = getTrackY(H);
        drawStickman(aiGfx, 0x00aaff, 0, STICKMAN_SCALE);

        // Player stickman (red)
        playerGfx = scene.add.graphics();
        playerGfx.setDepth(9);
        playerGfx.x = playerStartX;
        playerGfx.y = getTrackY(H);
        drawStickman(playerGfx, 0xff2020, 0, STICKMAN_SCALE);

        // Leader arrow
        leaderArrow = this.add.graphics().setDepth(20);
        leaderArrow.fillStyle(0x39ff14, 1);
        leaderArrow.fillTriangle(-10, -20, 10, -20, 0, 0);

        this.movePlayer = () => {
          if (gameStateRef.current !== 'playing' || winnerRef.current) return;
          const distPerRep = mode === 'fingers' ? 100 : 1000;
          playerDistanceRef.current += distPerRep;
          this.trailParticles.emitParticleAt(playerGfx.x, playerGfx.y + 20, 3);
          // Tiny scale pulse on rep
          this.tweens.add({
            targets: playerGfx,
            scaleX: 1.12, scaleY: 1.12,
            duration: 60, yoyo: true
          });
        };

        this.restart = () => {
          playerDistanceRef.current = 0;
          aiDistanceRef.current = 0;
          winnerRef.current = null;
          setWinnerState(null);
          gameStateRef.current = 'ready';
          setGameStateDisplay('ready');
          playerFrame = 0; aiFrame = 0;
          drawStickman(aiGfx, 0x00aaff, 0, STICKMAN_SCALE);
          drawStickman(playerGfx, 0xff2020, 0, STICKMAN_SCALE);
        };
      }

      function update(time, delta) {
        const H = this.scale.height;
        const isPlaying = gameStateRef.current === 'playing' && !winnerRef.current;

        // 1. Animate stickmen frames
        if (isPlaying) {
          frameTimer += delta;
          if (frameTimer >= FRAME_INTERVAL) {
            frameTimer = 0;
            // AI always animates; player animates only if they've moved
            aiFrame = (aiFrame + 1) % 8;
            if (playerDistanceRef.current > 0) playerFrame = (playerFrame + 1) % 8;

            drawStickman(aiGfx, 0x00aaff, aiFrame, STICKMAN_SCALE);
            drawStickman(playerGfx, 0xff2020, playerFrame, STICKMAN_SCALE);
          }
        }

        // 2. Parallax clouds
        const scrollX = this.cameras.main.scrollX;
        const screenW = window.innerWidth;
        if (clouds && clouds.length > 0) {
          clouds.forEach(cloud => {
            cloud.x -= cloud.driftSpeed;
            if (cloud.x < scrollX * 0.12 - 120) {
              cloud.x = scrollX * 0.12 + screenW + 120;
              cloud.y = 30 + Math.random() * (H * 0.35);
            }
          });
        }

        if (!isPlaying) return;

        // 3. Move AI + passive player boost
        const aiSpeedBase = targetKm === 1 ? 0.4 : targetKm === 2 ? 0.7 : 0.9;
        aiDistanceRef.current += aiSpeedBase * delta;
        if (playerDistanceRef.current > 0) playerDistanceRef.current += (aiSpeedBase * 0.3) * delta;

        // 4. Bobbing Y position
        playerGfx.x = playerStartX + playerDistanceRef.current;
        playerGfx.y = getTrackY(H) + Math.sin(time * 0.01) * 5;
        aiGfx.x = playerStartX + aiDistanceRef.current;
        aiGfx.y = getTrackY(H) + Math.sin(time * 0.012 + 1) * 5;

        // 5. Leader arrow
        const leader = playerDistanceRef.current >= aiDistanceRef.current ? playerGfx : aiGfx;
        leaderArrow.x = leader.x;
        leaderArrow.y = leader.y - 90 * STICKMAN_SCALE;

        // 6. Camera follow
        this.cameras.main.scrollX = Math.max(playerGfx.x, aiGfx.x) - (window.innerWidth / 3);

        // 7. HUD text updates
        if (playerDistanceUITextRef.current)
          playerDistanceUITextRef.current.innerText = Math.floor(playerDistanceRef.current / 100);
        if (aiDistanceUITextRef.current)
          aiDistanceUITextRef.current.innerText = Math.floor(aiDistanceRef.current / 100);

        // 8. Win/Lose detection
        if (playerDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'PLAYER'; setWinnerState('PLAYER'); setGameStateDisplay('finished');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#39ff14', '#ffffff', '#00f2ff'] });
        } else if (aiDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'AI'; setWinnerState('AI'); setGameStateDisplay('finished');
        }
      }

      game = new Phaser.Game(config);
      gameRef.current = game;
    };
    initPhaser();
    return () => {
      if (gameRef.current && typeof gameRef.current === 'object' && gameRef.current.destroy)
        gameRef.current.destroy(true);
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
          setCombo(prev => prev + 1);
          if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
          comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);
        }
      }
    };
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, []);

  useEffect(() => {
    return () => { exitFullscreen(); };
  }, []);

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, zIndex: 1, background: '#020205' }}>
      {/* HUD: Distance counters */}
      <div style={{ 
        position: 'absolute', 
        top: 'clamp(8px, 3.5vh, 30px)', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        gap: 'clamp(15px, 4vw, 40px)', 
        zIndex: 10, 
        padding: 'clamp(8px, 2vh, 16px) clamp(16px, 4vw, 40px)', 
        background: 'rgba(0,0,0,0.8)', 
        borderRadius: '16px', 
        border: '1px solid var(--accent)', 
        backdropFilter: 'blur(10px)' 
      }}>
        {/* Player */}
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>YOU 🔴</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: '#ff2020' }}>
            <span ref={playerDistanceUITextRef}>0</span>
            <span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span>
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        {/* AI */}
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>RIVAL 🔵</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: '#00aaff' }}>
            <span ref={aiDistanceUITextRef}>0</span>
            <span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span>
          </div>
        </div>
      </div>

      {/* Combo */}
      {combo > 1 && (
        <div style={{ position: 'absolute', top: 'clamp(65px, 18vh, 150px)', left: '50%', transform: 'translateX(-50%)', zIndex: 11, textAlign: 'center', pointerEvents: 'none' }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(18px, 4vw, 40px)', color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }}>{combo}X COMBO</div>
        </div>
      )}

      {/* WAITING – loading overlay */}
      {gameStateDisplay === 'waiting' && (
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'rgba(2, 2, 5, 0.96)', 
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', 
          zIndex: 95, backdropFilter: 'blur(20px)', padding: '20px' 
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', zIndex: 1 }} />
          <div className="glass-card" style={{ position: 'relative', zIndex: 2, maxWidth: '450px', width: '100%', padding: '40px 30px', background: 'rgba(5, 5, 8, 0.85)', border: '1px solid rgba(57, 255, 20, 0.3)', borderRadius: '20px', boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.08)', border: '2px solid rgba(57, 255, 20, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)', position: 'relative' }}>
              <div className="loader" style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#39ff14', animation: 'spin 1.5s infinite linear' }} />
              <Activity size={24} color="#39ff14" style={{ filter: 'drop-shadow(0 0 5px #39ff14)' }} />
            </div>
            <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 900, letterSpacing: '3px', display: 'block', color: '#fff', marginBottom: '8px' }}>NEURAL TRACKING SYSTEM</span>
            <h2 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.3)', margin: 0 }}>INITIALIZING ENGINE</h2>
            <div className="arcade-text" style={{ fontSize: '48px', color: '#ffffff', margin: '20px 0 10px 0', fontWeight: 900 }}>
              {trackerProgress.percent}<span style={{ color: '#39ff14', fontSize: '24px' }}>%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <motion.div animate={{ width: `${trackerProgress.percent}%` }} transition={{ duration: 0.3 }} style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 12px #39ff14', borderRadius: '3px' }} />
            </div>
            <p className="hud-text" style={{ fontSize: '12px', color: '#fff', opacity: 0.8, margin: 0, fontWeight: 700, minHeight: '18px', letterSpacing: '0.5px' }}>{trackerProgress.message}</p>
          </div>
        </div>
      )}

      {/* READY */}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)', padding: '20px' }}>
          {/* Mini preview of both stickmen */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '30px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <svg width="60" height="90" viewBox="-20 -80 40 90">
                <circle cx="0" cy="-70" r="10" fill="#ff2020"/>
                <line x1="0" y1="-60" x2="0" y2="-34" stroke="#ff2020" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-52" x2="-14" y2="-38" stroke="#ff2020" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-52" x2="14" y2="-38" stroke="#ff2020" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-34" x2="-10" y2="-14" stroke="#ff2020" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-34" x2="10" y2="-14" stroke="#ff2020" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <p style={{ color: '#ff2020', fontFamily: 'var(--font-gaming)', fontSize: '10px', fontWeight: 900, marginTop: '4px' }}>YOU</p>
            </div>
            <span style={{ color: '#39ff14', fontFamily: 'var(--font-gaming)', fontSize: '22px', fontWeight: 900 }}>VS</span>
            <div style={{ textAlign: 'center' }}>
              <svg width="60" height="90" viewBox="-20 -80 40 90">
                <circle cx="0" cy="-70" r="10" fill="#00aaff"/>
                <line x1="0" y1="-60" x2="0" y2="-34" stroke="#00aaff" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-52" x2="-14" y2="-38" stroke="#00aaff" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-52" x2="14" y2="-38" stroke="#00aaff" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-34" x2="-10" y2="-14" stroke="#00aaff" strokeWidth="4" strokeLinecap="round"/>
                <line x1="0" y1="-34" x2="10" y2="-14" stroke="#00aaff" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <p style={{ color: '#00aaff', fontFamily: 'var(--font-gaming)', fontSize: '10px', fontWeight: 900, marginTop: '4px' }}>RIVAL</p>
            </div>
          </div>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 5vw, 40px)', marginBottom: 'clamp(15px, 4vh, 30px)', textAlign: 'center' }}>TRACKER <span style={{ color: 'var(--accent)' }}>READY</span></h2>
          <button className="glow-btn pulse-glow" onClick={() => {
            enterFullscreen();
            gameStateRef.current = 'countdown';
            setGameStateDisplay('countdown');
            let timer = 3;
            setCountdown(timer);
            const interval = setInterval(() => {
              timer -= 1; setCountdown(timer);
              if (timer === 0) {
                clearInterval(interval);
                gameStateRef.current = 'playing';
                setGameStateDisplay('playing');
              }
            }, 1000);
          }} style={{ padding: 'clamp(12px, 3vh, 25px) clamp(30px, 8vw, 60px)', fontSize: 'clamp(16px, 4vw, 24px)' }}>START RACE ⚡</button>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(70px, 25vh, 180px)', color: 'var(--accent)', filter: 'drop-shadow(0 0 50px var(--accent))' }}>{countdown}</div>
        </div>
      )}

      {/* FINISHED */}
      {gameStateDisplay === 'finished' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '90%' }}>
            <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 64px)', color: winnerState === 'PLAYER' ? 'var(--accent)' : 'var(--danger)', marginBottom: 'clamp(10px, 2.5vh, 20px)' }}>{winnerState === 'PLAYER' ? '🏆 WORKOUT COMPLETE' : 'WORKOUT ENDED'}</h2>
            <div className="glass-card" style={{ marginBottom: 'clamp(15px, 4vh, 40px)', padding: 'clamp(15px, 3.5vh, 30px) clamp(20px, 6vw, 60px)' }}>
              <p className="hud-text" style={{ fontSize: 'clamp(12px, 2.5vw, 18px)' }}>{winnerState === 'PLAYER' ? 'GREAT JOB KEEPING UP THE PACE!' : "KEEP PUSHING, YOU'LL GET IT NEXT TIME"}</p>
              <div style={{ marginTop: 'clamp(10px, 2.5vh, 20px)', display: 'flex', gap: 'clamp(15px, 4vw, 30px)', justifyContent: 'center' }}>
                <div><p style={{ opacity: 0.5, fontSize: 'clamp(9px, 1.5vw, 12px)' }}>CALORIES</p><p className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--danger)' }}>{Math.round(previousRepsRef.current * 0.45 + targetKm * 10)}</p></div>
                <div><p style={{ opacity: 0.5, fontSize: 'clamp(9px, 1.5vw, 12px)' }}>XP GAINED</p><p className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--secondary)' }}>+{Math.round(previousRepsRef.current * 6 + targetKm * 50)}</p></div>
              </div>
            </div>
            <button className="glow-btn" onClick={() => {
              exitFullscreen();
              if (onComplete) {
                onComplete(previousRepsRef.current);
              } else {
                window.location.reload();
              }
            }} style={{ padding: 'clamp(10px, 2.5vh, 20px) clamp(30px, 8vw, 60px)', fontSize: 'clamp(14px, 2.5vw, 18px)' }}>DONE</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default memo(FitnessRace);
