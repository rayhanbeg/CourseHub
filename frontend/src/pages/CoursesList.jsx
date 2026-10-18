import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import { EmptyState, Skeleton } from '../components';
import { pluralize } from '../utils/format';
import './publicPages.css';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { motionTokens } from '../lib/motion';

const levels = ['Beginner', 'Intermediate', 'Advanced'];
const PAGE_SIZE = 100;

const fetchCatalog = async () => {
  const first = await courseAPI.getAllCourses({ page: 1, limit: PAGE_SIZE });
  const payload = first.data?.courses ? first.data : first.data?.data || {};
  const pages = Number(payload.pages) || 1;
  const remaining = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
    courseAPI.getAllCourses({ page: index + 2, limit: PAGE_SIZE })
  ));
  return [...(payload.courses || []), ...remaining.flatMap((result) => result.data?.courses || result.data?.data?.courses || [])];
};

const CourseSkeleton = () => <article className="public-skeleton-card" aria-hidden="true"><Skeleton className="skeleton-image" /><Skeleton className="skeleton-line skeleton-short" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line skeleton-medium" /><Skeleton className="skeleton-line skeleton-short" /></article>;

const CoursesList = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [reloadKey, setReloadKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchCatalog()
      .then((items) => { if (active) setCourses(items); })
      .catch((err) => { if (active) { setCourses([]); setError(err.response?.data?.message || 'We could not load courses right now. Please try again.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const categories = useMemo(() => [...new Set(courses.map((course) => course.category).filter(Boolean))].sort(), [courses]);
  const filteredCourses = useMemo(() => {
    const matching = courses.filter((course) => {
      const text = `${course.title || ''} ${course.shortDescription || ''} ${course.description || ''} ${course.category || ''}`.toLowerCase();
      return (!debouncedSearch || text.includes(debouncedSearch)) && (!category || course.category === category) && (!level || course.level === level) && (!price || (price === 'free' ? Number(course.price) === 0 : Number(course.price) > 0));
    });
    return matching.sort((a, b) => {
      if (sort === 'popular') return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      if (sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (sort === 'price-desc') return Number(b.price) - Number(a.price);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [courses, debouncedSearch, category, level, price, sort]);

  const hasFilters = Boolean(searchTerm || category || level || price || sort !== 'newest');
  const clearFilters = () => { setSearchTerm(''); setCategory(''); setLevel(''); setPrice(''); setSort('newest'); };
  const activeChips = [
    category && { label: category, clear: () => setCategory('') },
    level && { label: level, clear: () => setLevel('') },
    price && { label: price === 'free' ? 'Free' : 'Paid', clear: () => setPrice('') },
    searchTerm && { label: `“${searchTerm}”`, clear: () => setSearchTerm('') },
  ].filter(Boolean);

  return (
    <div className="public-catalog">
      <header className="catalog-intro"><div className="public-container"><p className="eyebrow">Course collection</p><h1>Explore what’s <em>possible.</em></h1><p>Find a focused course for the skill you want to build next.</p></div></header>
      <main className="public-container catalog-main">
        <div className="catalog-toolbar"><label className="catalog-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search courses</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search courses, topics, skills…" type="search" /></label><div className="catalog-toolbar__right"><span className="catalog-count" aria-live="polite">{loading ? 'Finding courses…' : pluralize(filteredCourses.length, 'course')}</span><button type="button" className="catalog-filter-trigger" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters{activeChips.length > 0 && <span>{activeChips.length}</span>}</button></div></div>
        <button type="button" className={`catalog-filters-backdrop ${filtersOpen ? 'is-open' : ''}`} onClick={() => setFiltersOpen(false)} aria-label="Close filters" tabIndex={filtersOpen ? 0 : -1} />
        <div className="catalog-layout">
        <aside className={`catalog-filters ${filtersOpen ? 'is-open' : ''}`} aria-label="Filter courses" aria-hidden={!filtersOpen && window.matchMedia('(max-width: 767px)').matches}>
          <div className="catalog-filter-heading"><div><SlidersHorizontal size={17} /><h2>Refine your search</h2></div><button type="button" className="catalog-filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={18} /></button></div>
          <label className="catalog-select-label" htmlFor="course-category">Category</label><select id="course-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label className="catalog-select-label" htmlFor="course-level">Level</label><select id="course-level" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">All levels</option>{levels.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <fieldset className="catalog-price-filter"><legend>Price</legend><label><input type="radio" name="price" checked={price === ''} onChange={() => setPrice('')} />Any price</label><label><input type="radio" name="price" checked={price === 'free'} onChange={() => setPrice('free')} />Free</label><label><input type="radio" name="price" checked={price === 'paid'} onChange={() => setPrice('paid')} />Paid</label></fieldset>
          {hasFilters && <button type="button" className="catalog-clear" onClick={clearFilters}>Clear filters</button>}
          <button type="button" className="catalog-filter-apply" onClick={() => setFiltersOpen(false)}>Show {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}</button>
        </aside>
        <section className="catalog-results" aria-label="Course results">
          <div className="catalog-results__top"><span>{loading ? 'Loading courses' : `Showing ${filteredCourses.length} ${filteredCourses.length === 1 ? 'result' : 'results'}`}</span><label htmlFor="course-sort">Sort by <select id="course-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="popular">Most popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
          {activeChips.length > 0 && <div className="catalog-active-filters" aria-label="Active filters"><AnimatePresence initial={false}>{activeChips.map((chip) => <m.button layout key={chip.label} type="button" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 0.96 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }} onClick={chip.clear}>{chip.label}<X size={13} /></m.button>)}</AnimatePresence><button type="button" className="catalog-clear-link" onClick={clearFilters}>Clear all</button></div>}
          {loading ? <div className="public-course-grid">{[1, 2].map((item) => <CourseSkeleton key={item} />)}</div> : error ? <EmptyState title="Courses aren’t available" description={error} action={<button className="public-button public-button--secondary" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>} /> : filteredCourses.length ? <div className="public-course-grid"><AnimatePresence initial={false}>{filteredCourses.map((course) => <m.div className="catalog-course-motion" key={course._id} layout initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base, ease: motionTokens.easings.standard }}><CourseCard course={course} /></m.div>)}</AnimatePresence></div> : <EmptyState title="No courses match those filters" description="Try a different search or clear your filters to see the full collection." action={<button className="public-button public-button--secondary" onClick={clearFilters}>Clear filters</button>} />}
        </section>
        </div>
        <div className="catalog-bottom-cta"><p>Have a skill in mind?</p><Link to="/register" className="text-link">Create an account and start learning <ArrowRight size={15} /></Link></div>
      </main>
    </div>
  );
};

export default CoursesList;
