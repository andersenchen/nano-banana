"use client";

import { useEffect, useState } from "react";

interface TransformLoadingProgressProps {
  isVisible: boolean;
  onCancel?: () => void;
  isCompleted?: boolean;
}

const loadingMessages = [
  "🍌 Peeling back the layers...",
  "✨ Sprinkling AI magic...",
  "🎨 Mixing the perfect pixels...",
  "🔮 Consulting the banana oracle...",
  "⚡ Charging up the transformation...",
  "🎭 Applying creative filters...",
  "🌟 Weaving digital dreams...",
  "🎪 Setting up the pixel circus...",
  "🧙‍♂️ Casting transformation spells...",
  "🚀 Launching creativity engines..."
];

export default function TransformLoadingProgress({ 
  isVisible, 
  onCancel,
  isCompleted = false
}: TransformLoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * loadingMessages.length));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setMessageIndex(Math.floor(Math.random() * loadingMessages.length));
      setIsTransitioning(false);
      setShouldPulse(false);
      return;
    }

    if (isCompleted) {
      setProgress(100);
      return;
    }

    const start = Date.now();

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        
        const elapsed = (Date.now() - start) / 1000; // seconds elapsed
        
        // Psychological progression formula
        // Fast start: 0-40% in first 3 seconds
        // Medium: 40-80% in next 5 seconds  
        // Slow: 80-95% asymptotically
        let targetProgress;
        
        if (elapsed < 3) {
          // Fast initial burst - get to 40% quickly
          targetProgress = 40 * (1 - Math.exp(-elapsed * 1.5));
        } else if (elapsed < 8) {
          // Medium speed middle section
          const middleElapsed = elapsed - 3;
          targetProgress = 40 + 40 * (1 - Math.exp(-middleElapsed * 0.8));
        } else {
          // Slow asymptotic approach to 95%
          const slowElapsed = elapsed - 8;
          targetProgress = 80 + 15 * (1 - Math.exp(-slowElapsed * 0.3));
        }
        
        // Add small random bursts for psychological effect
        const burstChance = Math.random();
        const burstMultiplier = burstChance < 0.1 ? 1.3 : 1;
        
        // Smooth transition to target with micro-animations
        const diff = targetProgress - prev;
        const increment = Math.min(diff * 0.4 * burstMultiplier, 8);
        
        const newProgress = Math.min(prev + Math.max(increment, 0.1), 95);
        
        // Trigger pulse effect at milestones
        const crossedMilestone = 
          (prev < 25 && newProgress >= 25) ||
          (prev < 50 && newProgress >= 50) ||
          (prev < 75 && newProgress >= 75);
          
        if (crossedMilestone) {
          setShouldPulse(true);
          setTimeout(() => setShouldPulse(false), 600);
        }
        
        return newProgress;
      });
    }, 100); // More frequent updates for smoother animation

    const messageInterval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        setIsTransitioning(false);
      }, 150);
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isVisible, isCompleted]);

  if (!isVisible) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="mb-2">
        <span className={`text-sm transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'} ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
          {isCompleted ? '✨ Complete!' : loadingMessages[messageIndex]}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 relative overflow-hidden">
        <div 
          className={`bg-yellow-600 h-full rounded-full transition-all duration-300 ease-out relative ${shouldPulse ? 'animate-pulse' : ''}`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          {shouldPulse && (
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping" />
          )}
        </div>
      </div>
      {onCancel && (
        <div className="text-center mt-2">
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground underline hover:no-underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}