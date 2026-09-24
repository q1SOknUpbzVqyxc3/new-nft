import { handleNftNewsRequest } from "../server/nft-news.mjs";

// Vercel function behind the /news/nft rewrite (see vercel.json).
export default async function handler(request, response) {
  const [status, headers, body] = await handleNftNewsRequest(new URL(request.url ?? "/", "http://localhost"));
  response.statusCode = status;
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.end(body);
}
