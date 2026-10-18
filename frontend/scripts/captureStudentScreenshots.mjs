import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5182';
const email = process.env.STUDENT_EMAIL || 'student@test.com';
const password = process.env.STUDENT_PASSWORD || 'password123';
const outputDir = path.resolve(process.cwd(), '..', 'screenshots');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

const capture = async (route, label, width) => {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Horizontal overflow at ${label}, ${width}px.`);
  await page.screenshot({ path: path.join(outputDir, `${label}-${width}.png`), fullPage: true });
};

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|my-learning)/, { timeout: 20000 });

  await capture('/my-learning', 'student-my-learning', 1440);
  await capture('/dashboard/orders', 'student-orders', 1440);

  const receiptButton = page.getByRole('button', { name: 'Download receipt' }).first();
  if (await receiptButton.count()) {
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await receiptButton.click();
    const download = await downloadPromise;
    await download.saveAs(path.join(outputDir, 'receipt.pdf'));
    console.log(`Saved ${download.suggestedFilename()}`);
  } else {
    console.warn('No completed/refunded order exists for the demo student; PDF capture was skipped.');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await capture('/my-learning', 'student-my-learning', 390);
  await capture('/dashboard/orders', 'student-orders', 390);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} finally {
  await browser.close();
}
