export const MAIN_HTML_PATH = '/main/html/index.html';

export function rewriteRootRequestUrl(requestUrl) {
  if (typeof requestUrl !== 'string') return requestUrl;

  const queryIndex = requestUrl.indexOf('?');
  const pathname = queryIndex >= 0 ? requestUrl.slice(0, queryIndex) : requestUrl;
  if (pathname !== '/') return requestUrl;

  const query = queryIndex >= 0 ? requestUrl.slice(queryIndex) : '';
  return `${MAIN_HTML_PATH}${query}`;
}

function installRootEntryRewrite(server) {
  server.middlewares.use((request, _response, next) => {
    request.url = rewriteRootRequestUrl(request.url);
    next();
  });
}

export function createRootEntryRewritePlugin() {
  return {
    name: 'rewrite-root-to-main-html',
    configureServer: installRootEntryRewrite,
    configurePreviewServer: installRootEntryRewrite
  };
}
