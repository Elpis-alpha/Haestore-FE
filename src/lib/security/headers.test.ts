import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './headers';

const directive = (name: string) =>
  contentSecurityPolicy()
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `)) ?? '';

describe('contentSecurityPolicy', () => {
  it('allows both image CDNs', () => {
    expect(directive('img-src')).toContain('https://res.cloudinary.com');
    expect(directive('img-src')).toContain('https://images.unsplash.com');
  });

  it("allows the console's direct upload to Cloudinary", () => {
    expect(directive('connect-src')).toContain('https://api.cloudinary.com');
  });

  it('allows Stripe.js and its frames', () => {
    expect(directive('script-src')).toContain('https://js.stripe.com');
    expect(directive('frame-src')).toContain('https://js.stripe.com');
    expect(directive('frame-src')).toContain('https://hooks.stripe.com');
    expect(directive('connect-src')).toContain('https://api.stripe.com');
  });

  it('allows the PayPal SDK, sandbox included', () => {
    expect(directive('script-src')).toContain('https://www.paypal.com');
    expect(directive('frame-src')).toContain('https://*.paypal.com');
  });

  it('closes the doors a CSP exists for', () => {
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive('object-src')).toBe("object-src 'none'");
    expect(directive('base-uri')).toBe("base-uri 'self'");
  });
});

describe('securityHeaders', () => {
  it('sends HSTS without includeSubDomains — the domain has other tenants', () => {
    const hsts = securityHeaders().find((h) => h.key === 'Strict-Transport-Security')!;
    expect(hsts.value).toBe('max-age=31536000');
  });

  it('includes the CSP', () => {
    expect(securityHeaders().map((h) => h.key)).toContain('Content-Security-Policy');
  });
});
