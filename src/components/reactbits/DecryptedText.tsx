// ============================================================
// React Bits — DecryptedText (https://github.com/DavidHDev/react-bits)
// Crisp monospace scramble-to-text reveal for terminal labels.
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: 'hover' | 'view' | 'both';
}

export default function DecryptedText({
  text,
  speed = 32,
  maxIterations = 8,
  sequential = true,
  revealDirection = 'start',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%$.+-',
  className = '',
  encryptedClassName = 'opacity-60',
  parentClassName = '',
  animateOn = 'view',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setDisplayText(text);
    setRevealedIndices(new Set());
    if (animateOn === 'view' || animateOn === 'both') {
      setHasAnimated(false);
    }
  }, [text, animateOn]);

  useEffect(() => {
    let interval: number | undefined;
    let currentIteration = 0;

    const getNextIndex = (revealed: Set<number>): number => {
      const len = text.length;
      if (revealDirection === 'end') return len - 1 - revealed.size;
      if (revealDirection === 'center') {
        const middle = Math.floor(len / 2);
        const offset = Math.floor(revealed.size / 2);
        const nextIndex = revealed.size % 2 === 0 ? middle + offset : middle - offset - 1;
        if (nextIndex >= 0 && nextIndex < len && !revealed.has(nextIndex)) return nextIndex;
        for (let i = 0; i < len; i++) if (!revealed.has(i)) return i;
        return 0;
      }
      return revealed.size;
    };

    const availableChars = characters.split('');
    const shuffleText = (original: string, revealed: Set<number>) =>
      original
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (revealed.has(i)) return original[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join('');

    if (isHovering) {
      setIsScrambling(true);
      interval = window.setInterval(() => {
        setRevealedIndices((prev) => {
          if (sequential) {
            if (prev.size < text.length) {
              const next = getNextIndex(prev);
              const nextSet = new Set(prev);
              nextSet.add(next);
              setDisplayText(shuffleText(text, nextSet));
              return nextSet;
            }
            clearInterval(interval);
            setIsScrambling(false);
            return prev;
          }
          setDisplayText(shuffleText(text, prev));
          currentIteration += 1;
          if (currentIteration >= maxIterations) {
            clearInterval(interval);
            setIsScrambling(false);
            setDisplayText(text);
          }
          return prev;
        });
      }, speed);
    } else {
      setDisplayText(text);
      setRevealedIndices(new Set());
      setIsScrambling(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, text, speed, maxIterations, sequential, revealDirection, characters]);

  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'both') return;
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasAnimated) {
            setIsHovering(true);
            setHasAnimated(true);
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animateOn, hasAnimated]);

  const hoverProps =
    animateOn === 'hover' || animateOn === 'both'
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
        }
      : {};

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProps}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealed = revealedIndices.has(index) || !isScrambling || !isHovering;
          return (
            <span key={index} className={isRevealed ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
