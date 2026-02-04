const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.toString()));
  try {
    const resp = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('PAGE_RESPONSE:', resp && resp.status(), 'URL:', page.url());
    // Give page time to hydrate and render any client-side elements
    await page.waitForTimeout(1200);
    const html = await page.content();
    console.log('CONTENT_LENGTH:', html.length);
    console.log('CONTENT_FULL:', html);
    const hasVideoInHtml = html.includes('<video');
    console.log('VIDEO_TAG_IN_HTML:', hasVideoInHtml);

    // Try to find a video element in DOM (attached after hydration)
    const videoHandle = await page.$('video');
    if (!videoHandle) {
      throw new Error('No <video> element found in DOM');
    }
    const state = await page.evaluate((v) => {
      return {
        paused: v.paused,
        muted: v.muted,
        autoplay: v.autoplay,
        playsInline: v.getAttribute('playsinline') !== null || v.playsInline === true,
        src: v.currentSrc || v.src,
        readyState: v.readyState,
      };
    }, videoHandle);

    console.log('VIDEO_STATE:', JSON.stringify(state, null, 2));
    // Also try to call play and see if it resolves
    const playResult = await page.evaluate(async (v) => {
      try {
        await v.play();
        return { played: true };
      } catch (e) {
        return { played: false, error: String(e) };
      }
    }, videoHandle);
    console.log('PLAY_ATTEMPT:', JSON.stringify(playResult, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
