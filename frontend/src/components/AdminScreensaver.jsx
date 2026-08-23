import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SETTINGS = {
  image_a_url: '/legacy-assets/2mxzmwy8_logo-bubble-for-sleep-screen.png',
  image_b_url: '/legacy-assets/71zcw0f9_logo-bubble-for-sleep-screen-2.png',
  image_a_count: 15,
  image_b_count: 15,
  video_url: 'https://cdn.coverr.co/videos/coverr-waves-in-slow-motion-1579/1080p.mp4',
};

const generateBubble = (id, containerWidth, containerHeight, imageUrl) => {
  const size = Math.random() * 60 + 40; // 40-100px
  return {
    id,
    x: Math.random() * (containerWidth - size),
    y: Math.random() * (containerHeight - size),
    vx: (Math.random() - 0.5) * 4, // -2 to 2
    vy: (Math.random() - 0.5) * 4,
    size,
    image: imageUrl,
    opacity: Math.random() * 0.4 + 0.6, // 0.6-1.0
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 2,
  };
};

const createBubbleImageList = (settings) => {
  const imageA = settings.image_a_url || DEFAULT_SETTINGS.image_a_url;
  const imageB = settings.image_b_url || DEFAULT_SETTINGS.image_b_url;
  const countA = Math.max(0, Math.min(60, Number(settings.image_a_count) || 0));
  const countB = Math.max(0, Math.min(60, Number(settings.image_b_count) || 0));

  return [
    ...Array.from({ length: countA }, () => imageA),
    ...Array.from({ length: countB }, () => imageB),
  ];
};

const AdminScreensaver = ({ onDismiss }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const [screensaverSettings, setScreensaverSettings] = useState(DEFAULT_SETTINGS);
  const [bubbles, setBubbles] = useState([]);
  const [particles] = useState(() => Array.from({ length: 40 }, (_, index) => ({
    id: `particle-${index}`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  })));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchScreensaverSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${API}/admin-settings/screensaver`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setScreensaverSettings((prev) => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        setScreensaverSettings(DEFAULT_SETTINGS);
      }
    };

    fetchScreensaverSettings();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const imageList = createBubbleImageList(screensaverSettings);
    setBubbles(
      imageList.map((imageUrl, index) =>
        generateBubble(index, dimensions.width, dimensions.height, imageUrl)
      )
    );
  }, [dimensions, screensaverSettings]);

  useEffect(() => {
    if (bubbles.length === 0 || dimensions.width === 0) return;

    const animate = () => {
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          let { x, y, vx, vy, size, rotation, rotationSpeed } = bubble;
          
          // Update position
          x += vx;
          y += vy;
          rotation += rotationSpeed;

          // Bounce off walls
          if (x <= 0 || x >= dimensions.width - size) {
            vx = -vx * 0.95; // Slight energy loss
            x = x <= 0 ? 0 : dimensions.width - size;
          }
          if (y <= 0 || y >= dimensions.height - size) {
            vy = -vy * 0.95;
            y = y <= 0 ? 0 : dimensions.height - size;
          }

          // Add slight random movement for more organic feel
          vx += (Math.random() - 0.5) * 0.1;
          vy += (Math.random() - 0.5) * 0.1;

          // Clamp velocity
          vx = Math.max(-4, Math.min(4, vx));
          vy = Math.max(-4, Math.min(4, vy));

          return { ...bubble, x, y, vx, vy, rotation };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, bubbles.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black cursor-pointer overflow-hidden"
      onClick={handleDismiss}
      onMouseMove={handleDismiss}
      onKeyDown={handleDismiss}
      onTouchStart={handleDismiss}
      tabIndex={0}
      data-testid="admin-screensaver"
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        data-testid="screensaver-video-background"
      >
        <source src={screensaverSettings.video_url || DEFAULT_SETTINGS.video_url} type="video/mp4" />
        <source src="https://cdn.coverr.co/videos/coverr-waves-in-slow-motion-1579/1080p.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for better bubble visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1d0432]/60 via-[#37105a]/50 to-[#130320]/60" />

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/15 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Bouncing Logo Bubbles */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute pointer-events-none"
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            opacity: bubble.opacity,
            transform: `rotate(${bubble.rotation}deg)`,
            transition: 'none',
          }}
        >
          <img
            src={bubble.image}
            alt=""
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]"
            style={{
              filter: `drop-shadow(0 0 ${bubble.size / 4}px rgba(217, 168, 87, 0.4))`,
            }}
          />
        </div>
      ))}

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gold-400/60 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/50 text-sm animate-pulse tracking-wide">
          Move mouse or tap to wake up
        </p>
      </div>

      {/* CSS Animation for floating particles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) translateX(-5px);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-30px) translateX(-10px);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminScreensaver;
