// Netlify Function — proxies requests to the Anthropic API so your
// ANTHROPIC_API_KEY stays server-side and never reaches the browser.
//
// Netlify functions use a different handler signature than Vercel's, and
// live in netlify/functions/ instead of /api/ — that mismatch is why the
// original Vercel-shaped function didn't work here. The frontend still
// calls /api/claude though: see the redirect rule in netlify.toml that
// maps /api/* to this function, so index.html didn't need to change.
//
// Written in plain CommonJS (exports.handler) rather than ESM — this is
// the most universally-supported format across all of Netlify's deploy
// paths (git-connected builds, CLI, and manual drag-and-drop), and avoids
// module-resolution edge cases that ESM `export` syntax can hit.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in Netlify: Site configuration → Environment variables, then trigger a new deploy.' })
    };
  }

  // Optional access gate: if SITE_PASSCODE is set in your environment,
  // every request must include a matching x-site-passcode header.
  // Leave SITE_PASSCODE unset to make the site fully open.
  if (process.env.SITE_PASSCODE) {
    const headers = event.headers || {};
    const provided = headers['x-site-passcode'] || headers['X-Site-Passcode'];
    if (provided !== process.env.SITE_PASSCODE) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or missing passcode.' }) };
    }
  }

  try {
    const parsed = JSON.parse(event.body || '{}');
    const system = parsed.system;
    const messages = parsed.messages;
    const max_tokens = parsed.max_tokens;

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Request body must include a "messages" array.' }) };
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        // Swap this for whichever model your API key has access to.
        model: 'claude-sonnet-5',
        max_tokens: max_tokens || 1500,
        system: system || undefined,
        messages: messages
      })
    });

    const rawText = await upstream.text();

    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: rawText
    };
  } catch (err) {
    console.error('Claude proxy error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy request failed', detail: String(err && err.message ? err.message : err) })
    };
  }
};
