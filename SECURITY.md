# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BuildHub, **please do not open a public
issue**. Report it privately:

- Telegram: [@NorganJJ](https://t.me/NorganJJ)
- Or use GitHub's [private vulnerability reporting](https://github.com/NorganJJ/buildhub/security/advisories/new)

Please include:
- A description of the issue and its impact
- Steps to reproduce (proof of concept if possible)
- Affected version / commit

You can expect an initial response within a few days. Please give us reasonable
time to fix the issue before any public disclosure.

## Supported Versions

Only the latest released version receives security fixes while the project is in beta.

---

## Built-in protections

These are already implemented in the application code:

- **Auth**: bcrypt password hashing (cost 12); short-lived JWT access tokens;
  refresh token stored in an `httpOnly`, `Secure` (prod), `SameSite=Lax` cookie —
  never exposed to JavaScript (XSS-resistant).
- **Email / reset tokens**: stored as SHA-256 hashes at rest; email verification
  required before login.
- **Downloads**: gated behind authentication and served via short-lived
  HMAC-signed URLs (TTL ~2 min), not long-lived tokens in the query string.
- **OAuth CSRF**: the `state` parameter is bound to an `httpOnly` cookie and
  validated on callback.
- **Passwords**: checked against the Have I Been Pwned k-anonymity API on
  register / reset (fail-open, opt-out via `DISABLE_HIBP`).
- **Uploads**: extension allow-list + magic-byte sniffing; malware-scan hook
  (`SCAN_PROVIDER`) scaffolded for later integration.
- **HTTP headers**: `@fastify/helmet` (HSTS, `nosniff`, `no-referrer`, frame
  protection); 1 MB body limit; per-route rate limits.
- **Error handling**: 5xx responses return a generic message — no stack traces
  or Prisma internals leak to clients.
- **Secrets**: the app refuses to boot in production if JWT secrets are weak,
  default, or identical to each other.
- **Account deletion**: GDPR-style `DELETE /api/users/me` removes the account,
  cascades projects/comments, and cleans up files on disk.

---

## Production deployment checklist

Work through this before exposing BuildHub to the internet.

### Secrets & configuration
- [ ] Generate strong, unique secrets: `openssl rand -hex 64` for
      `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `DOWNLOAD_SECRET`.
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must differ from each other.
- [ ] Set `NODE_ENV=production` (enables `Secure` cookies + secret strength guard).
- [ ] Use `backend/.env.production.example` as the template; never commit real `.env`.
- [ ] Rotate any secret that was ever committed or shared in plaintext.

### Network / TLS
- [ ] Terminate TLS at nginx (or a managed LB) using `deploy/nginx.conf`.
- [ ] Obtain certs via Let's Encrypt / certbot; enable auto-renewal.
- [ ] Force HTTPS (HTTP → HTTPS redirect) and enable HSTS (preload once stable).
- [ ] Restrict CORS: `CLIENT_URL` must be the exact production origin, not `*`.

### Database & storage
- [ ] Strong DB password; database not exposed to the public internet.
- [ ] Regular automated backups (and test a restore).
- [ ] For real scale, move uploads to S3 (`STORAGE_TYPE=s3`) behind signed URLs.
- [ ] Run `prisma migrate deploy` (not `db push`) for production schema changes.

### Hardening
- [ ] Run the backend container as a non-root user (see `deploy/Dockerfile.backend`).
- [ ] Keep dependencies patched (Dependabot is configured in `.github/dependabot.yml`).
- [ ] Put a real malware scanner behind `SCAN_PROVIDER` before accepting public uploads.
- [ ] Enable a WAF / rate limiting at the edge (nginx limits are a baseline, not a DDoS shield).
- [ ] Monitor logs and set up alerting for repeated 4xx/5xx and auth failures.
