import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CreditCard, Lock, Loader2, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { courseAPI, orderAPI, authAPI } from '../services/api';
import { logout } from '../store/authSlice';
import { Skeleton } from '../components';
import { CountUp, motionTokens } from '../lib/motion';
import { formatCourseDuration, getCourseLessons } from '../utils/format';
import { DEFAULT_CURRENCY, formatMoney } from '../utils/money';
import './checkout.css';

const StepIndicator = () => <ol className="checkout-steps" aria-label="Checkout steps">
  {[['1', 'Review'], ['2', 'Payment'], ['3', 'Start learning']].map(([number, label], index) => <li key={number} className={index === 0 ? 'is-active' : ''} aria-current={index === 0 ? 'step' : undefined}>
    <span className="checkout-step-number">{number}</span><span>{label}</span>
  </li>)}
</ol>;

function CheckoutSkeleton() {
  return <main className="public-container checkout-page" aria-busy="true" aria-live="polite" aria-label="Loading checkout">
    <div className="checkout-skeleton-heading"><Skeleton variant="line" className="checkout-skeleton-back" /><Skeleton variant="line" className="checkout-skeleton-eyebrow" /><Skeleton variant="line" className="checkout-skeleton-title" /><div className="checkout-skeleton-steps"><Skeleton variant="pill" /><Skeleton variant="pill" /><Skeleton variant="pill" /></div></div>
    <div className="checkout-columns"><section className="checkout-left"><div className="checkout-panel checkout-student"><Skeleton variant="circle" /><div className="checkout-skeleton-user"><Skeleton variant="line" /><Skeleton variant="line" /></div></div><div className="checkout-panel checkout-payment"><Skeleton variant="line" className="checkout-skeleton-section-title" /><Skeleton variant="block" className="checkout-skeleton-payment-copy" /></div><div className="checkout-skeleton-trust">{[0, 1, 2].map((item) => <Skeleton variant="line" key={item} />)}</div></section><aside className="checkout-panel checkout-summary"><Skeleton variant="block" className="checkout-skeleton-thumb" /><Skeleton variant="line" className="checkout-skeleton-title-small" /><Skeleton variant="line" className="checkout-skeleton-row" /><Skeleton variant="line" className="checkout-skeleton-row" /><Skeleton variant="line" className="checkout-skeleton-row" /><Skeleton variant="block" className="checkout-skeleton-button" /></aside></div>
  </main>;
}

