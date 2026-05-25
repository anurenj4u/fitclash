"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import PositionCalibration from './PositionCalibration';

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
  roomId = null,
  role = null,
  sprintMatchType = 'ai',
  opponentName = null,
  onComplete,
  onQuit
}) => {
  const gameRef = useRef(null);
  const boostAudioRef = useRef(null);
  const refereeAudioRef = useRef(null);
  const last100mThresholdRef = useRef(0);
  const [winnerState, setWinnerState] = useState(null);
  const [gameStateDisplay, setGameStateDisplay] = useState('waiting');
  const [countdown, setCountdown] = useState(3);
  const [combo, setCombo] = useState(0);
  const [repsCount, setRepsCount] = useState(0);
  const [remainingDist, setRemainingDist] = useState(targetKm * 1000);
  const [activeOverlayModal, setActiveOverlayModal] = useState(null); // null, 'quit_confirm', 'performance_summary'
  const [comparisonDetails, setComparisonDetails] = useState({
    current: 0,
    previous: 0,
    diff: 0,
    status: 'first',
    message: '',
    isQuit: false
  });

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

  const aiTargetDistanceRef = useRef(0);
  const [lobbyData, setLobbyData] = useState(null);

  const handleMatchEnd = (finalReps, isQuit) => {
    let previous = 0;
    let prevRepsObj = {};
    if (typeof window !== 'undefined') {
      try {
        prevRepsObj = JSON.parse(localStorage.getItem("fitclash_previous_reps") || "{}");
        previous = prevRepsObj[mode] || 0;
      } catch (e) {
        console.error("Error loading previous reps from localStorage:", e);
      }
    }

    const diff = finalReps - previous;
    let status = 'first'; // 'improved', 'less', 'tied', 'first'
    let feedbackMessage = '';

    if (previous > 0) {
      if (diff > 0) {
        status = 'improved';
        feedbackMessage = `Incredible job! You Improved when Compared to previous! Completed +${diff} more reps.`;
      } else if (diff < 0) {
        status = 'less';
        feedbackMessage = `You completed ${Math.abs(diff)} fewer reps than last time. Keep pushing yourself to beat your personal best!`;
      } else {
        status = 'tied';
        feedbackMessage = `You matched your previous score exactly! Steady progress!`;
      }
    } else {
      status = 'first';
      feedbackMessage = `First sprint completed! A benchmark of ${finalReps} reps has been set. Let's beat it next time!`;
    }

    if (finalReps > 0) {
      try {
        prevRepsObj[mode] = finalReps;
        localStorage.setItem("fitclash_previous_reps", JSON.stringify(prevRepsObj));
      } catch (e) {
        console.error("Error saving reps to localStorage:", e);
      }
    }

    let finalWinnerStr = 'OPPONENT';
    if (winnerRef.current === 'PLAYER' || winnerRef.current === role) finalWinnerStr = 'PLAYER';

    setComparisonDetails({
      current: finalReps,
      previous: previous,
      diff: diff,
      status: status,
      message: feedbackMessage,
      isQuit: isQuit,
      winner: finalWinnerStr
    });

    setActiveOverlayModal('performance_summary');
  };

  // Sync finished state display to trigger comparative modal
  useEffect(() => {
    if (gameStateDisplay === 'finished') {
      handleMatchEnd(previousRepsRef.current, false);
    }
  }, [gameStateDisplay]);

  // Sync lobby state from Firestore in real-time
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, "sprint_rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLobbyData(data);

        // Update opponent's target distance for Phaser lerping
        const oppDist = role === 'host' ? (data.guestDistance || 0) : (data.hostDistance || 0);
        aiTargetDistanceRef.current = oppDist;

        // Auto trigger countdown when status changes to 'countdown'
        if (data.status === 'countdown' && gameStateRef.current === 'ready') {
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
              if (refereeAudioRef.current) {
                refereeAudioRef.current.currentTime = 0;
                refereeAudioRef.current.play().catch(e => console.log("Audio play error:", e));
              }
            }
          }, 1000);
        }

        // Auto transition to finished if opponent won
        if (data.status === 'finished' && data.winner && data.winner !== role && !winnerRef.current) {
          winnerRef.current = 'AI';
          setWinnerState('AI');
          setGameStateDisplay('finished');
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, role]);

  useEffect(() => {
    const handleProgress = (e) => {
      const { percent, message } = e.detail;
      setTrackerProgress({ percent, message });
    };
    window.addEventListener('tracker-init-status', handleProgress);
    return () => window.removeEventListener('tracker-init-status', handleProgress);
  }, []);

  useEffect(() => {
    boostAudioRef.current = new Audio('/sounds/boost.mp3');
    boostAudioRef.current.volume = 0.5;
    refereeAudioRef.current = new Audio('/sounds/referee.mp3');
    refereeAudioRef.current.volume = 0.5;
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
        this.load.image('football', '/football.png');
        this.load.image('spark', 'https://labs.phaser.io/assets/particles/blue.png');

        // Load all 6 Neymar running frames
        for (let i = 1; i <= 6; i++) {
          this.load.image(`neymarRun${i}`, `/neymar/neymar${i}.png`);
        }

        // Load all 6 Ronaldo running frames
        for (let i = 1; i <= 6; i++) {
          this.load.image(`ronaldoRun${i}`, `/ronaldo/ronaldooo${i}.png`);
        }
      }

      function buildStadium(W, H) {
        if (!skyBg) {
          skyBg = scene.add.graphics();
          skyBg.setScrollFactor(0).setDepth(0);
        }
        skyBg.clear();

        let skyTop = 0x0088ff;
        let skyBottom = 0x66ccff;
        if (activeTheme === 'sunset') {
          skyTop = 0xff3300;
          skyBottom = 0xff8800;
        }
        skyBg.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
        skyBg.fillRect(0, 0, W, H * 0.75);

        let grassColor = 0x38b000;
        if (activeStadium === 'golden') {
          grassColor = 0xffd700;
        }
        skyBg.fillStyle(grassColor, 1);
        skyBg.fillRect(0, H * 0.75, W, H * 0.25);

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

        // Helper to remove solid black background from PNG textures at runtime
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
              const g = data[i + 1];
              const b = data[i + 2];
              if (r < 10 && g < 10 && b < 10) {
                data[i + 3] = 0;
              }
            }
            ctx.putImageData(imgData, 0, 0);
            sceneRef.textures.addCanvas(textureKey + '_clean', canvas);
          } catch (e) {
            console.error("Error transparency-keying texture:", e);
          }
        }

        buildStadium(W, H);

        // Strip black backgrounds from all animation frames
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

        // Neymar (AI) running animation
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

        // Ronaldo (Player) running animation
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

        // AI = Neymar
        ai = this.add.sprite(playerStartX, getTrackY(H), 'neymarRun1_clean');
        ai.setScale(spr * 1.35);
        ai.setDepth(8);
        ai.play('neymar_run');
        ai.anims.pause();

        // Player = Ronaldo
        player = this.add.sprite(playerStartX, getTrackY(H), 'ronaldoRun1_clean');

        let baseScale = 2.7;
        if (activeCharacter === 'ronaldo_elite') {
          baseScale = 3.2;
          player.setTint(0xffd700);
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
          const distPerRep = mode === 'jacks' ? 800 : (['pushups', 'squats'].includes(mode) ? 1500 : (mode === 'fingers' ? 100 : 800));
          playerDistanceRef.current += distPerRep;
          trailParticles.emitParticleAt(player.x, player.y + 20, 3);

          if (roomId) {
            const roomRef = doc(db, "sprint_rooms", roomId);
            if (role === 'host') {
              updateDoc(roomRef, { hostDistance: playerDistanceRef.current });
            } else {
              updateDoc(roomRef, { guestDistance: playerDistanceRef.current });
            }
          }

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
          last100mThresholdRef.current = 0;

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

        // Parallax cloud drift
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

        // Ball rolling
        if (ball) {
          const isPlaying = gameStateRef.current === 'playing' && !winnerRef.current;
          const rollFactor = isPlaying ? 0.55 : 0.08;
          ball.angle += rollFactor * delta;
        }

        // Neymar animation control
        if (ai && ai.anims) {
          const isRunning = gameStateRef.current === 'playing' && !winnerRef.current;
          if (isRunning) {
            if (ai.anims.isPaused) ai.anims.resume();
          } else {
            if (!ai.anims.isPaused) ai.anims.pause();
          }
        }

        // Ronaldo animation control
        if (player && player.anims) {
          const isPlayerRunning = gameStateRef.current === 'playing' && !winnerRef.current && playerDistanceRef.current > 0;
          if (isPlayerRunning) {
            if (player.anims.isPaused) player.anims.resume();
          } else {
            if (!player.anims.isPaused) player.anims.pause();
          }
        }

        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        // AI/Opponent speed mapping
        const isSimulatedBot = roomId && lobbyData?.guestUid === 'simulated_ai_pro';

        if (!roomId || isSimulatedBot) {
          // Single-player or simulated bot: Neymar moves automatically
          const aiSpeedBase = targetKm === 1 ? 0.4 : targetKm === 2 ? 0.7 : 0.9;
          aiDistanceRef.current += aiSpeedBase * delta;
          if (playerDistanceRef.current > 0) playerDistanceRef.current += (aiSpeedBase * 0.3) * delta;
        } else {
          // Real-time private or online multiplayer: Opponent distance updates via Firestore snapshot
          const lerpSpeed = 0.08;
          aiDistanceRef.current += (aiTargetDistanceRef.current - aiDistanceRef.current) * lerpSpeed;
        }

        player.x = playerStartX + playerDistanceRef.current;
        ai.x = playerStartX + aiDistanceRef.current;
        const trackY = getTrackY(H);

        player.y = trackY + Math.sin(time * 0.01) * 5;
        ai.y = trackY + Math.sin(time * 0.012 + 1) * 5;

        const leader = playerDistanceRef.current >= aiDistanceRef.current ? player : ai;
        ball.x = leader.x + 40;
        ball.y = leader.y + 72;

        leaderArrow.x = leader.x;
        leaderArrow.y = leader.y - 80;
        this.cameras.main.scrollX = Math.max(player.x, ai.x) - (window.innerWidth / 3);

        if (playerDistanceUITextRef.current) {
          const currentMeters = Math.floor(playerDistanceRef.current / 100);
          playerDistanceUITextRef.current.innerText = currentMeters;
        }
        if (aiDistanceUITextRef.current)
          aiDistanceUITextRef.current.innerText = Math.floor(aiDistanceRef.current / 100);

        // Win coordination
        if (playerDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          winnerRef.current = 'PLAYER';
          setWinnerState('PLAYER');
          setGameStateDisplay('finished');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#39ff14', '#ffffff', '#00f2ff'] });

          if (roomId) {
            const roomRef = doc(db, "sprint_rooms", roomId);
            updateDoc(roomRef, {
              status: 'finished',
              winner: role,
              updatedAt: serverTimestamp()
            });
          }
        } else if (aiDistanceRef.current >= finishLineDistance && !winnerRef.current) {
          // In single player, AI reaches finish. In multiplayer, handled by snapshot but fallback here is fine.
          winnerRef.current = 'AI';
          setWinnerState('AI');
          setGameStateDisplay('finished');
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

  const handleCalibrationComplete = () => {
    gameStateRef.current = 'ready';
    setGameStateDisplay('ready');
    
    // Update camera status in Firestore if multiplayer room is active
    if (roomId && role) {
      const roomRef = doc(db, "sprint_rooms", roomId);
      if (role === 'host') {
        updateDoc(roomRef, { hostCameraReady: true });
      } else {
        updateDoc(roomRef, { guestCameraReady: true });
      }
    }
  };

  useEffect(() => {
    if (isCameraReady && gameStateRef.current === 'waiting') {
      gameStateRef.current = 'calibration';
      setGameStateDisplay('calibration');
    }
  }, [isCameraReady, roomId, role]);

  useEffect(() => {
    const handlePoseUpdate = (e) => {
      const { reps } = e.detail;
      if (reps > previousRepsRef.current) {
        const diffReps = reps - previousRepsRef.current;
        previousRepsRef.current = reps;
        
        // Prevent HUD tracking, sounds, and game progression outside active race
        if (gameStateRef.current !== 'playing' || winnerRef.current) return;

        setRepsCount(prev => prev + diffReps);
        
        // Play boost sound for every completed rep
        if (boostAudioRef.current) {
          boostAudioRef.current.currentTime = 0;
          boostAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }

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
    const interval = setInterval(() => {
      if (gameStateDisplay === 'playing') {
        const rem = Math.max(0, Math.floor((finishLineDistance - playerDistanceRef.current) / 100));
        setRemainingDist(rem);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameStateDisplay, finishLineDistance]);

  useEffect(() => {
    return () => { exitFullscreen(); };
  }, []);

  const localPlayerLabel = role === 'host'
    ? (lobbyData?.hostEmail?.split('@')[0]?.toUpperCase() || 'YOU')
    : (lobbyData?.guestEmail?.split('@')[0]?.toUpperCase() || 'YOU');

  const opponentPlayerLabel = opponentName
    ? opponentName.toUpperCase()
    : (role === 'host'
      ? (lobbyData?.guestEmail?.split('@')[0]?.toUpperCase() || (sprintMatchType === 'online' ? 'CR7_PRO_BOT' : 'NEYMAR'))
      : (lobbyData?.hostEmail?.split('@')[0]?.toUpperCase() || 'NEYMAR'));

  const formatRemainingDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} KM`;
    }
    return `${meters} M`;
  };

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, zIndex: 1, background: '#020205' }}>

      {/* Floating Exit Button */}
      {gameStateDisplay !== 'finished' && activeOverlayModal === null && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (gameStateDisplay === 'playing') {
              setActiveOverlayModal('quit_confirm');
            } else {
              exitFullscreen();
              if (onQuit) {
                onQuit({ reps: repsCount, calories: repsCount * 0.45, xp: repsCount * 6 });
              } else if (onComplete) {
                onComplete({ reps: repsCount, calories: repsCount * 0.45, xp: repsCount * 6 });
              }
            }
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 100,
            background: 'rgba(255, 0, 60, 0.1)',
            border: '1.5px solid rgba(255, 0, 60, 0.4)',
            borderRadius: '12px',
            color: '#ff4444',
            padding: '10px 16px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'var(--font-gaming)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(255, 0, 60, 0.15)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s'
          }}
        >
          <span>QUIT MATCH</span>
        </motion.button>
      )}

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
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>{localPlayerLabel}</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--accent)' }}>
            <span ref={playerDistanceUITextRef}>0</span>
            <span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span>
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p className="hud-text" style={{ opacity: 0.5, fontSize: 'clamp(8px, 1.5vw, 10px)' }}>{opponentPlayerLabel}</p>
          <div className="arcade-text" style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: 'var(--danger)' }}>
            <span ref={aiDistanceUITextRef}>0</span>
            <span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>M</span>
          </div>
        </div>
      </div>

      {/* Live Gameplay HUD overlays */}
      {gameStateDisplay === 'playing' && (
        <>
          {/* Rep Count Badge (Left) */}
          <div className="glass-card hud-left-card" style={{
            position: 'absolute',
            left: 'clamp(10px, 3vw, 30px)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(5, 5, 8, 0.85)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.15)',
            borderRadius: '20px',
            padding: 'clamp(12px, 2vh, 24px) clamp(16px, 3vw, 32px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '9px', opacity: 0.6, fontWeight: 900, letterSpacing: '2px', color: 'var(--accent)' }}>SENSORS LIVE</span>
            <h3 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', margin: 0, opacity: 0.8 }}>
              {mode === 'jacks' ? 'JUMPING JACKS' : mode.toUpperCase()}
            </h3>
            <div className="arcade-text" style={{ fontSize: 'clamp(28px, 6vw, 48px)', color: '#fff', fontWeight: 900, lineHeight: 1 }}>
              {repsCount}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5, letterSpacing: '1px' }}>REPS completed</span>
          </div>

          {/* Distance Remaining Badge (Right) */}
          <div className="glass-card hud-right-card" style={{
            position: 'absolute',
            right: 'clamp(10px, 3vw, 30px)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(5, 5, 8, 0.85)',
            border: '1px solid rgba(0, 242, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 242, 255, 0.15)',
            borderRadius: '20px',
            padding: 'clamp(12px, 2vh, 24px) clamp(16px, 3vw, 32px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '9px', opacity: 0.6, fontWeight: 900, letterSpacing: '2px', color: 'var(--secondary)' }}>DISTANCE TO GO</span>
            <h3 className="arcade-text animate-pulse" style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', margin: 0, opacity: 0.8 }}>
              TARGET: {targetKm} KM
            </h3>
            <div className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 42px)', color: '#fff', fontWeight: 900, lineHeight: 1 }}>
              {formatRemainingDistance(remainingDist)}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5, letterSpacing: '1px' }}>REMAINING</span>
          </div>
        </>
      )}

      {/* Combo */}
      {combo > 1 && (
        <div style={{ position: 'absolute', top: 'clamp(65px, 18vh, 150px)', left: '50%', transform: 'translateX(-50%)', zIndex: 11, textAlign: 'center', pointerEvents: 'none' }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(18px, 4vw, 40px)', color: 'var(--accent)', textShadow: 'none' }}>{combo}X COMBO</div>
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
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, backdropFilter: 'blur(10px)', padding: '20px' }}>
          <h2 className="arcade-text" style={{ fontSize: 'clamp(20px, 5vw, 40px)', marginBottom: 'clamp(15px, 4vh, 30px)', textAlign: 'center' }}>
            {roomId ? 'MULTIPLAYER LOBBY' : 'TRACKER'} <span style={{ color: 'var(--accent)' }}>READY</span>
          </h2>

          {roomId ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '20px 30px', display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(5, 5, 8, 0.8)' }}>
                <div>
                  <p style={{ opacity: 0.5, fontSize: '10px', fontWeight: 800 }}>YOUR CAMERA</p>
                  <p style={{ color: '#39ff14', fontWeight: 900, fontSize: '14px' }}>CONNECTED 🎥</p>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '30px' }} />
                <div>
                  <p style={{ opacity: 0.5, fontSize: '10px', fontWeight: 800 }}>OPPONENT CAMERA</p>
                  {lobbyData?.guestUid === 'simulated_ai_pro' || lobbyData?.guestCameraReady ? (
                    <p style={{ color: '#39ff14', fontWeight: 900, fontSize: '14px' }}>CONNECTED 🎥</p>
                  ) : (
                    <p style={{ color: '#ff3333', fontWeight: 900, fontSize: '14px', animation: 'pulse 1.5s infinite' }}>WAITING... 📷</p>
                  )}
                </div>
              </div>

              {role === 'host' ? (
                <button
                  className="glow-btn pulse-glow"
                  disabled={!(lobbyData?.hostCameraReady && (lobbyData?.guestCameraReady || lobbyData?.guestUid === 'simulated_ai_pro'))}
                  onClick={async () => {
                    enterFullscreen();
                    const roomRef = doc(db, "sprint_rooms", roomId);
                    await updateDoc(roomRef, {
                      status: 'countdown',
                      updatedAt: serverTimestamp()
                    });
                  }}
                  style={{
                    padding: 'clamp(12px, 3vh, 25px) clamp(30px, 8vw, 60px)',
                    fontSize: 'clamp(16px, 4vw, 24px)',
                    cursor: (lobbyData?.hostCameraReady && (lobbyData?.guestCameraReady || lobbyData?.guestUid === 'simulated_ai_pro')) ? 'pointer' : 'not-allowed',
                    opacity: (lobbyData?.hostCameraReady && (lobbyData?.guestCameraReady || lobbyData?.guestUid === 'simulated_ai_pro')) ? 1 : 0.5
                  }}
                >
                  START SYNCED RACE ⚡
                </button>
              ) : (
                <div style={{
                  padding: '16px 40px',
                  borderRadius: '30px',
                  background: 'rgba(57, 255, 20, 0.05)',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                  color: '#39ff14',
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-gaming)',
                  animation: 'pulse 2s infinite'
                }}>
                  WAITING FOR HOST TO TRIGGER START...
                </div>
              )}
            </div>
          ) : (
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
                  if (refereeAudioRef.current) {
                    refereeAudioRef.current.currentTime = 0;
                    refereeAudioRef.current.play().catch(e => console.log("Audio play error:", e));
                  }
                }
              }, 1000);
            }} style={{ padding: 'clamp(12px, 3vh, 25px) clamp(30px, 8vw, 60px)', fontSize: 'clamp(16px, 4vw, 24px)' }}>START RACE ⚡</button>
          )}
        </div>
      )}

      {/* COUNTDOWN */}
      {gameStateDisplay === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
          <div className="arcade-text" style={{ fontSize: 'clamp(70px, 25vh, 180px)', color: 'var(--accent)', filter: 'drop-shadow(0 0 50px var(--accent))' }}>{countdown}</div>
        </div>
      )}

      {gameStateDisplay === 'calibration' && (
        <PositionCalibration 
          mode={mode}
          onCalibrated={() => handleCalibrationComplete()}
          onSkip={() => handleCalibrationComplete()}
        />
      )}

      {/* QUIT CONFIRMATION MODAL */}
      {activeOverlayModal === 'quit_confirm' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 5, 10, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          backdropFilter: 'blur(12px)',
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(25, 25, 30, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '24px',
              padding: '30px 40px',
              width: '100%',
              maxWidth: '450px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255, 68, 68, 0.05)'
            }}
          >
            <h2 className="arcade-text" style={{ fontSize: '24px', color: '#ff4444', margin: '0 0 15px 0', textShadow: 'none' }}>QUIT MATCH?</h2>
            <p style={{ opacity: 0.8, fontSize: '13px', lineHeight: 1.5, color: '#fff', marginBottom: '25px' }}>
              Are you sure you want to quit the sprint? Your completed reps will be saved and progress evaluated compared to your previous best.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setActiveOverlayModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '30px',
                  color: '#fff',
                  padding: '12px 25px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  handleMatchEnd(repsCount, true);
                }}
                style={{
                  background: 'linear-gradient(90deg, #ff4444 0%, #ff0055 100%)',
                  border: 'none',
                  borderRadius: '30px',
                  color: '#fff',
                  padding: '12px 25px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '12px',
                  boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                CONFIRM QUIT 🏃
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PERFORMANCE COMPARISON SUMMARY MODAL */}
      {activeOverlayModal === 'performance_summary' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(2, 2, 5, 0.94)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          backdropFilter: 'blur(16px)',
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(22, 22, 28, 0.96) 0%, rgba(10, 10, 14, 0.98) 100%)',
              border: `1.5px solid ${comparisonDetails.status === 'improved' ? '#39ff14' : comparisonDetails.status === 'less' ? '#ff3366' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '28px',
              padding: 'clamp(20px, 4vh, 40px) clamp(20px, 5vw, 50px)',
              width: '100%',
              maxWidth: '520px',
              textAlign: 'center',
              boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 30px ${comparisonDetails.status === 'improved' ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.03)'}`
            }}
          >
            {/* Achievement Header */}
            <h2 className="arcade-text" style={{
              fontSize: 'clamp(20px, 4.5vw, 32px)',
              color: comparisonDetails.winner === 'PLAYER' ? '#39ff14' : comparisonDetails.isQuit ? '#ffffff' : '#ff3366',
              margin: '0 0 8px 0',
              letterSpacing: '1px',
              textShadow: 'none'
            }}>
              {comparisonDetails.isQuit ? 'MATCH FORFEITED' : comparisonDetails.winner === 'PLAYER' ? '🏆 YOU WON!' : '💥 YOU LOST'}
            </h2>
            <p style={{ opacity: 0.6, fontSize: '11px', letterSpacing: '1px', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              SESSION METRICS & TELEMETRY PROGRESS
            </p>

            {/* Comparative Telemetry Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Progress Message */}
              <div style={{
                fontSize: '13px',
                fontWeight: 800,
                lineHeight: 1.45,
                textAlign: 'center',
                color: comparisonDetails.status === 'improved' ? '#39ff14' : '#fff',
                borderBottom: '1px dashed rgba(255,255,255,0.08)',
                paddingBottom: '10px'
              }}>
                {comparisonDetails.message}
              </div>

              {/* Comparative reps score stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginTop: '4px' }}>
                <div>
                  <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800 }}>PREVIOUS BEST</div>
                  <div className="arcade-text" style={{ fontSize: '18px', color: '#fff', marginTop: '2px', textShadow: 'none' }}>
                    {comparisonDetails.previous}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800 }}>CURRENT RUN</div>
                  <div className="arcade-text" style={{ fontSize: '20px', color: '#39ff14', marginTop: '2px', textShadow: 'none' }}>
                    {comparisonDetails.current}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800 }}>PROGRESS</div>
                  <div className="arcade-text" style={{ 
                    fontSize: '18px', 
                    color: comparisonDetails.diff > 0 ? '#39ff14' : comparisonDetails.diff < 0 ? '#ff3366' : '#fff', 
                    marginTop: '2px',
                    textShadow: 'none'
                  }}>
                    {comparisonDetails.diff > 0 ? `+${comparisonDetails.diff}` : comparisonDetails.diff < 0 ? `${comparisonDetails.diff}` : '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry metrics (Calories & XP) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '12px'
              }}>
                <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800 }}>CALORIES BURNED</div>
                <div className="arcade-text" style={{ fontSize: '18px', color: '#ff4444', marginTop: '4px', textShadow: 'none' }}>
                  {Math.round(comparisonDetails.current * 0.45 + (comparisonDetails.isQuit ? 0 : targetKm * 10))} KCAL
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '12px'
              }}>
                <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800 }}>XP ACQUIRED</div>
                <div className="arcade-text" style={{ fontSize: '18px', color: '#ffd700', marginTop: '4px', textShadow: 'none' }}>
                  +{Math.round(comparisonDetails.current * 6 + (comparisonDetails.isQuit ? 0 : targetKm * 50))} XP
                </div>
              </div>
            </div>

            {/* CTA button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${comparisonDetails.status === 'improved' ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255,255,255,0.2)'}` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                exitFullscreen();
                const finalStats = {
                  reps: comparisonDetails.current,
                  calories: comparisonDetails.current * 0.45 + (comparisonDetails.isQuit ? 0 : targetKm * 10),
                  xp: comparisonDetails.current * 6 + (comparisonDetails.isQuit ? 0 : targetKm * 50)
                };
                if (comparisonDetails.isQuit) {
                  if (onQuit) onQuit(finalStats);
                  else if (onComplete) onComplete(finalStats);
                } else {
                  if (onComplete) onComplete(finalStats);
                  else window.location.reload();
                }
              }}
              style={{
                background: comparisonDetails.status === 'improved' 
                  ? 'linear-gradient(90deg, #39ff14 0%, #00ff88 100%)' 
                  : 'linear-gradient(90deg, #ffffff 0%, #e0e0e0 100%)',
                color: '#000',
                border: 'none',
                padding: '14px clamp(30px, 8vw, 60px)',
                borderRadius: '30px',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-gaming)',
                letterSpacing: '1px'
              }}
            >
              DONE & CLAIM REWARDS 🚀
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default memo(FitnessRace);
