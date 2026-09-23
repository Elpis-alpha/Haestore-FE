import { describe, expect, it } from 'vitest';
import { stampClientIp } from './client-ip';

const SECRET = 'a_proxy_secret_that_is_at_least_32_chars';

describe('stampClientIp', () => {
  it("stamps Cloudflare's address and the secret, keeping everything else", () => {
    const incoming = new Headers({ 'cf-connecting-ip': '198.51.100.7', cookie: 'a=1' });
    const out = stampClientIp(incoming, SECRET)!;
    expect(out.get('x-haestore-client-ip')).toBe('198.51.100.7');
    expect(out.get('x-haestore-proxy-secret')).toBe(SECRET);
    expect(out.get('cookie')).toBe('a=1');
  });

  it('overwrites an address the client sent itself', () => {
    const incoming = new Headers({
      'cf-connecting-ip': '198.51.100.7',
      'x-haestore-client-ip': '10.0.0.1',
    });
    expect(stampClientIp(incoming, SECRET)!.get('x-haestore-client-ip')).toBe('198.51.100.7');
  });

  it('does nothing without a secret — local development', () => {
    const incoming = new Headers({ 'cf-connecting-ip': '198.51.100.7' });
    expect(stampClientIp(incoming, undefined)).toBeNull();
  });

  it('does nothing when Cloudflare supplied no address', () => {
    expect(stampClientIp(new Headers(), SECRET)).toBeNull();
  });
});
