import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, CheckCircle2, Clock3, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { m, useReducedMotion } from 'framer-motion';
import { CountUp, motionTokens, motionVariants } from '../lib/motion';

const fallbackFeatures = [
  { title: 'Self-paced', description: 'Learn on your schedule, pause and resume anytime.', Icon: Clock3 },
  { title: 'Lifetime access', description: 'Revisit lessons whenever you need a refresher.', Icon: InfinityIcon },
  { title: 'Certificate', description: 'Receive a certificate when you complete a course.', Icon: Award },
];
const statDetails = {
  'Published courses': 'Explore practical courses across a growing set of subjects.',
  'Lessons to explore': 'Short, focused lessons make progress feel manageable.',
  'Learners enrolled': 'A community of learners building skills at their own pace.',
};

export default function HomeHero({ stats = [], previewCourse }) {
  const auth = useAuth();
  const reduced = useReducedMotion();
  const hasAllStats = stats.length === 3;
  const brief = (delay = 0) => ({ duration: reduced ? 0.01 : motionTokens.durations.slow, delay: reduced ? 0 : delay, ease: motionTokens.easings.standard });

  return <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="public-container home-hero__inner">
      <m.div className="home-hero__copy" initial="hidden" animate="visible" variants={motionVariants.staggerContainer}>
        <m.p className="home-hero__pill" variants={motionVariants.fadeUp} transition={brief()}><span aria-hidden="true" />Practical learning, thoughtfully taught</m.p>
        <m.h1 id="home-hero-title" variants={motionVariants.fadeUp} transition={brief(0.06)}>Make room for <em>what's next.</em></m.h1>
        <m.p className="home-hero__subline" variants={motionVariants.fadeUp} transition={brief(0.12)}>Focused courses to build practical skills at your pace.</m.p>
        <m.div className="home-hero__actions" variants={motionVariants.fadeUp} transition={brief(0.18)}>
          <Link to="/courses" className="public-button public-button--primary">Explore courses <ArrowRight size={17} aria-hidden="true" /></Link>
          {auth.isLoading ? <span className="public-button public-button--secondary home-hero__auth-skeleton" aria-hidden="true" /> : <Link to={auth.isAuthenticated ? '/my-learning' : '/register'} className="public-button public-button--secondary">{auth.isAuthenticated ? 'Go to My learning' : 'Create an account'}</Link>}
        </m.div>
      </m.div>

      <m.div className="home-hero__visual" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={brief(0.2)}>
        <div className="home-hero__arch" aria-hidden="true" />
        <div className="home-hero__photo-mask" aria-hidden="true">
          <m.img className="home-hero__student" src="/hero-student.png" width="399" height="532" loading="eager" fetchPriority="high" alt="Student studying with a laptop and book" onError={(event) => { event.currentTarget.hidden = true; }} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={brief(0.2)} />
        </div>
        <m.div className="home-hero__float-card home-hero__float-card--progress" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={brief(0.3)}>
          <small>Course progress <span>Sample</span></small><strong>{previewCourse?.title || 'JavaScript Mastery'}</strong><div className="home-hero__mini-track"><i /></div><small>12 of 18 lessons <b>68%</b></small>
        </m.div>
        <m.div className="home-hero__float-card home-hero__float-card--complete" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={brief(0.36)}><CheckCircle2 size={20} /><span><strong>Lesson completed</strong><small>Closures and scope</small></span></m.div>
      </m.div>

      <m.aside className={`home-hero__details ${hasAllStats ? 'home-hero__details--stats' : ''}`} aria-label={hasAllStats ? 'CourseHub learning statistics' : 'Learning features'} initial="hidden" animate="visible" variants={motionVariants.staggerContainer} transition={{ delayChildren: reduced ? 0 : 0.42 }}>
        {hasAllStats ? stats.map((stat) => <m.article variants={reduced ? motionVariants.fadeIn : motionVariants.fadeUp} className="home-hero__detail" key={stat.label}>
          <strong className="home-hero__detail-value"><CountUp value={stat.value} /></strong>
          <h2>{stat.label}</h2><p>{statDetails[stat.label] || 'Explore, learn, and return to lessons whenever it suits you.'}</p>
        </m.article>) : fallbackFeatures.map(({ title, description, Icon }) => <m.article variants={reduced ? motionVariants.fadeIn : motionVariants.fadeUp} className="home-hero__detail" key={title}>
          <Icon size={19} className="home-hero__detail-icon" aria-hidden="true" /><h2>{title}</h2><p>{description}</p>
        </m.article>)}
      </m.aside>
    </div>
  </section>;
}
