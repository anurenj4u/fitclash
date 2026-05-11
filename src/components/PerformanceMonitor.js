"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const requestRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      setIsVisible(true);
      lastTimeRef.current = performance.now();
      
      const loop = (time) => {
        frameCountRef.current += 1;
        const elapsed = time - lastTimeRef.current;
        
        if (elapsed >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / elapsed));
          frameCountRef.current = 0;
          lastTimeRef.current = time;

          // @ts-ignore
          if (performance.memory) {
            // @ts-ignore
            setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
          }
        }
        requestRef.current = requestAnimationFrame(loop);
      };

      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(0,0,0,0.8)',
      color: '#0f0',
      padding: '5px 10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      pointerEvents: 'none',
      borderBottomRightRadius: '5px'
    }}>
      FPS: {fps} | Mem: {memory}MB
    </div>
  );
}
