export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    return env.ASSETS.fetch(`https://assets.local${path}${url.search}`);
  }
};
