export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${Number(count) || 0} ${Number(count) === 1 ? singular : plural}`;

export const getCourseDescriptions = (course = {}) => {
  const storedDescription = (course.description || '').trim();
  const legacyParts = storedDescription.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const shortDescription = (course.shortDescription || legacyParts[0] || storedDescription).trim();
  const fullDescription = (course.fullDescription || (course.shortDescription ? storedDescription : legacyParts.slice(1).join('\n\n'))).trim();
  return {
    shortDescription,
    fullDescription: fullDescription === shortDescription ? '' : fullDescription,
  };
};

export const formatCourseDuration = (course = {}, lessons = []) => {
  const lessonMinutes = Math.round(lessons.reduce((sum, lesson) => sum + (Number(lesson.videoDuration) || 0), 0) / 60);
  const courseMinutes = Math.round((Number(course.duration) || 0) * 60);
  const minutes = lessonMinutes > 0 ? lessonMinutes : courseMinutes;
  if (!minutes) return '';
  const wholeHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!wholeHours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${wholeHours} hr ${remainingMinutes} min` : `${wholeHours} hr`;
};

export const getCourseLessons = (course = {}) =>
  (course?.modules || []).flatMap((module) => module?.lessons || []);
