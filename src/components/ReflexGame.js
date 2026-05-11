"use client";
import React, { useEffect, useRef, useState } from 'react';

const ReflexGame = ({ poseData, mode }) => {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const previousRepsRef = useRef(0);

  useEffect(() => {
    if (gameRef.current) return;
    gameRef.current = 'loading'; // Immediate flag to prevent double trigger
    
    let game;
    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;
      
      // If component unmounted while loading Phaser, stop here
      if (gameRef.current === null) return;

      const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-game',
        transparent: true,
        physics: {
          default: 'arcade',
          arcade: { gravity: { y: 0 } }
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
      }

      function create() {
        scene = this;
        balls = this.physics.add.group();
        
        // Grass Pitch (Bottom)
        const grass = this.add.rectangle(0, window.innerHeight - 200, window.innerWidth, 200, 0x1e5631, 1).setOrigin(0);
        this.add.line(0, window.innerHeight - 200, 0, 0, window.innerWidth, 0, 0x39ff14, 0.5).setOrigin(0);

        // Dynamic UI based on Mode
        let goalWidth = 500;
        let goalHeight = 250;
        let goalColor = 0x39ff14;

        if (mode === 'squats') {
          goalWidth = 350;
          goalHeight = 150;
          goalColor = 0xffff00;
        } else if (mode === 'jacks') {
          goalWidth = window.innerWidth - 100;
          goalHeight = 300;
          goalColor = 0x00f2ff;
        }

        const goalX = window.innerWidth / 2;
        const goalY = 150;

        // Draw Net
        const netGraphics = this.add.graphics();
        netGraphics.lineStyle(1, 0xffffff, 0.3);
        const netStep = 20;
        for (let gx = goalX - goalWidth/2; gx <= goalX + goalWidth/2; gx += netStep) {
          netGraphics.lineBetween(gx, goalY - goalHeight/2, gx, goalY + goalHeight/2);
        }
        for (let gy = goalY - goalHeight/2; gy <= goalY + goalHeight/2; gy += netStep) {
          netGraphics.lineBetween(goalX - goalWidth/2, gy, goalX + goalWidth/2, gy);
        }

        // Crossbar and Posts
        goal = this.add.rectangle(goalX, goalY, goalWidth, goalHeight, 0xffffff, 0.05);
        goal.setStrokeStyle(10, 0xffffff); // White metal posts
        this.physics.add.existing(goal, true);

        // Keeper (Neymar)
        keeper = this.add.sprite(goalX, goalY + goalHeight/2 - 40, 'keeper');
        keeper.setScale(0.15);
        this.physics.add.existing(keeper);
        keeper.body.setCollideWorldBounds(true);
        keeper.body.setBounce(1, 1);
        keeper.body.setVelocityX(300);

        feedbackText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'KICK-OFF!', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '40px',
          color: '#fff'
        }).setOrigin(0.5);

        this.physics.add.overlap(balls, goal, (g, b) => {
          b.destroy();
          setScore(prev => prev + 1);
          showFeedback("GOAL!!!", goalColor);
        }, null, this);

        this.physics.add.overlap(balls, keeper, (k, b) => {
          b.destroy();
          showFeedback("SAVED!", "#ff00ff");
        }, null, this);

        this.kickBall = function() {
          const x = window.innerWidth / 2;
          const y = window.innerHeight - 150;
          const ball = scene.add.circle(x, y, 30, 0xffffff);
          ball.setStrokeStyle(5, 0x333333);
          balls.add(ball);
          scene.physics.add.existing(ball);
          
          let speed = 1000;
          let targetX = Phaser.Math.Between(goalX - goalWidth/2 + 40, goalX + goalWidth/2 - 40);
          scene.physics.moveTo(ball, targetX, goalY, speed);
          
          // Ball scale effect (getting smaller as it travels)
          scene.tweens.add({
            targets: ball,
            scale: 0.5,
            duration: 600,
            ease: 'Power1'
          });
        };
      }

      function showFeedback(text, color) {
        feedbackText.setText(text);
        feedbackText.setColor(color);
        feedbackText.setScale(1.5);
        scene.tweens.add({
          targets: feedbackText,
          scale: 1,
          duration: 200,
          ease: 'Power2'
        });
      }

      function update() {
        if (keeper && keeper.body) {
          const speed = 200 + (score * 20);
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
      const { reps } = e.detail;
      if (reps > previousRepsRef.current) {
        setReps(reps);
        previousRepsRef.current = reps;
        if (gameRef.current && gameRef.current.scene.scenes[0]) {
          gameRef.current.scene.scenes[0].kickBall();
        }
      }
    };
    
    window.addEventListener('pose-update', handlePoseUpdate);
    return () => window.removeEventListener('pose-update', handlePoseUpdate);
  }, []);

  return (
    <div id="phaser-game" style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <div className="score-panel arcade-text" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', width: 'auto', display: 'flex', gap: '40px' }}>
        <div style={{ color: 'var(--accent)' }}>GOALS: {score}</div>
        <div style={{ color: '#fff' }}>REPS: {reps}</div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>MODE: {mode.toUpperCase()}</div>
      </div>
    </div>
  );
};

export default ReflexGame;
