import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, BookOpen, Briefcase, Check, Download, GraduationCap, Infinity as InfinityIcon, Laptop, MonitorSmartphone, Play, User, Video } from 'lucide-react';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import HomeHero from '../components/HomeHero';
import { CountUp, motionTokens, Reveal, RevealGroup, m, useReducedMotion } from '../lib/motion';
import './publicPages.css';
import './homeSections.css';
import '../components/homeHero.css';

const howSteps = [
  { number: 1, title: 'Choose a direction', text: 'Browse focused courses and find a subject that fits where you want to go.' },
  { number: 2, title: 'Learn at your pace', text: 'Follow concise lessons, revisit ideas, and make progress on your own schedule.' },
  { number: 3, title: 'Put it into practice', text: 'Build confidence by applying what you learn and tracking your progress.' },
];
const outcomes = [
  'Build practical skills you can use in real projects.',
  'Learn complex subjects through clear, organized lessons.',
  'Stay on track with visible progress and a manageable pace.',
  'Keep learning wherever your schedule takes you.',
];
const faqItems = [
  { question: 'How do the courses work?', answer: 'Each course is organized into sections and video lessons. Enroll in a course to follow its curriculum and keep track of your progress.' },
  { question: 'Can I learn at my own pace?', answer: 'Yes. Lessons are available on demand, so you can study when it works for you and return to the material as needed.' },
  { question: 'Can I preview a course before enrolling?', answer: 'Courses may include free preview lessons. Look for the Preview label in a course curriculum to play one without enrolling.' },
  { question: 'How do I access a course after enrollment?', answer: 'Your enrolled courses appear in your student dashboard, where you can continue learning and track completed lessons.' },
];
const includedItems = [
  { title: 'HD video lessons', description: 'Clear, focused lessons you can watch at your own pace.', Icon: Video, variant: 'wide' },
  { title: 'Downloadable resources', description: 'Keep useful references and files close as you practice.', Icon: Download, variant: 'small' },
  { title: 'Progress tracking', description: 'See how far you have come in every course.', Icon: Activity, variant: 'small' },
  { title: 'Lifetime access', description: 'Revisit lessons whenever you need a refresher.', Icon: InfinityIcon, variant: 'small' },
  { title: 'Learn on any device', description: 'Pick up your learning on a phone, tablet, or computer.', Icon: MonitorSmartphone, variant: 'wide' },
];
const audienceItems = [
  { title: 'Beginners', description: 'Start from the basics and build confidence one idea at a time.', outcomes: ['Clear foundations', 'A steady learning pace'], Icon: User },
  { title: 'Career switchers', description: 'Build job-ready skills step by step, with practice along the way.', outcomes: ['Practical projects', 'Skills you can grow'], Icon: Briefcase },
  { title: 'Students', description: 'Support your studies with practical projects and focused lessons.', outcomes: ['Applied learning', 'Flexible study time'], Icon: GraduationCap },
];
const pathSteps = [
  { title: 'Fundamentals', level: 'beginner', match: /fundamental|beginner|intro|basics/ },
  { title: 'Build real projects', match: /project|portfolio|practical/ },
  { title: 'Go deeper', level: 'advanced', match: /advanced|deep|master/ },
  { title: 'Show your skills', level: 'advanced', match: /career|professional|portfolio|capstone/ },
];

