import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMagicLinkEmail } from '~/lib/email';

describe('sendMagicLinkEmail', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('logs the link in dev when no RESEND_API_KEY', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await sendMagicLinkEmail({ RESEND_API_KEY: '' } as unknown as Env, {
      email: 'a@b.com',
      url: 'https://x/magic',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('https://x/magic'));
  });

  it('POSTs to Resend when RESEND_API_KEY is set', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await sendMagicLinkEmail({ RESEND_API_KEY: 'key', RESEND_FROM: 'x@y.com' } as unknown as Env, {
      email: 'a@b.com',
      url: 'https://x/magic',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
