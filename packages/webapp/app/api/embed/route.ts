/** This route handler is used to return an oEmbed response for embeddable widgets. */
export async function GET(req: Request) {
  const response = {
    type: 'rich',
    version: '1.0',
    url: 'https://www.podverse.ai/podcast/omnibus',
    html: '<iframe src="https://www.podverse.ai/embed/chat/omnibus" width="100%" height="600" frameborder="0" scrolling="no"></iframe>',
  };
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
