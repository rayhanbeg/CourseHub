import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5182';
const debugOne = process.env.AUTH_DEBUG_ONE === '1';
const outputDir = path.resolve(process.cwd(), '..', 'screenshots', 'auth-flash');
const student = { id: 'student-portfolio-check', name: 'CourseHub Student', email: 'student@test.com', role: 'student' };
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

const interceptApi = async (route) => {
  const url = new URL(route.request().url());
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://127.0.0.1:5182',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return;
  }
  if (url.pathname.endsWith('/auth/login')) {
    await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ success: true, user: student }) });
    return;
  }
  if (url.pathname.endsWith('/auth/me')) {
    if (debugOne) console.log('Mocking current-user verification:', url.pathname);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ success: true, user: student }) });
    return;
  }
  if (url.pathname.endsWith('/progress/all/my-progress')) {
    await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ success: true, progress: [] }) });
    return;
  }
  await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ success: true, courses: [], orders: [], progress: { lessons: [] }, enrollments: [], data: { courses: [], orders: [], progress: { lessons: [] } } }) });
};

const addThrottle = async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024, connectionType: 'cellular3g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
};

try {
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guest = await guestContext.newPage();
  guest.setDefaultNavigationTimeout(120000);
  guest.on('pageerror', (error) => console.error('Guest page error:', error.message));
  guest.on('console', (message) => { if (message.type() === 'error') console.error('Guest console error:', message.text()); });
  await guest.route('**/api/**', interceptApi);
  await guest.goto(baseUrl, { waitUntil: 'commit' });
  await guest.locator('.public-navbar').waitFor({ state: 'visible', timeout: 60000 });
  await guest.screenshot({ path: path.join(outputDir, 'guest-immediate-signin.png') });
  const guestFrame = await guest.evaluate(() => ({ signIn: !!document.querySelector('.public-navbar__signin'), skeleton: !!document.querySelector('.public-navbar__auth-skeleton') }));
  if (!guestFrame.signIn || guestFrame.skeleton) throw new Error('Guest did not see Sign in immediately.');
  await guest.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  if (await guest.locator('.motion-scroll-progress').count()) throw new Error('Scroll progress bar still exists.');
  await guest.screenshot({ path: path.join(outputDir, 'guest-scrolled-no-progress-bar.png') });
  await guestContext.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  if (debugOne) {
    page.on('request', (request) => { if (request.url().includes('/api/auth/')) console.log('Auth request:', request.url()); });
    page.on('response', (response) => { if (response.url().includes('/api/auth/')) console.log('Auth response:', response.status(), response.url()); });
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  }
  await page.route('**/api/**', interceptApi);
  await addThrottle(page);
  await page.goto(`${baseUrl}/login`, { waitUntil: 'commit' });
  await page.locator('#login-email').waitFor({ state: 'visible', timeout: 60000 });
  await page.locator('#login-email').fill(student.email);
  await page.locator('#login-password').fill('portfolio-check-password');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await page.waitForURL(/\/(dashboard|my-learning|admin\/dashboard)/, { timeout: 10000 });
  if (debugOne) console.log('Cached identity after login:', await page.evaluate(() => localStorage.getItem('coursehub_user')));

  const paths = debugOne ? ['/my-learning'] : ['/', '/courses', '/my-learning'];
  for (const pathname of paths) {
    for (let attempt = 1; attempt <= (debugOne ? 1 : 10); attempt += 1) {
      await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'commit' });
      await page.locator('.public-navbar').waitFor({ state: 'visible', timeout: 60000 });
      await page.locator('.public-navbar__auth-skeleton').waitFor({ state: 'visible', timeout: 15000 });
      const loadingState = await page.evaluate(() => ({
        signInVisible: !!document.querySelector('.public-navbar__signin'),
        skeletonVisible: !!document.querySelector('.public-navbar__auth-skeleton'),
        authSlot: (() => { const rect = document.querySelector('.public-navbar__auth-skeleton')?.getBoundingClientRect(); return rect ? { width: rect.width, height: rect.height } : null; })(),
        navbarWidth: document.querySelector('.public-navbar__inner')?.getBoundingClientRect().width,
        linksLeft: document.querySelector('.public-navbar__links')?.getBoundingClientRect().left,
      }));
      await page.screenshot({ path: path.join(outputDir, `${pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '-')}-${String(attempt).padStart(2, '0')}-loading.png`) });
      if (loadingState.signInVisible || !loadingState.skeletonVisible) throw new Error(`Authenticated ${pathname} reload ${attempt} rendered guest UI instead of the auth placeholder.`);
      if (debugOne) { await page.waitForTimeout(6000); console.log('After verification:', await page.evaluate(() => ({ cache: localStorage.getItem('coursehub_user'), signin: !!document.querySelector('.public-navbar__signin'), skeleton: !!document.querySelector('.public-navbar__auth-skeleton'), menu: !!document.querySelector('.public-user-menu__trigger'), body: document.body.innerText.slice(0, 220) }))); }
      await page.locator('.public-user-menu__trigger').waitFor({ state: 'visible', timeout: 10000 });
      const settled = await page.evaluate(() => ({
        signInVisible: !!document.querySelector('.public-navbar__signin'),
        authSlot: (() => { const rect = document.querySelector('.public-user-menu__trigger')?.getBoundingClientRect(); return rect ? { width: rect.width, height: rect.height } : null; })(),
        navbarWidth: document.querySelector('.public-navbar__inner')?.getBoundingClientRect().width,
        linksLeft: document.querySelector('.public-navbar__links')?.getBoundingClientRect().left,
        linksWidth: document.querySelector('.public-navbar__links')?.getBoundingClientRect().width,
      }));
      await page.screenshot({ path: path.join(outputDir, `${pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '-')}-${String(attempt).padStart(2, '0')}-settled.png`) });
      if (settled.signInVisible) throw new Error(`Sign in appeared for authenticated user at ${pathname}.`);
      if (Math.abs(settled.authSlot?.width - loadingState.authSlot?.width) > 0.5 || Math.abs(settled.authSlot?.height - loadingState.authSlot?.height) > 0.5) throw new Error(`Auth slot changed size at ${pathname}.`);
      if (Math.abs(settled.navbarWidth - loadingState.navbarWidth) > 0.5) {
        throw new Error(`Navbar geometry changed during auth resolution at ${pathname}.`);
      }
      if (await page.locator('.motion-scroll-progress').count()) throw new Error('Scroll progress bar exists.');
      results.push({ pathname, attempt, loading: loadingState, settled });
    }
  }
  await context.close();
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputDir, 'verification.json'), JSON.stringify(results, null, 2));
console.log(`Auth reload frames saved to ${outputDir}`);
console.log(`Checked ${results.length} throttled authenticated reloads.`);
