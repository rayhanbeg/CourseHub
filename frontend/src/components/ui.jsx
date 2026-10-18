import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, m, motionTokens, Pressable, useReducedMotion } from '../lib/motion';
import './ui.css';

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return <Pressable className={`ui-button ui-button--${variant} ui-button--${size} ${className}`} {...props}>{children}</Pressable>;
}

export function Card({ as: Element = 'div', className = '', children, ...props }) {
  return <Element className={`ui-card ${className}`} {...props}>{children}</Element>;
}

export function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`} {...props}>{children}</span>;
}

export function Input({ label, id, hint, className = '', ...props }) {
  const inputId = id || props.name;
  return <div className="ui-field"><label htmlFor={inputId}>{label}</label><input id={inputId} className={`ui-control ${className}`} aria-describedby={hint ? `${inputId}-hint` : undefined} {...props} />{hint && <small id={`${inputId}-hint`}>{hint}</small>}</div>;
}

export function Select({ label, id, className = '', children, ...props }) {
  const selectId = id || props.name;
  return <div className="ui-field"><label htmlFor={selectId}>{label}</label><select id={selectId} className={`ui-control ${className}`} {...props}>{children}</select></div>;
}

export function Textarea({ label, id, className = '', ...props }) {
  const textareaId = id || props.name;
  return <div className="ui-field"><label htmlFor={textareaId}>{label}</label><textarea id={textareaId} className={`ui-control ui-textarea ${className}`} {...props} /></div>;
}

export function Modal({ open, onClose, title, children, labelledBy, className = '' }) {
  const reduced = useReducedMotion();
  const panelRef = React.useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    panelRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((item) => !item.disabled);
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; previousFocus?.focus?.(); };
  }, [open, onClose]);
  return createPortal(<AnimatePresence initial={false}>{open && <m.div className="ui-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><m.section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy || 'ui-modal-title'} className={`ui-modal ${className}`} initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 0.97 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}><header><h2 id={labelledBy || 'ui-modal-title'}>{title}</h2><button className="ui-icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header><div>{children}</div></m.section></m.div>}</AnimatePresence>, document.body);
}

export function Toast({ tone = 'neutral', children, onDismiss, className = '' }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!onDismiss) return undefined;
    const timeout = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);
  return <m.div className={`ui-toast ui-toast--${tone} ${className}`} role={tone === 'danger' ? 'alert' : 'status'} initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }} drag={reduced ? false : 'x'} dragMomentum={false} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 80) onDismiss?.(); }}>{children}{onDismiss && <><button className="ui-icon-button" aria-label="Dismiss notification" onClick={onDismiss}><X size={16} /></button>{!reduced && <m.span className="ui-toast-progress" aria-hidden="true" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: motionTokens.durations.toast, ease: 'linear' }} />}</>}</m.div>;
}

export function Skeleton({ variant = 'block', className = '', ...props }) {
  return <span className={`ui-skeleton ui-skeleton--${variant} ${className}`} aria-hidden="true" {...props} />;
}

export function EmptyState({ title, description, action, className = '' }) {
  const reduced = useReducedMotion();
  return <m.section className={`ui-empty ${className}`} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}><m.span className="ui-empty-mark" aria-hidden="true" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }}>—</m.span><h2>{title}</h2>{description && <p>{description}</p>}{action}</m.section>;
}

export function ProgressBar({ value = 0, label, className = '' }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  const reduced = useReducedMotion();
  return <m.div className={`ui-progress ${className}`} role="progressbar" aria-label={label || 'Progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}><m.span style={{ width: `${normalized}%`, transformOrigin: 'left' }} initial={reduced ? { scaleX: 1 } : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.emphasized }} /></m.div>;
}
