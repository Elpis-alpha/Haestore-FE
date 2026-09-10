/**
 * Where to send someone after they sign in.
 *
 * `?next=` is an attacker-supplied string that becomes a redirect target, which is the
 * classic open-redirect shape: a link to `haestore.test/sign-in?next=https://evil.test`
 * carries this site's name and domain into a phishing landing page, and the shopper
 * checked the domain before clicking — which is exactly the advice they were given.
 *
 * So the value is not sanitised, it is *validated*: anything that is not obviously a
 * local path is discarded for the default. There is no cleverness here to get wrong —
 * no unescaping, no protocol stripping, no second pass.
 */
const DEFAULT_DESTINATION = '/account';

export function safeNextPath(value: string | undefined | null): string {
  if (!value) return DEFAULT_DESTINATION;

  // It has to be a path on this site.
  if (!value.startsWith('/')) return DEFAULT_DESTINATION;

  /**
   * `//evil.test` is a protocol-relative URL: browsers read it as an absolute address
   * on another host, and it sails through a naive "starts with a slash" check.
   * `/\evil.test` is the same trick, because browsers normalise a backslash to a slash
   * when parsing an authority.
   */
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_DESTINATION;

  // A control character can truncate a header or smuggle a second one into it.
  if (hasControlCharacter(value)) return DEFAULT_DESTINATION;

  // Never bounce back into the sign-in flow; that is a loop.
  if (value === '/sign-in' || value.startsWith('/sign-in?')) return DEFAULT_DESTINATION;

  return value;
}

/**
 * Tested by code point rather than with a regular expression.
 *
 * A `/[\u0000-\u001f]/` literal is the obvious spelling and puts a control-character
 * range into the source, which linters flag and which survives copy-paste into places
 * it should not. This reads the same and is inert.
 */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}
