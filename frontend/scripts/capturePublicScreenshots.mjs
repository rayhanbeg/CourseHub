import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5182';
const outputDir = path.resolve(process.cwd(), 'screenshots');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

const save = async (name, width) => {
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Horizontal overflow on ${name} at ${width}px.`);
  await page.screenshot({ path: path.join(outputDir, `${name}-${width}.png`), fullPage: true });
};

const openCourses = async (width) => {
  if (width < 768) {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('link', { name: 'Courses', exact: true }).last().click();
  } else {
    await page.getByRole('link', { name: 'Courses', exact: true }).first().click();
  }
  await page.getByRole('heading', { name: /Explore what’s possible/ }).waitFor();
};

const capturePages = async (width) => {
  await page.getByRole('link', { name: 'CourseHub', exact: true }).first().click();
  await page.getByRole('heading', { name: /Make room for/ }).waitFor();
  await page.locator('.hero-course-preview, .public-empty').first().waitFor({ state: 'visible', timeout: 15000 });
  await save('public-home', width);
  if (!await page.locator('.hero-course-preview, .public-course-card').count()) {
    throw new Error('The home page did not show the published course preview/card.');
  }

  await openCourses(width);
  await page.locator('a.public-course-card').first().waitFor({ state: 'visible', timeout: 10000 });
  await save('public-courses', width);
  await page.locator('a.public-course-card').first().click();
  await page.getByRole('heading', { level: 1 }).waitFor();
  await save('public-course-details', width);
  await page.getByRole('link', { name: 'Sign in', exact: true }).last().click();
  await page.getByRole('heading', { name: /Pick up where/ }).waitFor();
  await save('public-login', width);
};

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Make room for/ }).waitFor();
  await capturePages(1440);
  await page.setViewportSize({ width: 390, height: 844 });
  await capturePages(390);
  if (pageErrors.length) throw new Error(`Browser errors: ${pageErrors.join(' | ')}`);
  console.log('Public screenshots captured and overflow checked at 1440px and 390px.');
} finally {
  await browser.close();
}
