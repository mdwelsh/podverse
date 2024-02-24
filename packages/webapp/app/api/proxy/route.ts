
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const fetchUrl = reqUrl.searchParams.get("url");
  if (!fetchUrl) {
    return new Response("Missing URL", { status: 400 });
  }
  const res = await fetch(fetchUrl);
  const body = await res.body;
  return new Response(body);
};
