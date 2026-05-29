import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, ShieldCheck, Flame } from 'lucide-react';
import { posts } from '@/data/posts';

// Pre-generate all static article pages at build time for instant Google crawling speed
export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate high-fidelity dynamic metadata for search engines
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = posts.find((p) => p.slug === resolvedParams.slug);
  
  if (!post) {
    return {
      title: "Article Not Found | Clash of Cardio",
      description: "The requested fitness protocol could not be found."
    };
  }

  return {
    title: `${post.title} | Clash of Cardio`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `https://clashofcardio.fit/blog/${post.slug}`,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.coverImage],
    }
  };
}

export default async function BlogPost({ params }) {
  const resolvedParams = await params;
  const post = posts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#05050b',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-gaming)'
      }}>
        <h1 className="arcade-text" style={{ color: '#ff3366' }}>PROTOCOL NOT FOUND</h1>
        <p style={{ opacity: 0.6, margin: '15px 0 30px 0' }}>The requested article does not exist or has been archived.</p>
        <Link href="/blog" style={{ color: '#39ff14', textDecoration: 'none', border: '1px solid #39ff14', padding: '10px 20px', borderRadius: '20px' }}>
          Back to Intel Library
        </Link>
      </div>
    );
  }

  // Create JSON-LD structured data for Google Crawlers
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.coverImage,
    "datePublished": "2026-05-29T12:00:00Z",
    "dateModified": "2026-05-29T12:00:00Z",
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Clash of Cardio",
      "logo": {
        "@type": "ImageObject",
        "url": "https://clashofcardio.fit/icon.png"
      }
    }
  };

  return (
    <article style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 5%, #0e0e24 0%, #05050a 60%)',
      color: '#ffffff',
      padding: '40px 20px 80px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-gaming)'
    }}>
      {/* Google SEO JSON-LD schema payload */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Grid Scanlines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        
        {/* Navigation header */}
        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
          <Link href="/blog" style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              cursor: 'pointer',
              fontWeight: 800,
              transition: 'color 0.2s'
            }}>
              <ArrowLeft size={12} /> Back to Library
            </span>
          </Link>
        </div>

        {/* Article header details */}
        <div style={{ textAlign: 'left', marginBottom: '35px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(57, 255, 20, 0.08)', border: '1px solid rgba(57, 255, 20, 0.25)', padding: '5px 12px', borderRadius: '6px', marginBottom: '20px' }}>
            <span style={{ fontSize: '8px', fontWeight: 900, color: '#39ff14', letterSpacing: '1.5px' }}>
              INTEL PROTOCOL // {post.category.toUpperCase()}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(22px, 5.5vw, 36px)',
            fontWeight: 900,
            lineHeight: 1.2,
            marginBottom: '20px',
            color: '#fff',
            fontFamily: 'var(--font-gaming)',
            letterSpacing: '0.5px'
          }}>
            {post.title}
          </h1>

          {/* Reading and author metrics row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {post.author.avatar}
              </div>
              <span style={{ fontWeight: 700, color: '#fff' }}>{post.author.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} /> {post.date}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} /> {post.readTime}
            </div>
          </div>
        </div>

        {/* Big Premium Cover Image */}
        <div style={{
          width: '100%',
          height: 'clamp(200px, 45vh, 400px)',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
          marginBottom: '45px'
        }}>
          <img 
            src={post.coverImage} 
            alt={post.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Article Body */}
        <div 
          className="blog-content-renderer"
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{
            textAlign: 'left',
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'rgba(255, 255, 255, 0.85)',
            letterSpacing: '0.2px'
          }}
        />

        {/* Article Footer Signoff */}
        <div style={{
          marginTop: '60px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(57, 255, 20, 0.15)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            background: 'rgba(57, 255, 20, 0.08)',
            border: '1.5px solid rgba(57, 255, 20, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(57,255,20,0.1)'
          }}>
            <ShieldCheck size={22} color="#39ff14" style={{ filter: 'drop-shadow(0 0 3px #39ff14)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#39ff14', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              INTEL PROTOCOL VERIFIED
            </span>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.6, lineHeight: 1.4 }}>
              This article was calibrated by certified fitness pros to integrate precisely with the Clash of Cardio tracking systems.
            </p>
          </div>
        </div>

      </div>

      {/* Styled Markdown content inject */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-content-renderer h2 {
          font-size: 21px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 35px;
          margin-bottom: 15px;
          font-family: var(--font-gaming);
          border-left: 3px solid #39ff14;
          padding-left: 12px;
          line-height: 1.3;
          letter-spacing: 0.5px;
        }
        .blog-content-renderer h3 {
          font-size: 17px;
          font-weight: 800;
          color: #39ff14;
          margin-top: 25px;
          margin-bottom: 10px;
          font-family: var(--font-gaming);
        }
        .blog-content-renderer p {
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.85);
        }
        .blog-content-renderer ul {
          margin-bottom: 25px;
          padding-left: 20px;
          list-style: none;
        }
        .blog-content-renderer ul li {
          margin-bottom: 12px;
          position: relative;
          color: rgba(255, 255, 255, 0.85);
        }
        .blog-content-renderer ul li::before {
          content: "⚡";
          position: absolute;
          left: -20px;
          color: #39ff14;
          font-size: 10px;
        }
        .blog-content-renderer strong {
          color: #ffffff;
          font-weight: 800;
        }
        .blog-content-renderer em {
          font-style: italic;
          color: rgba(255, 255, 255, 0.6);
        }
      `}} />
    </article>
  );
}
