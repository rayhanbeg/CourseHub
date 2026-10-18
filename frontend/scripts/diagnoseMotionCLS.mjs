import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => {
  window.__cls = 0; window.__entries = [];
  new PerformanceObserver((list) => list.getEntries().forEach((entry) => {
    if (!entry.hadRecentInput) {
      window.__cls += entry.value;
      window.__entries.push({ value: entry.value, sources: (entry.sources || []).map((source) => ({
        node: source.node?.className?.baseVal || source.node?.className || source.node?.tagName,
        previous: source.previousRect, current: source.currentRect,
      })) });
    }
  })).observe({ type: 'layout-shift', buffered: true });
});
await page.goto('http://127.0.0.1:5182/courses', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log(JSON.stringify(await page.evaluate(() => ({ cls: window.__cls, entries: window.__entries })), null, 2));
await browser.close();
