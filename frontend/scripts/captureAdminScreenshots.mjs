import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');

const outputDir = path.resolve(process.cwd(), 'screenshots');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => location.pathname === '/login' || document.querySelector('h1')?.textContent?.includes('Overview'), undefined, { timeout: 20000 });
  if (new URL(page.url()).pathname === '/login') {
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
  }
  await page.getByRole('heading', { name: 'Overview' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(700);

  for (const width of [1920, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(350);
    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector('aside[aria-label="Admin sidebar"]');
      const main = document.querySelector('main');
      const close = sidebar.querySelector('button[aria-label="Close admin navigation"]');
      const bounds = (element) => {
        const rect = element.getBoundingClientRect();
        return { x: Math.round(rect.x), width: Math.round(rect.width) };
      };
      return {
        sidebar: bounds(sidebar), main: bounds(main), sidebarTransform: getComputedStyle(sidebar).transform,
        closeDisplay: getComputedStyle(close).display,
        publicNavbar: [...document.querySelectorAll('nav')].some((nav) => /Home/.test(nav.textContent || '')),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    if (width >= 1024) {
      if (metrics.sidebar.x !== 0 || metrics.sidebar.width !== 260 || metrics.main.x < 260 || metrics.closeDisplay !== 'none') throw new Error(`Desktop layout failed at ${width}px: ${JSON.stringify(metrics)}`);
    } else if (metrics.sidebar.width !== 260 || metrics.sidebar.x > -250 || metrics.main.x !== 0 || metrics.closeDisplay === 'none') {
      throw new Error(`Mobile layout failed at ${width}px: ${JSON.stringify(metrics)}`);
    }
    if (metrics.publicNavbar || metrics.horizontalOverflow) throw new Error(`Admin page check failed at ${width}px: ${JSON.stringify(metrics)}`);
    await page.screenshot({ path: path.join(outputDir, `admin-dashboard-${width}.png`), fullPage: true });
    console.log(`${width}px ${JSON.stringify(metrics)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open admin navigation' }).click();
  await page.waitForTimeout(200);
  if (await page.locator('aside[aria-label="Admin sidebar"]').evaluate((element) => getComputedStyle(element).transform === 'matrix(1, 0, 0, 1, -260, 0)')) throw new Error('Mobile sidebar did not open.');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.locator('aside[aria-label="Admin sidebar"]').evaluate((element) => element.getBoundingClientRect().right > 1)) throw new Error('Escape did not close mobile sidebar.');
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log('Mobile drawer open/Escape close passed.');
} finally {
  await browser.close();
}
