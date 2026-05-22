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

const FitnessRace = ({ 
  mode, 
  targetKm = 1, 
  isCameraReady, 
  activeTheme = 'default', 
  activeStadium = 'default', 
  activeCharacter = 'default', 
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

      let player, ai, ball, leaderArrow, scene;
      let skyBg, groundLayer, stadiumLights, trailParticles;
      let mountains, clouds = [];
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
        
        // Load all 6 Neymar running frames from the public/neymar directory
        for (let i = 1; i <= 6; i++) {
          this.load.image(`neymarRun${i}`, `/neymar/neymar${i}.png`);
        }

        // Load all 6 Ronaldo running frames from the public/ronaldo directory
        for (let i = 1; i <= 6; i++) {
          this.load.image(`ronaldoRun${i}`, `/ronaldo/ronaldooo${i}.png`);
        }
      }

      function buildStadium(W, H) {
        // 1. Beautiful Sky with equipped Gradient theme
        if (!skyBg) {
          skyBg = scene.add.graphics();
          skyBg.setScrollFactor(0).setDepth(0);
        }
        skyBg.clear();

        let skyTop = 0x0088ff;
        let skyBottom = 0x66ccff;
        if (activeTheme === 'sunset') {
          // Warm sunset reward gradient sky
          skyTop = 0xff3300;
          skyBottom = 0xff8800;
        }
        skyBg.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
        skyBg.fillRect(0, 0, W, H * 0.75);
        
        // 2. Horizon boundary grass pasture / Golden arena
        let grassColor = 0x38b000;
        if (activeStadium === 'golden') {
          grassColor = 0xffd700; // Radiant Golden Stadium
        }
        skyBg.fillStyle(grassColor, 1);
        skyBg.fillRect(0, H * 0.75, W, H * 0.25);

        // 3. Parallax Mountains in deep background
        if (!mountains) {
          mountains = scene.add.graphics();
          mountains.setScrollFactor(0.05, 0).setDepth(1);
        }
        mountains.clear();
        
        let mtColor = 0x005f73;
        if (activeStadium === 'golden') {
          mtColor = 0xb59410;
        }
        mountains.fillStyle(mtColor, 0.45);
        
        mountains.beginPath();
        mountains.moveTo(0, H * 0.75);
        mountains.lineTo(W * 0.15, H * 0.4);
        mountains.lineTo(W * 0.35, H * 0.6);
        mountains.lineTo(W * 0.55, H * 0.35);
        mountains.lineTo(W * 0.75, H * 0.65);
        mountains.lineTo(W * 0.9, H * 0.45);
        mountains.lineTo(W * 1.2, H * 0.75);
        mountains.closePath();
        mountains.fillPath();

        // 4. Create Parallax Clouds
        clouds = [];
        for (let i = 0; i < 8; i++) {
          const cloud = scene.add.graphics();
          const cx = Math.random() * W * 1.5;
          const cy = 30 + Math.random() * (H * 0.35);
          const scale = 0.4 + Math.random() * 0.8;
          
          cloud.fillStyle(0xffffff, 0.9);
          cloud.fillCircle(0, 0, 25);
          cloud.fillCircle(-20, 3, 16);
          cloud.fillCircle(20, 3, 16);
          cloud.fillRoundedRect(-35, 3, 70, 16, 8);
          
          cloud.x = cx;
          cloud.y = cy;
          cloud.setScale(scale);
          cloud.setScrollFactor(0.12, 0);
          cloud.setDepth(2);
          
          cloud.driftSpeed = 0.15 + Math.random() * 0.25;
          clouds.push(cloud);
        }

        // 5. High-quality 2D Road in world coordinates
        if (!groundLayer) {
          groundLayer = scene.add.graphics();
          groundLayer.setScrollFactor(1).setDepth(3);
        }
        groundLayer.clear();
        
        const roadWidth = finishLineDistance + 3000;
        groundLayer.fillStyle(activeStadium === 'golden' ? 0x4a3c00 : 0x24252a, 1);
        groundLayer.fillRect(0, H * 0.75, roadWidth, H * 0.25);
        
        groundLayer.lineStyle(6, activeStadium === 'golden' ? 0xffea00 : 0xffd000, 0.95);
        groundLayer.strokeLineShape(new Phaser.Geom.Line(0, H * 0.75, roadWidth, H * 0.75));
        groundLayer.strokeLineShape(new Phaser.Geom.Line(0, H - 15, roadWidth, H - 15));
        
        groundLayer.lineStyle(4, 0xffffff, 0.7);
        for (let rx = 0; rx < roadWidth; rx += 140) {
          groundLayer.strokeLineShape(new Phaser.Geom.Line(rx, H * 0.86, rx + 70, H * 0.86));
        }
      }

      function create() {
        scene = this;
        const W = this.scale.width;
        const H = this.scale.height;
        const spr = getScale();

        // Helper to dynamically remove pure black background from PNG/JPG textures at runtime
        function removeBlackBackground(sceneRef, textureKey) {
          try {
            const texture = sceneRef.textures.get(textureKey);
            if (!texture) return;
            const source = texture.getSourceImage();
            if (!source) return;
            
            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(source, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              // Chroma key: strip solid black background pixels completely
              if (r < 10 && g < 10 && b < 10) {
                data[i+3] = 0; // Alpha transparent
              }
            }
            ctx.putImageData(imgData, 0, 0);
            sceneRef.textures.addCanvas(textureKey + '_clean', canvas);
          } catch (e) {
            console.error("Error transparency-keying texture:", e);
          }
        }

        buildStadium(W, H);

        // Process all animation frames to strip solid black background shapes
        for (let i = 1; i <= 6; i++) {
          removeBlackBackground(this, `neymarRun${i}`);
        }
        for (let i = 1; i <= 6; i++) {
          removeBlackBackground(this, `ronaldoRun${i}`);
        }

        trailParticles = this.add.particles(0, 0, 'spark', {
          speed: 100,
          scale: { start: 0.1, end: 0 },
          blendMode: 'ADD',
          lifespan: 300,
          alpha: { start: 0.5, end: 0 },
          frequency: -1
        });
        trailParticles.setDepth(5);

        // Create the Neymar running animation from clean textures
        this.anims.create({
          key: 'neymar_run',
          frames: [
            { key: 'neymarRun1_clean' },
            { key: 'neymarRun2_clean' },
            { key: 'neymarRun3_clean' },
            { key: 'neymarRun4_clean' },
            { key: 'neymarRun5_clean' },
            { key: 'neymarRun6_clean' }
          ],
          frameRate: 10,
          repeat: -1
        });

        // Create the Ronaldo running animation from clean textures
        this.anims.create({
          key: 'player_run',
          frames: [
            { key: 'ronaldoRun1_clean' },
            { key: 'ronaldoRun2_clean' },
            { key: 'ronaldoRun3_clean' },
            { key: 'ronaldoRun4_clean' },
            { key: 'ronaldoRun5_clean' },
            { key: 'ronaldoRun6_clean' }
          ],
          frameRate: 10,
          repeat: -1
        });

        ai = this.add.sprite(playerStartX, getTrackY(H), 'neymarRun1_clean');
        ai.setScale(spr * 1.35); // Increased scale
        ai.setDepth(8);
        ai.play('neymar_run');
        ai.anims.pause();

        player = this.add.sprite(playerStartX, getTrackY(H), 'ronaldoRun1_clean');
        
        let baseScale = 2.7;
        if (activeCharacter === 'ronaldo_elite') {
          baseScale = 3.2; // Giant Elite Cristiano
          player.setTint(0xffd700); // Golden aura
        }
        player.setScale(spr * baseScale);
        player.setDepth(9);
        player.play('player_run');
        player.anims.pause();

        ball = this.add.sprite(playerStartX + 50, getTrackY(H) + 72, 'football');
        ball.setScale(spr * 0.26);
        ball.setDepth(10);

        leaderArrow = this.add.graphics().setDepth(20);
        leaderArrow.fillStyle(0x39ff14, 1);
        leaderArrow.fillTriangle(-10, -20, 10, -20, 0, 0);

        this.movePlayer = () => {
          if (gameStateRef.current !== 'playing' || winnerRef.current) return;
          const distPerRep = mode === 'fingers' ? 100 : 1000;
          playerDistanceRef.current += distPerRep;
          trailParticles.emitParticleAt(player.x, player.y + 20, 3);
          
          let yoyoScale = 2.85;
          if (activeCharacter === 'ronaldo_elite') {
            yoyoScale = 3.35;
          }
          this.tweens.add({ targets: player, scale: spr * yoyoScale, duration: 80, yoyo: true });
        };

        this.restart = () => {
          playerDistanceRef.current = 0;
          aiDistanceRef.current = 0;
          winnerRef.current = null;
          setWinnerState(null);
          gameStateRef.current = 'ready';
          setGameStateDisplay('ready');
          
          if (ai && ai.anims) {
            ai.play('neymar_run');
            ai.anims.pause();
            ai.setTexture('neymarRun1_clean');
          }

          if (player && player.anims) {
            player.play('player_run');
            player.anims.pause();
            player.setTexture('ronaldoRun1_clean');
            
            let bScale = 2.7;
            if (activeCharacter === 'ronaldo_elite') {
              bScale = 3.2;
              player.setTint(0xffd700);
            } else {
              player.clearTint();
            }
            player.setScale(spr * bScale);
          }
        };
      }

      function update(time, delta) {
        const H = this.scale.height;
        
        // 1. Dynamic parallax drift for clouds (runs ambiently even when not playing)
        const scrollX = this.cameras.main.scrollX;
        const screenW = window.innerWidth;
        if (clouds && clouds.length > 0) {
          clouds.forEach(cloud => {
            cloud.x -= cloud.driftSpeed;
            const leftBound = scrollX * 0.12 - 120;
            const rightBound = scrollX * 0.12 + screenW + 120;
            if (cloud.x < leftBound) {
              cloud.x = rightBound;
              cloud.y = 30 + Math.random() * (H * 0.35);
            }
          });
        }
        
        // 2. Smooth ball rolling rotation (spins continuously based on activity)
        if (ball) {
          const isPlaying = gameStateRef.current === 'playing' && !winnerRef.current;
          const rollFactor = isPlaying ? 0.55 : 0.08;
          ball.angle += rollFactor * delta;
        }

        // 3. Control Neymar running animation playback based on game state
        if (ai && ai.anims) {
          const isRunning = gameStateRef.current === 'playing' && !winnerRef.current;
          if (isRunning) {
            if (ai.anims.isPaused) ai.anims.resume();
          } else {
            if (!ai.anims.isPaused) ai.anims.pause();
          }
        }

        // 4. Control Player running animation playback based on game state
        if (player && player.anims) {
          const isPlayerRunning = gameStateRef.current === 'playing' && !winnerRef.current && playerDistanceRef.current > 0;
          if (isPlayerRunning) {
            if (player.anims.isPaused) player.anims.resume();
          } else {
            if (!player.anims.isPaused) player.anims.pause();
          }
        }

        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        // Custom speed curves: Neymar scales base running speed based on sprint target km!
        const aiSpeedBase = targetKm === 1 ? 0.4 : targetKm === 2 ? 0.7 : 0.9;
        aiDistanceRef.current += aiSpeedBase * delta;
        if (playerDistanceRef.current > 0) playerDistanceRef.current += (aiSpeedBase * 0.3) * delta;
        
        player.x = playerStartX + playerDistanceRef.current;
        ai.x = playerStartX + aiDistanceRef.current;
        const trackY = getTrackY(H);
        
        player.y = trackY + Math.sin(time * 0.01) * 5;
        ai.y = trackY + Math.sin(time * 0.012 + 1) * 5;
        
        const leader = playerDistanceRef.current >= aiDistanceRef.current ? player : ai;
        ball.x = leader.x + 40; 
        ball.y = leader.y + 72;
        
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

  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, zIndex: 1, background: '#020205' }}>
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
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>PLAYER DISTANCE</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--accent)' }}><span ref={playerDistanceUITextRef}>0</span><span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span></div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>AI DISTANCE</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--danger)' }}><span ref={aiDistanceUITextRef}>0</span><span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span></div>
        </div>
      </div>
      {combo > 1 && (
        <div style={{ position: 'absolute', top: 'clamp(65px, 18vh, 150px)', left: '50%', transform: 'translateX(-50%)', zIndex: 11, textAlign: 'center', pointerEvents: 'none' }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(18px, 4vw, 40px)', color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }}>{combo}X COMBO</div>
        </div>
      )}
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
      {gameStateDisplay === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)', padding: '20px' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 5vw, 40px)', marginBottom: 'clamp(15px, 4vh, 30px)', textAlign: 'center' }}>TRACKER <span style={{ color: 'var(--accent)' }}>READY</span></h2>
          <button className="glow-btn pulse-glow" onClick={() => { enterFullscreen(); gameStateRef.current = 'countdown'; setGameStateDisplay('countdown'); let timer = 3; setCountdown(timer); const interval = setInterval(() => { timer -= 1; setCountdown(timer); if (timer === 0) { clearInterval(interval); gameStateRef.current = 'playing'; setGameStateDisplay('playing'); } }, 1000); }} style={{ padding: 'clamp(12px, 3vh, 25px) clamp(30px, 8vw, 60px)', fontSize: 'clamp(16px, 4vw, 24px)' }}>START WORKOUT ⚡</button>
        </div>
      )}

      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(70px, 25vh, 180px)', color: 'var(--accent)', filter: 'drop-shadow(0 0 50px var(--accent))' }}>{countdown}</div>
        </div>
      )}
      {gameStateDisplay === 'finished' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '90%' }}>
            <h2 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 64px)', color: winnerState === 'PLAYER' ? 'var(--accent)' : 'var(--danger)', marginBottom: 'clamp(10px, 2.5vh, 20px)' }}>{winnerState === 'PLAYER' ? 'WORKOUT COMPLETE' : 'WORKOUT ENDED'}</h2>
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
