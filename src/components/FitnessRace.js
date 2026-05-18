"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const FitnessRace = ({ mode, targetKm = 1, isCameraReady }) => {
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
      let skyBg, groundLayer, stadiumLights, trailParticles;
      const playerStartX = 200;

      const getScale = () => {
        const w = window.innerWidth;
        if (w < 480) return 0.12;
        if (w < 768) return 0.17;
        return 0.27;
      };

      const getTrackY = h => h - Math.round(h * 0.25);

      function preload() {
        this.load.image('player', '/ronaldo.png');
        this.load.image('ai', '/neymar.png');
        this.load.image('football', '/football.png');
        this.load.image('spark', 'https://labs.phaser.io/assets/particles/blue.png');
      }

      function buildStadium(W, H) {
        if (!skyBg) {
          skyBg = scene.add.graphics();
          skyBg.setScrollFactor(0).setDepth(0);
        }
        skyBg.clear();
        skyBg.fillGradientStyle(0x020205, 0x020205, 0x0a0a20, 0x0a0a20, 1);
        skyBg.fillRect(0, 0, W, H);

        if (!stadiumLights) {
          stadiumLights = scene.add.graphics();
          stadiumLights.setScrollFactor(0).setDepth(1);
        }
        stadiumLights.clear();
        [W*0.2, W*0.8].forEach(x => {
          stadiumLights.fillStyle(0x39ff14, 0.05);
          stadiumLights.fillTriangle(x, 0, x-150, H, x+150, H);
        });

        if (!groundLayer) {
          groundLayer = scene.add.graphics();
          groundLayer.setScrollFactor(0).setDepth(2);
        }
        groundLayer.clear();
        groundLayer.fillStyle(0x111111, 1);
        groundLayer.fillRect(0, H * 0.75, W, H * 0.25);
        groundLayer.lineStyle(4, 0x39ff14, 0.5);
        groundLayer.strokeLineShape(new Phaser.Geom.Line(0, H * 0.75, W, H * 0.75));
      }

      function create() {
        scene = this;
        const W = this.scale.width;
        const H = this.scale.height;
        const spr = getScale();

        buildStadium(W, H);

        trailParticles = this.add.particles(0, 0, 'spark', {
          speed: 100,
          scale: { start: 0.1, end: 0 },
          blendMode: 'ADD',
          lifespan: 300,
          alpha: { start: 0.5, end: 0 },
          frequency: -1
        });
        trailParticles.setDepth(5);

        ai = this.add.sprite(playerStartX, getTrackY(H), 'ai');
        ai.setScale(spr * 0.9);
        ai.setDepth(8);

        player = this.add.sprite(playerStartX, getTrackY(H), 'player');
        player.setScale(spr);
        player.setDepth(9);

        ball = this.add.sprite(playerStartX + 50, getTrackY(H) + 55, 'football');
        ball.setScale(spr * 0.15);
        ball.setDepth(10);

        leaderArrow = this.add.graphics().setDepth(20);
        leaderArrow.fillStyle(0x39ff14, 1);
        leaderArrow.fillTriangle(-10, -20, 10, -20, 0, 0);

        this.movePlayer = () => {
          if (gameStateRef.current !== 'playing' || winnerRef.current) return;
          const distPerRep = mode === 'fingers' ? 100 : 1000;
          playerDistanceRef.current += distPerRep;
          // Removed camera shake for better clarity
          trailParticles.emitParticleAt(player.x, player.y + 20, 3);
          this.tweens.add({ targets: player, scale: spr * 1.1, duration: 80, yoyo: true });
        };

        this.restart = () => {
          playerDistanceRef.current = 0;
          aiDistanceRef.current = 0;
          winnerRef.current = null;
          setWinnerState(null);
          gameStateRef.current = 'ready';
          setGameStateDisplay('ready');
        };
      }

      function update(time, delta) {
        if (gameStateRef.current !== 'playing' || winnerRef.current) return;
        const H = this.scale.height;
        const aiSpeedBase = targetKm === 1 ? 0.4 : targetKm === 2 ? 0.7 : 0.9;
        aiDistanceRef.current += aiSpeedBase * delta;
        if (playerDistanceRef.current > 0) playerDistanceRef.current += (aiSpeedBase * 0.3) * delta;
        player.x = playerStartX + playerDistanceRef.current;
        ai.x = playerStartX + aiDistanceRef.current;
        const trackY = getTrackY(H);
        player.y = trackY + Math.sin(time * 0.01) * 5;
        ai.y = trackY + Math.sin(time * 0.012 + 1) * 5;
        const leader = playerDistanceRef.current >= aiDistanceRef.current ? player : ai;
        ball.x = leader.x + 40; ball.y = leader.y + 50;
        leaderArrow.x = leader.x; leaderArrow.y = leader.y - 80;
        this.cameras.main.scrollX = Math.max(player.x, ai.x) - (window.innerWidth / 3);
        if (playerDistanceUITextRef.current) playerDistanceUITextRef.current.innerText = Math.floor(playerDistanceRef.current / 100);
        if (aiDistanceUITextRef.current) aiDistanceUITextRef.current.innerText = Math.floor(aiDistanceRef.current / 100);
        if (playerDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'PLAYER'; setWinnerState('PLAYER'); setGameStateDisplay('finished');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#39ff14', '#ffffff', '#00f2ff'] });
        } else if (aiDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'AI'; setWinnerState('AI'); setGameStateDisplay('finished');
        }
      }
      game = new Phaser.Game(config); gameRef.current = game;
    };
    initPhaser();
    return () => { if (gameRef.current && typeof gameRef.current === 'object' && gameRef.current.destroy) gameRef.current.destroy(true); gameRef.current = null; };
  }, []);

  useEffect(() => { if (isCameraReady && gameStateRef.current === 'waiting') { gameStateRef.current = 'ready'; setGameStateDisplay('ready'); } }, [isCameraReady]);

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

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, zIndex: 1, background: '#020205' }}>
      <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '40px', zIndex: 10, padding: '20px 40px', background: 'rgba(0,0,0,0.8)', borderRadius: '20px', border: '1px solid var(--accent)', backdropFilter: 'blur(10px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: '10px' }}>PLAYER DISTANCE</p>
          <div className="arcade-text" style={{ fontSize: '24px', color: 'var(--accent)' }}><span ref={playerDistanceUITextRef}>0</span><span style={{ fontSize: '14px' }}>M</span></div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: '10px' }}>AI DISTANCE</p>
          <div className="arcade-text" style={{ fontSize: '24px', color: 'var(--danger)' }}><span ref={aiDistanceUITextRef}>0</span><span style={{ fontSize: '14px' }}>M</span></div>
        </div>
      </div>
      {combo > 1 && (
        <div style={{ position: 'absolute', top: '150px', left: '50%', transform: 'translateX(-50%)', zIndex: 11, textAlign: 'center', pointerEvents: 'none' }}>
          <div className="arcade-text" style={{ fontSize: '40px', color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }}>{combo}X COMBO</div>
        </div>
      )}
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)' }}>
          <h2 className="arcade-text" style={{ fontSize: '40px', marginBottom: '30px' }}>TRACKER <span style={{ color: 'var(--accent)' }}>READY</span></h2>
          <button className="glow-btn pulse-glow" onClick={() => { gameStateRef.current = 'countdown'; setGameStateDisplay('countdown'); let timer = 3; setCountdown(timer); const interval = setInterval(() => { timer -= 1; setCountdown(timer); if (timer === 0) { clearInterval(interval); gameStateRef.current = 'playing'; setGameStateDisplay('playing'); } }, 1000); }} style={{ padding: '25px 60px', fontSize: '24px' }}>START WORKOUT ⚡</button>
        </div>
      )}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: '180px', color: 'var(--accent)', filter: 'drop-shadow(0 0 50px var(--accent))' }}>{countdown}</div>
        </div>
      )}
      {gameStateDisplay === 'finished' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
            <h2 className="arcade-text" style={{ fontSize: '80px', color: winnerState === 'PLAYER' ? 'var(--accent)' : 'var(--danger)', marginBottom: '20px' }}>{winnerState === 'PLAYER' ? 'WORKOUT COMPLETE' : 'WORKOUT ENDED'}</h2>
            <div className="glass-card" style={{ marginBottom: '40px', padding: '30px 60px' }}>
              <p className="hud-text" style={{ fontSize: '20px' }}>{winnerState === 'PLAYER' ? 'GREAT JOB KEEPING UP THE PACE!' : "KEEP PUSHING, YOU'LL GET IT NEXT TIME"}</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '30px', justifyContent: 'center' }}>
                <div><p style={{ opacity: 0.5, fontSize: '12px' }}>CALORIES</p><p className="arcade-text" style={{ fontSize: '24px' }}>{Math.floor(Math.random() * 50 + 20)}</p></div>
                <div><p style={{ opacity: 0.5, fontSize: '12px' }}>XP GAINED</p><p className="arcade-text" style={{ fontSize: '24px', color: 'var(--secondary)' }}>+450</p></div>
              </div>
            </div>
            <button className="glow-btn" onClick={() => window.location.reload()} style={{ padding: '20px 60px' }}>TRY AGAIN</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default memo(FitnessRace);

