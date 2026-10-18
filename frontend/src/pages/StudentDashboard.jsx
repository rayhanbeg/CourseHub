import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import './studentPages.css';
import { CountUp, m, motionTokens, Reveal, RevealGroup, useReducedMotion } from '../lib/motion';

const lessonLink = (item) => `/course/${item.course?._id}${item.lastLesson?._id || item.lastLesson ? `?lessonId=${item.lastLesson?._id || item.lastLesson}` : ''}`;
const StudentDashboard = () => {
  const auth = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reduced = useReducedMotion();

  useEffect(() => {
    let active = true;
    progressAPI.getAllUserProgress().then(({ data }) => { if (active) setProgress(data.progress || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'We could not load your courses. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.isAuthenticated]);

  const completed = progress.filter((item) => item.isCompleted).length;
  const inProgress = progress.filter((item) => !item.isCompleted && item.overallProgress > 0).length;
  const average = progress.length ? Math.round(progress.reduce((sum, item) => sum + (item.overallProgress || 0), 0) / progress.length) : 0;
  const featured = useMemo(() => progress.find((item) => !item.isCompleted && item.overallProgress > 0) || progress[0], [progress]);
  const progressText = (value) => `${Math.max(0, Math.min(100, value || 0))}% complete`;

  return <main className="student-page public-container">
    <header className="student-page__header">
      <div><p className="eyebrow">Your learning space</p><h1>My learning</h1><p className="student-page__lede">Pick up where you left off, or return to a course you’ve completed.</p></div>
      <Link to="/dashboard/orders" className="student-quiet-button">Orders &amp; receipts <ArrowRight size={15} /></Link>
    </header>
    {error && <p className="student-error" role="alert">{error}</p>}

    {loading ? <>
      <div className="student-feature-skeleton" aria-label="Loading learning progress"><div /><div><i /><i /><i /></div></div>
      <div className="student-summary student-summary--skeleton" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="student-course-grid">{[0, 1, 2].map((item) => <div className="student-course-skeleton" key={item}><div /><section><i /><i /><i /></section></div>)}</div>
    </> : <>
      {featured ? <Reveal as="section" className="student-feature">
        {featured.course?.thumbnail ? <img src={featured.course.thumbnail} alt={`${featured.course.title} course thumbnail`} /> : <div className="student-feature__placeholder"><BookOpen size={30} /></div>}
        <div className="student-feature__body"><p className="eyebrow">{featured.isCompleted ? 'Recently completed' : 'Continue learning'}</p><h2>{featured.course?.title || 'Course no longer available'}</h2><p className="student-feature__lesson">{featured.lastLesson?.title ? <>Current lesson · {featured.lastLesson.title}</> : featured.isCompleted ? 'Your course is complete. Revisit any lesson when you like.' : 'Your course is ready when you are.'}</p>
          <div className="student-progress-meta"><span><CountUp value={featured.overallProgress || 0} />% complete</span><span>{featured.completedLessons || 0} of {featured.totalLessons || 0} lessons</span></div><div className="student-progress-track"><m.span style={{ width: `${Math.max(0, Math.min(100, featured.overallProgress || 0))}%`, transformOrigin: 'left' }} initial={reduced ? { scaleX: 1 } : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.emphasized }} /></div>
          {featured.course?._id && <Link className="student-primary-button" to={lessonLink(featured)}>{featured.isCompleted ? 'Review course' : 'Continue'} <ArrowRight size={16} /></Link>}
        </div>
      </Reveal> : <Reveal as="section" className="student-empty"><BookOpen size={26} /><h2>Your learning starts here</h2><p>Explore the course collection and choose a subject to begin.</p><Link className="student-primary-button" to="/courses">Explore courses <ArrowRight size={16} /></Link></Reveal>}

      <Reveal as="p" className="student-summary" aria-label="Learning summary"><span><strong><CountUp value={progress.length} /></strong> {progress.length === 1 ? 'course' : 'courses'}</span><span><strong><CountUp value={inProgress} /></strong> in progress</span><span><strong><CountUp value={completed} /></strong> completed</span><span><strong><CountUp value={average} />%</strong> average</span></Reveal>

      <section className="student-courses-section"><div className="student-section-heading"><div><p className="eyebrow">Your library</p><h2>Your courses</h2></div><span>{progress.length} {progress.length === 1 ? 'course' : 'courses'}</span></div>
        {progress.length === 0 ? <div className="student-empty student-empty--compact"><p>You haven’t enrolled in a course yet.</p><Link className="student-text-link" to="/courses">Explore courses <ArrowRight size={15} /></Link></div> : <RevealGroup className="student-course-grid">{progress.map((item) => {
          const percent = Math.max(0, Math.min(100, item.overallProgress || 0));
          return <article className="student-course-card" key={item._id}>
            {item.course?.thumbnail ? <img className="student-course-card__image" src={item.course.thumbnail} alt={`${item.course.title} course thumbnail`} /> : <div className="student-course-card__placeholder"><BookOpen size={25} /></div>}
            <div className="student-course-card__body">{item.isCompleted && <span className="student-completed-badge"><Check size={13} />Completed</span>}<h3>{item.course?.title || 'Course no longer available'}</h3>
              <div className="student-progress-meta"><span><CountUp value={percent} />% complete</span><span>{item.completedLessons || 0}/{item.totalLessons || 0} lessons</span></div><div className="student-progress-track"><m.span style={{ width: `${percent}%`, transformOrigin: 'left' }} initial={reduced ? { scaleX: 1 } : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow, ease: motionTokens.easings.emphasized }} /></div>
              {item.course?._id && <div className="student-course-card__actions"><Link className="student-outline-button" to={lessonLink(item)}>{item.isCompleted ? 'Review' : percent > 0 ? 'Continue' : 'Start'} <ArrowRight size={15} /></Link>{item.isCompleted && <button className="student-certificate-link" type="button" onClick={async (event) => { const button = event.currentTarget; button.disabled = true; try { const { data } = await progressAPI.downloadCertificate(item.course._id); const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `CourseHub-Certificate-${item.course._id}.pdf`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { setError('Certificate could not be downloaded.'); } finally { button.disabled = false; } }}>Download certificate</button>}</div>}
            </div>
          </article>;
        })}</RevealGroup>}
      </section>
    </>}
  </main>;
};

export default StudentDashboard;
