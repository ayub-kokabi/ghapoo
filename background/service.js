import { NITTER_INSTANCES, TIMEOUT_MS } from './config.js';

async function fetchFromInstance(domain, encodedQuery) {
  const url = `${domain}/search?f=tweets&q=${encodedQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: "GET",      
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const html = await response.text();

    const hasItems = html.includes('timeline-item');
    const hasNoItemsMsg = html.includes('timeline-none');

    if (!hasItems && !hasNoItemsMsg) {
      throw new Error("Invalid HTML structure (No timeline/message found)");
    }

    return { success: true, source: 'nitter', instance: domain, html };

  } catch (err) {
    clearTimeout(timeoutId);
    throw err; 
  }
}

export async function searchNitter(query) {
  const truncatedQuery = query.substring(0, 100);
  const encodedQuery = encodeURIComponent(truncatedQuery);

  const promises = NITTER_INSTANCES.map(domain => fetchFromInstance(domain, encodedQuery));

  try {
    const result = await Promise.any(promises);
    return result;
  } catch (aggregateError) {
    const errorMessages = aggregateError.errors ? aggregateError.errors.map(e => e.message) : [aggregateError.message];
    throw new Error(`All Nitter instances failed. Reasons: ${errorMessages.join(' | ')}`);
  }
}