import React from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Star } from 'lucide-react';
import { formatCourseDuration, getCourseDescriptions, getCourseLessons, pluralize } from '../utils/format';

const CourseCard = ({ course }) => {
  const { shortDescription } = getCourseDescriptions(course);
  const lessons = getCourseLessons(course);
  const duration = formatCourseDuration(course, lessons);
  const hasReviews = Number(course.reviewCount) > 0 || (Array.isArray(course.reviews) && course.reviews.length > 0);

  return (
    <Link to={`/courses/${course._id}`} className="public-course-card" aria-label={`View course: ${course.title}`}>
      <span className="public-course-card__image-link">
        <img src={course.thumbnail} alt={`${course.title} course thumbnail`} className="public-course-card__image" loading="lazy" />
      </span>
      <div className="public-course-card__body">
        <span className="public-course-card__category">{course.category}</span>
        <span className="public-course-card__title">{course.title}</span>
        <span className="public-course-card__description">{shortDescription}</span>
        <span className="public-course-card__meta">
          <span>{course.level}</span>
          <span>{pluralize(lessons.length, 'lesson')}</span>
          {duration && <span><Clock3 size={14} aria-hidden="true" /> {duration}</span>}
          {hasReviews && <span><Star size={14} aria-hidden="true" /> {Number(course.rating || 0).toFixed(1)}</span>}
        </span>
        <span className="public-course-card__bottom">
          <strong>{Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}</strong>
          <span className="public-course-card__link">View course <span aria-hidden="true">→</span></span>
        </span>
      </div>
    </Link>
  );
};

export default CourseCard;
