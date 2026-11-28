// ============================================================
// React Bits — CountUp (https://github.com/DavidHDev/react-bits)
// Fixed formatter ref stability so parent re-renders never reset to 0.
// ============================================================

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 0.65,
  className = '',
  startWhen = true,
  separator = ',',
  decimals,
  prefix = '',
  suffix = '',
  formatter,
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatterRef = useRef(formatter);
  formatterRef.current = formatter;

  const initialValue = direction === 'down' ? to : from;
  const motionValue = useMotionValue(initialValue);

  const damping = 22 + 38 * (1 / duration);
  const stiffness = 110 * (1 / duration);

  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const resolvedDecimals =
    decimals !== undefined
      ? decimals
      : Math.max(
          (from.toString().split('.')[1] || '').length,
          (to.toString().split('.')[1] || '').length
        );

  const formatNum = (val: number) => {
    if (formatterRef.current) {
      return formatterRef.current(val);
    }
    const options: Intl.NumberFormatOptions = {
      useGrouping: Boolean(separator),
      minimumFractionDigits: resolvedDecimals,
      maximumFractionDigits: resolvedDecimals,
    };
    const formatted = Intl.NumberFormat('en-US', options).format(val);
    const withSep = separator ? formatted.replace(/,/g, separator) : formatted;
    return `${prefix}${withSep}${suffix}`;
  };

  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.();
      const target = direction === 'down' ? from : to;
      const t1 = window.setTimeout(() => {
        motionValue.set(target);
      }, delay * 1000);
      const t2 = window.setTimeout(() => {
        if (ref.current) {
          ref.current.textContent = formatNum(target);
        }
        onEnd?.();
      }, delay * 1000 + duration * 1000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (!ref.current) return;
      ref.current.textContent = formatNum(latest);
    });
    return () => unsubscribe();
  }, [springValue, separator, resolvedDecimals, prefix, suffix]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={`font-mono-numbers ${className}`}>
      {formatNum(to)}
    </span>
  );
}
