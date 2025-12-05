import { NITTER_INSTANCES, TIMEOUT_MS } from './config.js';

async function fetchFromInstance(domain, encodedQuery) {
  const url = `${domain}/search?f=tweets&q=${encodedQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: "GET",
      headers: {
        "Upgrade-Insecure-Requests": "1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
        "Referer": domain,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      throw new Error("Invalid content type");
    }

    const html = await response.text();

    const isValidNitter = html.includes('class="timeline') ||
      html.includes("class='timeline") ||
      html.includes('timeline-item');

    const isCaptcha = html.includes('cf-browser-verification') ||
      html.includes('challenge-platform') ||
      html.includes('Cloudflare');

    if (!isValidNitter || isCaptcha) {
      throw new Error("Response 200 OK but blocked by Cloudflare/Captcha");
    }

    return { success: true, source: 'nitter', instance: domain, html };

  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`${domain}: ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
  }
}

export async function searchNitter(query) {
  const truncatedQuery = query.substring(0, 100);
  const encodedQuery = encodeURIComponent(truncatedQuery);

  // Fisher-Yates shuffle
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const shuffledInstances = shuffleArray(NITTER_INSTANCES);
  
  const BATCH_SIZE = 3;
  const allErrors = [];

  for (let i = 0; i < shuffledInstances.length; i += BATCH_SIZE) {
    const batch = shuffledInstances.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(domain => fetchFromInstance(domain, encodedQuery));

    try {
      const result = await Promise.any(batchPromises);
      return result;
    } catch (aggregateError) {
      if (aggregateError.errors) {
        aggregateError.errors.forEach(e => allErrors.push(e.message));
      } else {
        allErrors.push(aggregateError.message);
      }
    }
  }

  throw new Error(`All Nitter instances failed. Reasons: ${allErrors.join(' | ')}`);
}