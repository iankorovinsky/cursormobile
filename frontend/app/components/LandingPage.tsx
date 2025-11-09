'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#1C1C1C] text-[#CCCCCC] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 122, 204, 0.15) 0%, transparent 50%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 80% 20%, rgba(0, 122, 204, 0.1) 0%, transparent 40%)',
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(51,51,51,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(51,51,51,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <motion.div
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
          style={{ opacity, scale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-[#CCCCCC] via-[#007ACC] to-[#CCCCCC] bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% auto',
              }}
              animate={{
                backgroundPosition: ['0% center', '100% center', '0% center'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Code Smarter,
              <br />
              Build Faster
            </motion.h1>
          </motion.div>

          <motion.p
            className="text-xl md:text-2xl text-[#808080] mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            The AI-powered mobile coding assistant that brings the power of Cursor IDE to your fingertips.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Link href="/chat">
              <motion.button
                className="px-8 py-4 bg-[#007ACC] text-white rounded-lg font-semibold text-lg relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-[#1A8AD9]"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
            <motion.button
              className="px-8 py-4 bg-[#242424] text-[#CCCCCC] rounded-lg font-semibold text-lg border border-[#333333]"
              whileHover={{ scale: 1.05, borderColor: '#007ACC' }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Floating code snippet preview */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="bg-[#242424] border border-[#333333] rounded-xl p-6 max-w-2xl mx-auto shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28CA42]" />
              </div>
              <div className="font-mono text-sm text-left">
                <div className="text-[#6B6B6B]">// AI-powered code completion</div>
                <div className="text-[#007ACC]">function</div>{' '}
                <span className="text-[#CCCCCC]">buildAmazingApp</span>
                <span className="text-[#808080]">() {'{'}</span>
                <div className="pl-4">
                  <span className="text-[#007ACC]">return</span>{' '}
                  <span className="text-[#CE9178]">&apos;Magic happens here&apos;</span>
                  <span className="text-[#808080]">;</span>
                </div>
                <div className="text-[#808080]">{'}'}</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-[#333333] rounded-full p-1">
            <motion.div
              className="w-1.5 h-1.5 bg-[#007ACC] rounded-full mx-auto"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Everything you need,
              <br />
              <span className="text-[#007ACC]">at your fingertips</span>
            </h2>
            <p className="text-xl text-[#808080] max-w-2xl mx-auto">
              Powerful features designed to supercharge your mobile development workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-[#242424] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,122,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,122,204,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to transform
            <br />
            your coding workflow?
          </h2>
          <p className="text-xl text-[#808080] mb-12">
            Join thousands of developers building better apps faster
          </p>
          <Link href="/chat">
            <motion.button
              className="px-12 py-5 bg-[#007ACC] text-white rounded-lg font-semibold text-xl relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Start Coding Now</span>
              <motion.div
                className="absolute inset-0 bg-[#1A8AD9]"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#333333]">
        <div className="max-w-7xl mx-auto text-center text-[#6B6B6B]">
          <p>Built with Next.js, Tailwind CSS, and Framer Motion</p>
          <p className="mt-2">HackUTD 2025</p>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <div className="bg-[#242424] border border-[#333333] rounded-2xl p-8 h-full relative overflow-hidden transition-all duration-300 group-hover:border-[#007ACC]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#007ACC]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        <div className="relative z-10">
          <motion.div
            className="w-14 h-14 bg-[#007ACC]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#007ACC]/20 transition-colors duration-300"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-3xl">{feature.icon}</span>
          </motion.div>

          <h3 className="text-2xl font-bold mb-4 group-hover:text-[#007ACC] transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-[#808080] leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Stats Card Component
function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <motion.div
        className="text-5xl md:text-6xl font-bold text-[#007ACC] mb-2"
        whileInView={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
        viewport={{ once: true }}
      >
        {stat.value}
      </motion.div>
      <div className="text-lg text-[#808080]">{stat.label}</div>
    </motion.div>
  );
}

// Data
const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Assistance',
    description: 'Get intelligent code suggestions and completions powered by advanced AI models, right on your mobile device.'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Optimized for mobile performance with instant responses and seamless interactions.'
  },
  {
    icon: '🎨',
    title: 'Beautiful Interface',
    description: 'Cursor-inspired dark theme with smooth animations and intuitive mobile-first design.'
  },
  {
    icon: '💬',
    title: 'Natural Chat',
    description: 'Interact with your code using natural language. Ask questions, request changes, or debug issues.'
  },
  {
    icon: '📱',
    title: 'Mobile Optimized',
    description: 'Built from the ground up for mobile devices with responsive design and touch-friendly controls.'
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    description: 'Your code stays private with enterprise-grade security and encrypted communications.'
  },
];

const stats = [
  { value: '10K+', label: 'Developers' },
  { value: '1M+', label: 'Lines of Code' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];
