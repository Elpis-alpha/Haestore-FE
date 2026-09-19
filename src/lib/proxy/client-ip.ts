/**
 * The shopper's address, carried to the API across the Worker's `/api/*` proxy.
 *
 * The API sees every proxied call arrive from Cloudflare, so its per-IP sign-in throttle
 * would put every shopper in one bucket. Cloudflare tells the Worker who is really
 * calling (`cf-connecting-ip`, which a client cannot set); this copies it into a header
 * the API reads, beside a secret that proves the Worker wrote it. Anything the client
 * sent under the same name is overwritten, never forwarded.
 *
 * The API side is back-end/src/modules/auth/client-ip.ts.
 */
export const CLIENT_IP_HEADER = 'x-haestore-client-ip';
export const PROXY_SECRET_HEADER = 'x-haestore-proxy-secret';

export function stampClientIp(incoming: Headers, secret: string | undefined): Headers | null {
  const address = incoming.get('cf-connecting-ip');
  if (!secret || !address) return null;
  const headers = new Headers(incoming);
  headers.set(CLIENT_IP_HEADER, address);
  headers.set(PROXY_SECRET_HEADER, secret);
  return headers;
}
