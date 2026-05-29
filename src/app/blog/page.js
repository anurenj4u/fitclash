"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Clock, Calendar, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { posts } from '@/data/posts';

export default function BlogHome() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #0d0d20 0%, #05050b 70%)',
      color: '#ffffff',
      padding: '40px 20px 80px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-gaming)'
    }}>
      {/* Background Neon Grid Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Futuristic Floating Ambient Particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 2 === 0 ? '6px' : '4px',
          height: i % 2 === 0 ? '6px' : '4px',
          background: '#39ff14',
          opacity: 0.15,
          borderRadius: '50%',
          top: `${20 + i * 12}%`,
          left: `${10 + i * 15}%`,
          boxShadow: '0 0 10px #39ff14',
          animation: 'pulse-glow 3s infinite ease-in-out',
          animationDelay: `${i * 0.4}s`,
          zIndex: 1
        }} />
      ))}

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
          <Link href="/">
            <motion.span
              whileHover={{ x: -4, color: '#39ff14' }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              <ArrowLeft size={14} /> Back to Arena
            </motion.span>
          </Link>
        </div>

        {/* Hero Title Area */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(57, 255, 20, 0.08)', border: '1px solid rgba(57, 255, 20, 0.25)', padding: '6px 14px', borderRadius: '20px', marginBottom: '20px' }}
          >
            <Sparkles size={12} color="#39ff14" style={{ filter: 'drop-shadow(0 0 4px #39ff14)' }} />
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#39ff14', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              ATHLETE INTEL LIBRARY
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="arcade-text"
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              margin: '0 0 16px 0',
              lineHeight: 1.1,
              letterSpacing: '1px',
              textShadow: '0 0 25px rgba(57, 255, 20, 0.15)',
              background: 'linear-gradient(180deg, #ffffff 0%, #a5f3fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            CLASH OF CARDIO INTEL
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            Unlock pro-form tutorials, home cardio science, calorie targets, and dynamic stamina strategies designed to maximize your VO2 Max.
          </motion.p>
        </div>

        {/* Articles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          width: '100%'
        }}>
          {posts.map((post, idx) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -6, scale: 1.01 }}
              style={{
                background: 'rgba(10, 10, 18, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '20px',
                overflow: 'hidden',
                backdropFilter: 'blur(16px)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.35)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(57, 255, 20, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4)';
              }}
            >
              {/* Cover Image Container */}
              <div style={{ width: '100%', height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={post.coverImage} 
                  alt={post.title} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                />
                
                {/* Category Badge overlay */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(5, 5, 10, 0.9)',
                  border: '1px solid rgba(57, 255, 20, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '8px',
                  fontWeight: 900,
                  color: '#39ff14',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  {post.category}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                
                {/* Read time and Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} /> {post.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> {post.readTime}
                  </span>
                </div>

                {/* Article Title */}
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '10px',
                  lineHeight: 1.3,
                  fontFamily: 'var(--font-gaming)'
                }}>
                  {post.title}
                </h2>

                {/* Article description */}
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                  flex: 1
                }}>
                  {post.description}
                </p>

                {/* Author credentials & Link button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {post.author.avatar}
                    </div>
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 700 }}>{post.author.name}</span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <motion.span
                      whileHover={{ color: '#39ff14' }}
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      READ PROTOCOL <BookOpen size={10} />
                    </motion.span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
