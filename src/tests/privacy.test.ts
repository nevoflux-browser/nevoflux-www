import { describe, expect, it } from 'vitest';
import { contactMarkdown, getPrivacyPolicy } from '~/privacy';
import { DISCORD_URL, PRIVACY_LAST_UPDATED } from '~/constants';

describe('getPrivacyPolicy', () => {
  it('renders the English policy as HTML with headings', () => {
    const { bodyHtml } = getPrivacyPolicy('en');
    expect(bodyHtml).toContain('<h2');
    expect(bodyHtml.length).toBeGreaterThan(500);
  });

  it('renders a distinct, non-empty Chinese policy', () => {
    const en = getPrivacyPolicy('en').bodyHtml;
    const { bodyHtml: zh } = getPrivacyPolicy('zh');
    expect(zh).toContain('<h2');
    expect(zh).not.toBe(en);
  });

  it('exposes the configured last-updated date', () => {
    expect(getPrivacyPolicy('en').lastUpdated).toBe(PRIVACY_LAST_UPDATED);
  });
});

describe('contactMarkdown', () => {
  it('uses the contact email when one is configured', () => {
    const md = contactMarkdown('en', 'privacy@nevoflux.app');
    expect(md).toContain('privacy@nevoflux.app');
  });

  it('falls back to community channels when no email is set', () => {
    const md = contactMarkdown('en', '');
    expect(md).toContain(DISCORD_URL);
  });
});
