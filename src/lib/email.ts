export async function sendMagicLinkEmail(
  env: Env,
  { email, url }: { email: string; url: string }
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // Dev fallback: no email provider configured.
    console.log(`[magic-link] ${email} -> ${url}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? 'NevoFlux <login@nevoflux.app>',
      to: email,
      subject: 'Sign in to NevoFlux',
      html: `<p>Click to sign in: <a href="${url}">${url}</a></p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
}
