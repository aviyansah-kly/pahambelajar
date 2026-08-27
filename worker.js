export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const type = response.headers.get('content-type') || '';

    if ((url.pathname === '/' || url.pathname.endsWith('.html')) && type.includes('text/html')) {
      let html = await response.text();
      if (!html.includes('pahambelajar-enhancements.js')) {
        html = html.replace('</body>', '<script src="/pahambelajar-enhancements.js"></script><script src="/math-grade1.js"></script><script src="/math-engine.js"></script></body>');
      } else {
        if (!html.includes('math-grade1.js')) html = html.replace('</body>', '<script src="/math-grade1.js"></script></body>');
        if (!html.includes('math-engine.js')) html = html.replace('</body>', '<script src="/math-engine.js"></script></body>');
      }
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      return new Response(html, { status: response.status, statusText: response.statusText, headers });
    }

    return response;
  }
};