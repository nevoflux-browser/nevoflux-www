import { createAuthClient } from 'better-auth/client';
import { magicLinkClient } from 'better-auth/client/plugins';

// baseURL defaults to the current origin (+ /api/auth), which is what we want.
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