const fetchCourses = async () => {
  const first = await courseAPI.getAllCourses({ page: 1, limit: 100 });
  const payload = first.data?.courses ? first.data : first.data?.data || {};
  const pages = Number(payload.pages) || 1;
  const remaining = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => courseAPI.getAllCourses({ page: index + 2, limit: 100 })));
  return { courses: [...(payload.courses || []), ...remaining.flatMap((result) => result.data?.courses || result.data?.data?.courses || [])], total: Number(payload.total) || 0 };
};

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    let active = true;
    fetchCourses().then((data) => { if (active) { setCourses(data.courses); setTotalCourses(data.total); } })
      .catch(() => { if (active) { setCourses([]); setTotalCourses(0); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const featuredCourses = useMemo(() => [...courses].sort((a, b) => (Number(b.enrollmentCount) || 0) - (Number(a.enrollmentCount) || 0)).slice(0, 3), [courses]);
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))];
  const totalLearners = courses.reduce((sum, course) => sum + (Number(course.enrollmentCount) || 0), 0);
  const totalLessons = courses.reduce((sum, course) => sum + (course.modules || []).reduce((moduleTotal, module) => moduleTotal + (module.lessons?.length || 0), 0), 0);
  const visibleStats = [
    { value: totalCourses, label: 'Published courses' },
    { value: totalLessons, label: 'Lessons to explore' },
    { value: totalLearners, label: 'Learners enrolled' },
  ].filter((item) => item.value >= 5);
  const previewCourse = featuredCourses[0];
  const timelineCourses = pathSteps.map((step) => courses.find((course) => {
    const level = String(course.level || '').toLowerCase();
    const searchable = `${course.title || ''} ${course.category || ''} ${course.shortDescription || ''} ${course.description || ''}`.toLowerCase();
    return step.level ? level.includes(step.level) : step.match.test(searchable);
  }));

  return <div className="public-home">
    <HomeHero stats={visibleStats} previewCourse={previewCourse} />

    <section className="public-section public-section--featured home-courses" aria-labelledby="featured-heading">
      <div className="public-container">
        <Reveal as="div" className="public-section__heading"><div><p className="eyebrow">The course collection</p><h2 id="featured-heading">Start with a subject<br className="desktop-only" /> that moves you.</h2></div><Link to="/courses" className="text-link">Browse all courses <ArrowRight size={16} /></Link></Reveal>
        {loading ? <div className="public-course-grid">{[1, 2, 3].map((item) => <div className="public-skeleton-card" key={item}><span /><i /><i /><i /></div>)}</div> : featuredCourses.length ? <RevealGroup className="public-course-grid">{featuredCourses.map((course) => <CourseCard key={course._id} course={course} />)}</RevealGroup> : <div className="public-empty"><BookOpen size={22} /><p>New courses are on their way.</p><Link to="/courses" className="text-link">Explore the catalog <ArrowRight size={16} /></Link></div>}
      </div>
    </section>

    {!!categories.length && <section className="home-categories" aria-label="Course categories"><div className="public-container"><Reveal as="nav" className="home-category-list" aria-label="Browse course categories">{categories.map((category) => <Link key={category} to={`/courses?category=${encodeURIComponent(category)}`}>{category}<ArrowRight size={14} /></Link>)}</Reveal></div></section>}

    <section className="public-section home-platform" aria-labelledby="platform-heading">
      <div className="public-container home-platform__layout">
        <Reveal className="home-platform__intro"><p className="eyebrow">Inside the platform</p><h2 id="platform-heading">A calm place to <em>keep learning.</em></h2><ul className="home-check-list">{outcomes.map((outcome) => <li key={outcome}><Check size={16} aria-hidden="true" />{outcome}</li>)}</ul></Reveal>
        <Reveal className="platform-browser" delay={0.06} aria-hidden="true">
          <div className="platform-browser__bar"><span /><span /><span /><i>CourseHub / My course</i></div>
          <div className="platform-browser__content"><div className="platform-browser__lesson"><div className="platform-browser__video"><Play size={23} fill="currentColor" /></div><div className="platform-browser__progress"><span /></div><span className="platform-browser__tiny">LESSON 04 · 68% COMPLETE</span><strong>Building a steady practice</strong><small>Take one clear idea and put it to work.</small></div>
            <aside className="platform-browser__curriculum"><strong>Course outline</strong><small>Foundations</small><span><Check size={12} />Getting started</span><span><Check size={12} />Core ideas</span><small>Practice</small><span className="is-current"><Play size={11} />Build a habit</span><span>Reflection</span><small>Keep growing</small><span>Next steps</span></aside>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="public-section home-how" id="how-it-works" aria-labelledby="how-heading">
      <div className="public-container"><Reveal className="narrow-heading"><p className="eyebrow">A simple way forward</p><h2 id="how-heading">Good learning has<br /><em>a rhythm.</em></h2><p>Make progress one focused session at a time.</p></Reveal>
        <RevealGroup className="steps-grid">{howSteps.map((step) => <article className="step-card" key={step.number}><span><CountUp value={step.number} format={(value) => `0${value}`} /></span><h3>{step.title}</h3><p>{step.text}</p></article>)}</RevealGroup>
      </div>
    </section>

    <section className="public-section home-included" aria-labelledby="included-heading">
      <div className="public-container"><Reveal className="home-section-heading"><p className="eyebrow">Thoughtfully equipped</p><h2 id="included-heading">Everything you need, <em>in every course.</em></h2></Reveal>
        <RevealGroup className="home-bento">{includedItems.map(({ title, description, Icon, variant }) => <article className={`home-bento__card home-bento__card--${variant}`} key={title}><Icon size={20} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3><p>{description}</p>{title === 'Progress tracking' && <div className="home-bento__progress" aria-hidden="true"><m.span initial={{ scaleX: 0 }} whileInView={{ scaleX: 0.68 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.emphasized }} /></div>}{title === 'HD video lessons' && <div className="home-bento__video" aria-hidden="true"><Play size={15} /></div>}{title === 'Downloadable resources' && <div className="home-bento__resource" aria-hidden="true"><span /><span /><span /></div>}{title === 'Lifetime access' && <div className="home-bento__infinity" aria-hidden="true">∞</div>}{title === 'Learn on any device' && <div className="home-bento__devices" aria-hidden="true"><Laptop size={26} /><MonitorSmartphone size={21} /></div>}</article>)}</RevealGroup>
      </div>
    </section>

    <section className="public-section home-audience" aria-labelledby="audience-heading">
      <div className="public-container"><Reveal className="home-section-heading"><p className="eyebrow">Room for every next step</p><h2 id="audience-heading">Made for <em>how you learn.</em></h2></Reveal>
        <RevealGroup className="home-audience__grid">{audienceItems.map(({ title, description, outcomes: audienceOutcomes, Icon }) => <article className="home-audience__card" key={title}><Icon size={21} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3><p>{description}</p><ul>{audienceOutcomes.map((outcome) => <li key={outcome}><Check size={14} />{outcome}</li>)}</ul><Link to="/courses" className="text-link">Explore courses <ArrowRight size={15} /></Link></article>)}</RevealGroup>
      </div>
    </section>

    <section className="public-section home-path" aria-labelledby="path-heading">
      <div className="public-container"><Reveal className="home-section-heading"><p className="eyebrow">Your next steps</p><h2 id="path-heading">A clear path, <em>step by step.</em></h2></Reveal>
        <div className="home-path__timeline"><m.span className="home-path__line home-path__line--desktop" aria-hidden="true" initial={reduced ? { scaleX: 1 } : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.standard }} /><m.span className="home-path__line home-path__line--mobile" aria-hidden="true" initial={reduced ? { scaleY: 1 } : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.standard }} />
          <RevealGroup className="home-path__steps">{pathSteps.map((step, index) => { const course = timelineCourses[index]; return <article className="home-path__step" key={step.title}><span className="home-path__node" aria-hidden="true" /><p className="home-path__index">0{index + 1}</p><h3>{step.title}</h3>{course ? <Link to={`/courses/${course._id}`} className="home-path__course">{course.title}<ArrowRight size={14} /></Link> : <span className="home-path__soon">Coming soon</span>}</article>; })}</RevealGroup>
        </div>
      </div>
    </section>

    <section className="public-section faq-section" id="faq" aria-labelledby="faq-heading">
      <Reveal className="public-container faq-layout"><div><p className="eyebrow">A few useful details</p><h2 id="faq-heading">Questions,<br /><em>answered.</em></h2></div><div className="faq-list">{faqItems.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></Reveal>
    </section>

    <section className="public-final-cta"><div className="public-container public-final-cta__inner"><div><p className="eyebrow">Your next chapter starts here</p><h2>Find your next<br /><em>good question.</em></h2></div><div><p>Explore a course, learn a new skill, and see where it takes you.</p><Link to="/courses" className="public-button public-button--primary">Find a course <ArrowRight size={17} /></Link></div></div></section>
  </div>;
};

export default Home;
