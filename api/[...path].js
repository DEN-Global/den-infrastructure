import { handleRequest } from '../den-backend/src/app.js';
import { createPostgresDatabase } from '../den-backend/src/postgres-d1.js';

async function readBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return Buffer.from(req.body);
    return Buffer.from(JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const request = new Request(new URL(req.url, `https://${req.headers.host ?? 'den-global.vercel.app'}`), {
      method: req.method,
      headers,
      ...(body ? { body, duplex: 'half' } : {}),
    });
    const env = {
      DB: createPostgresDatabase(process.env.SUPABASE_DATABASE_URL),
      APP_ORIGIN: process.env.APP_ORIGIN ?? 'https://den-global.vercel.app',
      APP_ORIGIN_ALIASES: process.env.APP_ORIGIN_ALIASES ?? '',
      PRIMARY_ADMIN_ID: process.env.PRIMARY_ADMIN_ID ?? 'disabled-preview-admin',
      MFA_ENCRYPTION_KEY: process.env.MFA_ENCRYPTION_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SIGNIN_EMAIL_FROM: process.env.SIGNIN_EMAIL_FROM,
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
      VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    };
    const result = await handleRequest(request, env);
    res.statusCode = result.status;
    result.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'set-cookie') res.setHeader(name, value);
    });
    const cookies = result.headers.getSetCookie?.() ?? [];
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(JSON.stringify({ event: 'vercel.api.failed', error: error?.code ?? 'INTERNAL_ERROR' }));
    res.statusCode = 500;
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(JSON.stringify({ error: 'INTERNAL_ERROR' }));
  }
}
