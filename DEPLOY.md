# Deploy

## CI

GitHub Actions runs on every push/PR to `main`:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Workflow: `.github/workflows/ci.yml`.

## CD

Coolify application:

- UUID: `k8d4evj9ql0unfeq4dvk9mn1`
- Repo: `christiangfv/ni-o-terremoto-venezuela.git`
- Branch: `main`
- Build pack: Dockerfile
- Exposed port: `3000`
- Host mapping: `18081:3000`
- Auto deploy: enabled in Coolify.
- Stable internal container name: `nino-terremoto-venezuela-wy5pm8qsv1hv8kq11lhrb0fj`

A VPS-side CD watchdog also runs every 2 minutes:

- Script: `/data/.hermes/scripts/ntv_coolify_autodeploy.py`
- Cron: `NTV Coolify autodeploy after CI`
- Behavior: checks GitHub `main`, waits for the `CI` workflow to complete successfully for that commit, then triggers Coolify deploy.

The current public HTTPS endpoint is a Cloudflare Quick Tunnel:

```txt
https://mission-their-michael-heard.trycloudflare.com
```

The tunnel targets the stable Docker internal name:

```txt
nino-terremoto-venezuela-wy5pm8qsv1hv8kq11lhrb0fj:3000
```

Coolify is configured to deploy the Next.js app using that same custom internal container name so the existing tunnel URL keeps pointing at the latest deployment.

## Production caveat

The `trycloudflare.com` URL is not a permanent production domain. For real production, move to a fixed domain and TLS:

```txt
nino-terremoto-venezuela.fuentesvalenzuela.cl -> 217.196.61.182
```