export { CheckoutSkeleton };

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const auth = useAuth();
  const reduced = useReducedMotion();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const enrollmentRedirected = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setNotFound(false);
    setCourse(null);
    courseAPI.getCourseById(courseId).then(({ data }) => {
      if (!active) return;
      if (!data?.course || data.course.isPublished === false) { setNotFound(true); return; }
      setCourse(data.course);
      try { sessionStorage.setItem('coursehub_checkout_course', courseId); } catch { /* Session storage is optional. */ }
      setCancelled(new URLSearchParams(location.search).get('cancelled') === '1');
    }).catch((err) => {
      if (!active) return;
      if (err.response?.status === 404) setNotFound(true);
      else setError(err.response?.data?.message || 'We could not load this course. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, retryKey, location.search]);

  useEffect(() => {
    if (!course || !auth.user?.id && !auth.user?._id) return undefined;
    let active = true;
    orderAPI.getUserOrders().then(({ data }) => {
      const enrolled = (data.orders || []).some((order) => {
        const orderCourseId = order.course?._id || order.course;
        return String(orderCourseId) === String(courseId) && order.status === 'completed';
      });
      if (active && enrolled && !enrollmentRedirected.current) {
        enrollmentRedirected.current = true;
        navigate(`/course/${courseId}`, { replace: true, state: { toast: 'You are already enrolled.' } });
      }
    }).catch(() => { /* Checkout creation remains authoritative if order history is unavailable. */ });
    return () => { active = false; };
  }, [auth.user?.id, auth.user?._id, course, courseId, navigate]);

  const lessons = useMemo(() => getCourseLessons(course), [course]);
  const duration = formatCourseDuration(course || {}, lessons);
  const currency = (course?.currency || DEFAULT_CURRENCY).toUpperCase();
  const price = Number(course?.price) || 0;
  const isFree = price === 0;

  const submitCheckout = useCallback(async (event) => {
    event?.preventDefault?.();
    if (!course || processing) return;
    setProcessing(true);
    setError('');
    try {
      if (isFree) {
        await orderAPI.enrollFree(courseId);
        navigate(`/course/${courseId}`, { replace: true });
        return;
      }
      const sessionRes = await orderAPI.createStripeSession({ courseId });
      if (!sessionRes?.data?.url) throw new Error('Secure checkout could not be opened. Please try again.');
      window.location.assign(sessionRes.data.url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'We could not start checkout. Please try again.');
      setProcessing(false);
    }
  }, [course, courseId, isFree, navigate, processing]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* Locally clear the session even if the network request fails. */ }
    dispatch(logout());
    navigate('/login', { state: { from: `/checkout/${courseId}` } });
  };

  if (loading || auth.isLoading) return <CheckoutSkeleton />;
  if (notFound) return <main className="public-container checkout-not-found"><Link to="/courses" className="checkout-back"><ArrowLeft size={16} /> Back to courses</Link><section><p className="eyebrow">COURSE UNAVAILABLE</p><h1>This course isn’t available right now.</h1><p>It may have been moved or unpublished. You can browse the current course collection.</p><Link className="public-button public-button--primary" to="/courses">Explore courses <ArrowRight size={17} /></Link></section></main>;
  if (error && !course) return <main className="public-container checkout-not-found"><section role="alert"><p className="eyebrow">CHECKOUT</p><h1>We couldn’t load this course.</h1><p>{error}</p><button className="public-button public-button--primary" type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button></section></main>;
  if (!course) return <CheckoutSkeleton />;

  const summary = <section className={`checkout-panel checkout-summary ${mobileSummaryOpen ? 'is-expanded' : ''}`} aria-labelledby="checkout-summary-title">
    <button type="button" className="checkout-summary-toggle" aria-expanded={mobileSummaryOpen} onClick={() => setMobileSummaryOpen((open) => !open)}><span>Show order details</span><ChevronDown size={17} /></button>
    <div className="checkout-summary-content">
      <h2 id="checkout-summary-title" className="checkout-panel-title">Order summary</h2>
      <div className="checkout-course-summary"><img src={course.thumbnail || '/placeholder-course.png'} alt={`${course.title} course thumbnail`} /><div><h3>{course.title}</h3><span className="checkout-level">{course.level || 'Course'}</span><p>{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}{duration ? ` · ${duration}` : ''}</p></div></div>
      <dl className="checkout-price-rows"><div><dt>Price</dt><dd>{formatMoney(price, currency)}</dd></div></dl>
      <div className="checkout-summary-total"><span>Total</span><strong><CountUp value={Math.round(price * 100)} format={(cents) => formatMoney(cents / 100, currency)} duration={reduced ? 0.01 : 0.5} /></strong></div>
      <button className="checkout-pay-button" type="button" onClick={submitCheckout} disabled={processing} aria-busy={processing}>
        {processing ? <><Loader2 className="checkout-spinner" size={18} aria-hidden="true" /><span className="sr-only">Starting checkout</span></> : <>{isFree ? 'Enroll for free' : <>Continue to secure payment <span> - {formatMoney(price, currency)}</span></>}<Lock size={17} aria-hidden="true" />{!isFree && <span className="sr-only">Stripe secure checkout</span>}</>}
      </button>
      {error && <div className="checkout-error" role="alert"><p>{error}</p><button type="button" onClick={submitCheckout} disabled={processing}>Retry</button></div>}
      {isFree ? <p className="checkout-summary-note">Enroll at no cost and start learning right away.</p> : <p className="checkout-summary-note"><Lock size={13} /> Payment is completed securely on Stripe.</p>}
    </div>
  </section>;

  return <main className="public-container checkout-page">
    {cancelled && <div className="checkout-cancel-banner" role="status"><span>Payment was not completed. You have not been charged.</span><button type="button" aria-label="Dismiss payment notice" onClick={() => setCancelled(false)}>×</button></div>}
    <header className="checkout-header">
      <Link to={`/courses/${courseId}`} className="checkout-back"><ArrowLeft size={16} /> Back to course</Link>
      <div className="checkout-header-copy"><p className="eyebrow">CHECKOUT</p><h1>Complete your <em>enrollment.</em></h1></div>
      <StepIndicator />
    </header>

    <div className="checkout-columns">
      <m.div className="checkout-left" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}>
        <section className="checkout-panel checkout-student" aria-labelledby="checkout-student-title"><span className="checkout-avatar" aria-hidden="true">{(auth.user?.name || 'S').trim().charAt(0).toUpperCase()}</span><div className="checkout-student-copy"><div><h2 id="checkout-student-title">Student information</h2><strong>{auth.user?.name}</strong><span>{auth.user?.email}</span></div><button type="button" onClick={handleLogout}><LogOut size={14} /> Not you? Log out</button></div></section>
        <section className="checkout-panel checkout-payment" aria-labelledby="checkout-payment-title"><p className="eyebrow">PAYMENT METHOD</p><h2 id="checkout-payment-title">{isFree ? 'Ready to begin?' : 'Secure payment, handled by Stripe.'}</h2><p>{isFree ? 'Your free enrollment is added to your account right away.' : 'You will be redirected to Stripe’s secure checkout to pay.'}</p>{!isFree && <div className="checkout-payment-icons" aria-label="Secure card payment"><CreditCard size={20} /><Lock size={17} /><span>Encrypted payment</span></div>}</section>
        {!isFree && <ul className="checkout-trust" aria-label="Checkout benefits"><li><Lock size={16} />Secure checkout with Stripe</li><li><Check size={16} />Instant access after payment</li><li><Check size={16} />Lifetime access to this course</li></ul>}
      </m.div>
      <m.aside className="checkout-right" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base, delay: reduced ? 0 : motionTokens.stagger }}>
        {summary}
      </m.aside>
    </div>
    <div className="checkout-mobile-bar"><div><span>Total</span><strong>{formatMoney(price, currency)}</strong></div><button type="button" onClick={submitCheckout} disabled={processing} aria-busy={processing}>{processing ? <Loader2 className="checkout-spinner" size={19} /> : <>{isFree ? 'Enroll for free' : 'Continue'} <Lock size={15} /></>}</button></div>
  </main>;
}
