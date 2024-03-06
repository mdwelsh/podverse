/**
 * This endpoint is used to proxy requests to third-party URLs.
 * This is needed for, e.g., access to externally-hosted podcast audio due to CORS restrictions.
 */
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const fetchUrl = reqUrl.searchParams.get('url');
  if (!fetchUrl) {
    return new Response('Missing URL', { status: 400 });
  }
  console.log(`Proxy fetch: ${fetchUrl}`);
  const reqHeaders: HeadersInit = new Headers();
  reqHeaders.set('Accept', req.headers.get('accept') || '*/*');
  reqHeaders.set('User-Agent', req.headers.get('user-agent') || '');
  reqHeaders.set('Range', req.headers.get('range') || '');
  const res = await fetch(fetchUrl, { headers: reqHeaders });
  if (!res.ok) {
    return new Response('Error fetching URL', { status: res.status });
  }
  const contentType = res.headers.get('content-type');
  const contentLength = res.headers.get('content-length');
  const contentRange = res.headers.get('content-range');
  const acceptRanges = res.headers.get('accept-ranges');
  const headers: HeadersInit = new Headers();
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }
  if (contentRange) {
    headers.set('Content-Range', contentRange);
  }
  if (acceptRanges) {
    headers.set('Accept-Ranges', acceptRanges);
  }
  const body = await res.body;
  return new Response(body, {
    status: res.status,
    headers,
  });
}
