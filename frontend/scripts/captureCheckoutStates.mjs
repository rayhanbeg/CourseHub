import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const outputDir = path.resolve(process.cwd(), '..', 'screenshots', 'checkout');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const student = { _id: 'student-1', id: 'student-1', name: 'Avery Student', email: 'avery@example.test', role: 'student' };
const makeCourse = (id, price = 49.99) => ({
  _id: id,
  title: id === 'free' ? 'Foundations of Digital Illustration' : 'Practical JavaScript: From Basics to Projects',
  shortDescription: 'Build a practical skill with clear lessons and guided exercises.',
  fullDescription: 'A structured course that moves from first principles to useful projects.',
  category: 'Development', level: 'beginner', price, duration: 4.5, language: 'English', isPublished: true,
  thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80',
  modules: [{ _id: 'module-1', title: 'Getting started', lessons: [
    { _id: 'lesson-1', title: 'Your first project', description: 'Set up the project and understand its structure.', videoDuration: 540, hasVideo: false, isPreview: false },
    { _id: 'lesson-2', title: 'Core concepts', description: 'Learn the essential building blocks.', videoDuration: 720, hasVideo: false, isPreview: true },
  ] }],
});

async function makePage({ enrolled = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  await context.addInitScript((user) => localStorage.setItem('coursehub_user', JSON.stringify({ id: user.id, name: user.name, role: user.role })), student);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('http://localhost:5000/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace('/api', '');
    const headers = { 'access-control-allow-origin': baseUrl, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (pathname === '/auth/me') return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, user: student }) });
    if (pathname.startsWith('/courses/')) {
      const id = pathname.split('/').at(-1);
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, course: makeCourse(id, id === 'free' ? 0 : 49.99) }) });
    }
    if (pathname === '/orders/my-orders') {
      const orders = enrolled ? [{ _id: 'order-1', status: 'completed', course: { _id: 'paid', title: makeCourse('paid').title } }] : [];
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, orders }) });
    }
    if (pathname.startsWith('/progress/course/')) {
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, progress: { completedLessons: 0, totalLessons: 2, overallProgress: 0, isCompleted: false, lessons: [], lastLesson: null } }) });
    }
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, orders: [], data: [] }) });
  });
  return { context, page };
}

async function captureCheckout(caseName, route, viewport) {
  const { context, page } = await makePage({ enrolled: caseName === 'already-enrolled' });
  await page.setViewportSize(viewport);
  if (caseName === 'cancelled') {
    await page.goto(`${baseUrl}/checkout/paid`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Complete your enrollment/i }).first().waitFor({ timeout: 15000 });
    await page.goto(`${baseUrl}/checkout-cancel?orderId=order-1`, { waitUntil: 'domcontentloaded' });
  } else await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  if (caseName === 'already-enrolled') {
    await page.waitForURL(/\/course\/paid/, { timeout: 15000 });
    await page.getByText('You are already enrolled.').first().waitFor({ timeout: 10000 });
  } else {
    await page.getByRole('heading', { name: /Complete your enrollment/i }).first().waitFor({ timeout: 15000 });
  }
  if (caseName === 'cancelled') await page.getByText('Payment was not completed. You have not been charged.').waitFor({ timeout: 10000 });
  await page.waitForTimeout(caseName === 'already-enrolled' ? 250 : 650);
  if (caseName !== 'already-enrolled') {
    const progressBarCount = await page.getByRole('progressbar').count();
    if (progressBarCount) throw new Error(`Checkout must not render a progress bar (${caseName}).`);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Horizontal overflow for ${caseName} at ${viewport.width}px.`);
  const file = path.join(outputDir, `checkout-${caseName}-${viewport.width}.png`);
  await page.screenshot({ path: file, fullPage: true });
  if (caseName === 'free' && await page.getByText(/Stripe/i).count()) throw new Error('Free course view still contains Stripe wording.');
  if (viewport.width === 390 && caseName !== 'already-enrolled') {
    await page.getByRole('button', { name: 'Show order details' }).click();
    await page.waitForTimeout(200);
    const expanded = await page.locator('.checkout-summary').evaluate((el) => ({ className: el.className, display: getComputedStyle(el.querySelector('.checkout-summary-content')).display, heading: el.querySelector('h2')?.textContent }));
    console.log(`Mobile summary ${caseName}: ${JSON.stringify(expanded)}`);
    if (!expanded.className.includes('is-expanded') || expanded.display === 'none' || expanded.heading !== 'Order summary') throw new Error(`Mobile summary failed to expand for ${caseName}.`);
    await page.getByRole('button', { name: /Continue to secure payment/i }).count();
  }
  await context.close();
  console.log(file);
}

try {
  if (process.argv.includes('--mobile-only')) await captureCheckout('paid', '/checkout/paid', { width: 390, height: 844 });
  else for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await captureCheckout('paid', '/checkout/paid', viewport);
    await captureCheckout('free', '/checkout/free', viewport);
    await captureCheckout('already-enrolled', '/checkout/paid', viewport);
    await captureCheckout('cancelled', '/checkout/paid?cancelled=1', viewport);
  }

  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} finally {
  await browser.close();
}
