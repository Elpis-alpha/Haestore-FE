import { describe, expect, it } from 'vitest';
import { assertWorkerApiOrigin } from './api-origin';

const worker = (API_ORIGIN?: string) => ({ HAESTORE_BUILD_TARGET: 'workers', API_ORIGIN });

describe('assertWorkerApiOrigin', () => {
  it('accepts a portless https origin — what production has', () => {
    expect(() => assertWorkerApiOrigin(worker('https://api.example.com'))).not.toThrow();
  });

  it('refuses an origin with a port, naming the cause', () => {
    // OpenNext compiles the rewrite's host with path-to-regexp, which reads ":5003" as a
    // parameter and throws on every /api/* request.
    expect(() => assertWorkerApiOrigin(worker('http://172.17.0.1:5003'))).toThrow(/port/);
  });

  it('refuses a Worker build with no API_ORIGIN, which would bake in 127.0.0.1:5000', () => {
    expect(() => assertWorkerApiOrigin(worker(undefined))).toThrow(/API_ORIGIN/);
  });

  it('leaves every other build alone — next dev and next start handle ports', () => {
    expect(() => assertWorkerApiOrigin({ API_ORIGIN: 'http://127.0.0.1:5000' })).not.toThrow();
    expect(() => assertWorkerApiOrigin({})).not.toThrow();
  });
});
