'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#A0A0A0] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 122, 204, 0.05) 0%, transparent 60%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ScrambleText
              text="Cursor Chat"
              className="text-7xl md:text-9xl font-bold mb-4"
            />
            <motion.h2
              className="text-2xl md:text-3xl text-[#606060] mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              on mobile
            </motion.h2>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-[#707070] mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            AI coding assistance in your pocket. Continue your Cursor conversations anywhere.
          </motion.p>

          {/* 3D Rotating Box Carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mb-16"
          >
            <BoxCarousel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Link href="/chat">
              <motion.button
                className="px-8 py-3 bg-[#007ACC] text-white rounded-md font-medium text-base hover:bg-[#1A8AD9] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative border-t border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto text-center text-[#505050] text-sm">
          <p>HackUTD 2025</p>
        </div>
      </footer>
    </div>
  );
}

// 3D Box Carousel Component (Fancy Component-inspired)
function BoxCarousel() {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentRotation = useRef(0);

  const items = [
    { icon: '💬', label: 'Chat' },
    { icon: '⚡', label: 'Fast' },
    { icon: '🔄', label: 'Sync' },
    { icon: '🔒', label: 'Secure' },
  ];

  const radius = 200;
  const itemAngle = 360 / items.length;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    currentRotation.current = rotation;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    currentRotation.current = rotation;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      setRotation(currentRotation.current + delta * 0.5);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const delta = e.touches[0].clientX - startX.current;
      setRotation(currentRotation.current + delta * 0.5);
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [rotation]);

  // Auto-rotate effect
  useEffect(() => {
    if (isDragging.current) return;

    const interval = setInterval(() => {
      setRotation((prev) => prev + 0.3);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-full h-80 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="relative w-full h-full"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, index) => {
          const angle = (index * itemAngle + rotation) * (Math.PI / 180);
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          const rotateY = index * itemAngle + rotation;
          const scale = (z + radius) / (radius * 2);
          const opacity = Math.max(0.3, scale);

          return (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 w-32 h-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex flex-col items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
                opacity,
                zIndex: Math.round(z),
              }}
            >
              <div className="text-4xl mb-2">{item.icon}</div>
              <div className="text-sm text-[#707070]">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Scramble Text Component (Fancy Component-inspired)
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <h1 className={className}>{displayText}</h1>;
}

// Feature Card Component
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-[#A0A0A0] mb-3">
        <span className="text-4xl">{feature.icon}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[#A0A0A0]">
        {feature.title}
      </h3>
      <p className="text-sm text-[#606060] leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}

// Data
const features = [
  {
    icon: '💬',
    title: 'Chat Interface',
    description: 'Familiar Cursor chat experience optimized for mobile screens'
  },
  {
    icon: '🔄',
    title: 'Sync Sessions',
    description: 'Continue conversations from your desktop on the go'
  },
  {
    icon: '🔒',
    title: 'Secure',
    description: 'Enterprise-grade authentication with Auth0'
  },
];
