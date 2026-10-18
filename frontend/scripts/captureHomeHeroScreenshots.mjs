import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5182';
const outputDir = path.resolve(process.cwd(), '..', 'screenshots');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  for (const width of [1920, 1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width < 768 ? 1500 : 1400 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('.home-hero__details').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(950);
    const metrics = await page.evaluate(() => {
      const bounds = (element) => {
        const rect = element.getBoundingClientRect();
        return { left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) };
      };
      const hero = document.querySelector('.home-hero');
      const visual = document.querySelector('.home-hero__visual');
      const heading = document.querySelector('.home-hero__copy h1');
      const cards = [...document.querySelectorAll('.home-hero__float-card')];
      const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        hero: bounds(hero),
        heading: bounds(heading),
        visual: bounds(visual),
        arch: bounds(document.querySelector('.home-hero__arch')),
        details: bounds(document.querySelector('.home-hero__details')),
        cards: cards.map(bounds),
        headingCardOverlap: cards.some((card) => overlaps(bounds(heading), bounds(card))),
        cardExceedsCenterGutter: cards.some((card) => { const rect = bounds(card); const center = bounds(visual); return rect.left < center.left - 24 || rect.right > center.right + 24; }),
        columnLayout: getComputedStyle(document.querySelector('.home-hero__inner')).gridTemplateColumns,
        photoPresent: !!document.querySelector('.home-hero__student:not([hidden])'),
      };
    });
    if (metrics.overflow) throw new Error(`Horizontal page overflow at ${width}px.`);
    if (metrics.heading.left < 0 || metrics.heading.right > width) throw new Error(`Heading clipped at ${width}px.`);
    if (metrics.cards.some((card) => card.left < 0 || card.right > width)) throw new Error(`A floating card is clipped at ${width}px: ${JSON.stringify(metrics.cards)}.`);
    if (metrics.headingCardOverlap) throw new Error(`A floating card overlaps the heading at ${width}px.`);
    if (metrics.cardExceedsCenterGutter) throw new Error(`A floating card exceeds the center column gutters at ${width}px.`);
    if (metrics.cards.length !== 2) throw new Error('The hero must have exactly two floating cards.');
    await page.screenshot({ path: path.join(outputDir, `home-hero-${width}.png`), clip: { x: 0, y: 0, width, height: metrics.hero.bottom } });
    console.log(`${width}px`, JSON.stringify(metrics));
  }
  if (pageErrors.length) throw new Error(`Browser errors: ${pageErrors.join(' | ')}`);
} finally {
  await browser.close();
}
