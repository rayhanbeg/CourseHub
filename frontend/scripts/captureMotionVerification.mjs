import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5182';
const outputDir = path.resolve(process.cwd(), '..', 'screenshots', 'motion');
const videoDir = path.join(outputDir, 'videos');
await fs.mkdir(videoDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];

async function instrument(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__motionCLS = 0;
    window.__motionShiftLog = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
          window.__motionCLS += entry.value;
          window.__motionShiftLog.push({ value: entry.value, sources: (entry.sources || []).map((source) => ({
            selector: source.node?.id ? `#${source.node.id}` : source.node?.className?.baseVal || source.node?.className || source.node?.tagName,
            previous: source.previousRect,
            current: source.currentRect,
          })) });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* Browser does not support the Layout Instability API. */ }
  });
}

async function overflow(page, label, width) {
  const value = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    cls: window.__motionCLS || 0,
    shifts: window.__motionShiftLog || [],
  }));
  if (value.document > value.viewport) throw new Error(`${label} overflows at ${width}px (${value.document}px).`);
  results.push({ label, width, ...value });
}

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } },
});
const desktop = await desktopContext.newPage();
await instrument(desktop);
try {
  await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await desktop.getByRole('heading', { level: 1, name: /Make room for/ }).waitFor({ timeout: 20000 });
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: path.join(outputDir, 'home-full-1440.png'), fullPage: true });
  for (const [selector, name] of [
    ['.home-hero', 'hero'], ['.home-courses', 'course-collection'], ['.home-platform', 'platform-preview'],
    ['.home-how', 'how-it-works'], ['.home-included', 'whats-included'], ['.home-audience', 'who-its-for'],
    ['.home-path', 'learning-path'], ['#faq', 'faq'], ['.public-final-cta', 'final-cta'],
  ]) {
    const element = desktop.locator(selector);
    if (await element.count()) await element.screenshot({ path: path.join(outputDir, `${name}-1440.png`) });
  }
  await overflow(desktop, 'Home', 1440);

  const routeLink = desktop.locator('.public-navbar__links a[href="/courses"]');
  await routeLink.click();
  await desktop.getByRole('heading', { level: 1, name: /Explore what/ }).first().waitFor();
  const search = desktop.locator('input[type="search"]').first();
  if (await search.count()) {
    await search.fill('motion-check-no-result');
    await desktop.waitForTimeout(450);
    await desktop.screenshot({ path: path.join(outputDir, 'courses-filter-change-1440.png'), fullPage: true });
    await search.fill('');
  }
  await overflow(desktop, 'Courses', 1440);

  // Capture scroll-triggered motion and test under a 4x CPU throttle.
  const cdp = await desktop.context().newCDPSession(desktop);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const ratio of [0.25, 0.5, 0.75, 1]) {
    await desktop.evaluate((position) => window.scrollTo(0, document.body.scrollHeight * position), ratio);
    await desktop.waitForTimeout(300);
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await desktop.screenshot({ path: path.join(outputDir, 'home-scroll-end-1440.png') });
  await overflow(desktop, 'Home scroll', 1440);

  await desktop.emulateMedia({ reducedMotion: 'reduce' });
  await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await desktop.getByRole('heading', { level: 1, name: /Make room for/ }).waitFor();
  await desktop.waitForTimeout(100);
  const reduced = await desktop.evaluate(() => ({
    runningAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
    visibleHeading: getComputedStyle(document.querySelector('.home-hero h1')).opacity !== '0',
  }));
  if (!reduced.visibleHeading) throw new Error('Home heading remained hidden with reduced motion enabled.');
  await desktop.screenshot({ path: path.join(outputDir, 'home-reduced-motion-1440.png'), fullPage: true });
  results.push({ label: 'Reduced motion', ...reduced });
} finally {
  await desktopContext.close();
}

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir: videoDir, size: { width: 390, height: 844 } },
});
const mobile = await mobileContext.newPage();
await instrument(mobile);
try {
  await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await mobile.getByRole('heading', { level: 1, name: /Make room for/ }).waitFor({ timeout: 20000 });
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: path.join(outputDir, 'home-full-390.png'), fullPage: true });
  for (const [selector, name] of [
    ['.home-hero', 'hero'], ['.home-courses', 'course-collection'], ['.home-platform', 'platform-preview'],
    ['.home-how', 'how-it-works'], ['.home-included', 'whats-included'], ['.home-audience', 'who-its-for'],
    ['.home-path', 'learning-path'], ['#faq', 'faq'], ['.public-final-cta', 'final-cta'],
  ]) {
    const element = mobile.locator(selector);
    if (await element.count()) await element.screenshot({ path: path.join(outputDir, `${name}-390.png`) });
  }
  await overflow(mobile, 'Home', 390);

  await mobile.getByRole('button', { name: 'Open navigation menu' }).click();
  await mobile.waitForTimeout(250);
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-menu-open-390.png') });
  await mobile.keyboard.press('Escape');
  await mobile.waitForTimeout(220);
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-menu-closed-390.png') });

  await mobile.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await mobile.getByRole('button', { name: /Sign in/ }).click();
  await mobile.waitForTimeout(350);
  await mobile.screenshot({ path: path.join(outputDir, 'auth-validation-390.png'), fullPage: true });
  await overflow(mobile, 'Login validation', 390);
} finally {
  await mobileContext.close();
}

// Protected flows are captured when the local seed account and API are available.
const studentEmail = process.env.STUDENT_EMAIL || 'student@test.com';
const studentPassword = process.env.STUDENT_PASSWORD || 'password123';
const studentContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } } });
const student = await studentContext.newPage();
await instrument(student);
try {
  await student.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await student.locator('#login-email').fill(studentEmail);
  await student.locator('#login-password').fill(studentPassword);
  await student.getByRole('button', { name: /Sign in/ }).click();
  await student.waitForURL(/\/(my-learning|dashboard)(\?|$)/, { timeout: 8000 });
  await student.goto(`${baseUrl}/my-learning`, { waitUntil: 'domcontentloaded' });
  await student.waitForTimeout(900);
  await student.screenshot({ path: path.join(outputDir, 'my-learning-1440.png'), fullPage: true });
  const progressCount = await student.locator('.student-progress-track').count();
  results.push({ label: 'My learning progress bars', count: progressCount });
  await overflow(student, 'My learning', 1440);
} catch (error) {
  results.push({ label: 'My learning', skipped: error.message });
} finally {
  await studentContext.close();
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } } });
const admin = await adminContext.newPage();
await instrument(admin);
try {
  await admin.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await admin.locator('#login-email').fill(adminEmail);
  await admin.locator('#login-password').fill(adminPassword);
  await admin.getByRole('button', { name: /Sign in/ }).click();
  await admin.waitForURL(/\/admin\/dashboard/, { timeout: 8000 });
  await admin.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await admin.waitForTimeout(1200);
  await admin.screenshot({ path: path.join(outputDir, 'admin-dashboard-1440.png'), fullPage: true });
  await overflow(admin, 'Admin dashboard', 1440);
} catch (error) {
  results.push({ label: 'Admin dashboard', skipped: error.message });
} finally {
  await adminContext.close();
  await browser.close();
}

if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
await fs.writeFile(path.join(outputDir, 'verification.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log(`Screenshots and videos saved under ${outputDir}`);
