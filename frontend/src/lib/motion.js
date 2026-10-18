import React, { useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  animate,
} from 'framer-motion';
import { useLocation } from 'react-router-dom';

export { AnimatePresence, m, useReducedMotion };

export const motionTokens = Object.freeze({
  durations: { fast: 0.15, base: 0.25, slow: 0.5, toast: 5 },
  easings: {
    standard: [0.22, 1, 0.36, 1],
    emphasized: [0.16, 1, 0.3, 1],
  },
  springs: {
    soft: { type: 'spring', stiffness: 180, damping: 24 },
    snappy: { type: 'spring', stiffness: 360, damping: 30 },
  },
  stagger: 0.06,
});

export const motionVariants = Object.freeze({
  fadeUp: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: motionTokens.durations.slow, ease: motionTokens.easings.standard } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: motionTokens.durations.base, ease: motionTokens.easings.standard } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { duration: motionTokens.durations.base, ease: motionTokens.easings.emphasized } },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: motionTokens.durations.slow, ease: motionTokens.easings.standard } },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0, transition: { duration: motionTokens.durations.slow, ease: motionTokens.easings.standard } },
  },
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: motionTokens.stagger, delayChildren: 0.02 } },
  },
});

export function MotionProvider({ children }) {
  return React.createElement(LazyMotion, { features: domAnimation, strict: true }, children);
}

export function Reveal({ as = 'div', children, delay = 0, className, ...props }) {
  const reduced = useReducedMotion();
  const Component = m[as] || m.div;
  return React.createElement(Component, {
    className,
    initial: reduced ? { opacity: 0 } : 'hidden',
    whileInView: 'visible',
    viewport: { once: true, margin: '-80px' },
    variants: motionVariants.fadeUp,
    transition: { delay: reduced ? 0 : Math.min(delay, motionTokens.durations.slow), duration: reduced ? 0.01 : undefined },
    ...props,
  }, children);
}

export function RevealGroup({ as = 'div', children, className, ...props }) {
  const reduced = useReducedMotion();
  const Component = m[as] || m.div;
  const childrenArray = React.Children.toArray(children);
  const animated = childrenArray.slice(0, 8).map((child, index) => React.createElement(m.div, {
    key: child.key ?? index,
    variants: reduced ? motionVariants.fadeIn : motionVariants.fadeUp,
  }, child));
  return React.createElement(Component, {
    className,
    initial: reduced ? { opacity: 0 } : 'hidden',
    whileInView: 'visible',
    viewport: { once: true, margin: '-80px' },
    variants: reduced ? motionVariants.fadeIn : motionVariants.staggerContainer,
    ...props,
  }, ...animated, ...childrenArray.slice(8));
}

export function Pressable({ as = 'button', children, className, whileTap, ...props }) {
  const reduced = useReducedMotion();
  const Component = m[as] || m.button;
  return React.createElement(Component, { className, whileTap: reduced ? undefined : (whileTap || { scale: 0.98, transition: { duration: motionTokens.durations.fast } }), ...props }, children);
}

export function CountUp({ value = 0, format, className, duration = motionTokens.durations.slow, ...props }) {
  const reduced = useReducedMotion();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const numericValue = Number(value) || 0;
  const count = useMotionValue(reduced ? numericValue : 0);
  const rounded = useTransform(count, (latest) => {
    const valueToFormat = Math.round(latest);
    return format ? format(valueToFormat) : valueToFormat.toLocaleString();
  });
  const [text, setText] = useState(format ? format(reduced ? numericValue : 0) : (reduced ? numericValue : 0).toLocaleString());

  useEffect(() => rounded.on('change', setText), [rounded]);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) { count.set(numericValue); return undefined; }
    const controls = animate(count, numericValue, { duration: Math.min(duration, 0.8), ease: motionTokens.easings.emphasized });
    return () => controls.stop();
  }, [count, duration, inView, numericValue, reduced]);

  return React.createElement(m.span, { ref, className, ...props }, text);
}

export function PageTransition({ children }) {
  const location = useLocation();
  const reduced = useReducedMotion();
  const key = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);
  return React.createElement(AnimatePresence, { initial: false, mode: 'popLayout' }, React.createElement(m.div, {
    key,
    className: 'motion-page-transition',
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, y: -4 },
    transition: { duration: reduced ? 0.01 : motionTokens.durations.base, ease: motionTokens.easings.standard },
  }, children));
}

