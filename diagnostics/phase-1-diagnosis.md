# Fase 1 — Diagnóstico inicial

## Estado inspeccionado

- Repo GitHub `christiangfv/ni-o-terremoto-venezuela` no es accesible desde este entorno:
  - HTTPS: requiere credenciales válidas.
  - SSH deploy key de Coolify: `Repository not found`.
  - `GITHUB_TOKEN` local: inválido/401.
- No existe checkout local del proyecto en `/data/workspace`.
- Servicio actualmente desplegado en Coolify es un probe temporal en Docker Compose, no un proyecto Next.js:
  - Servicio Coolify: `wy5pm8qsv1hv8kq11lhrb0fj`
  - Container: `nino-terremoto-venezuela-wy5pm8qsv1hv8kq11lhrb0fj`
  - App probe: Python HTTP server simple.
- Supabase self-hosted está accesible desde Hermes y Coolify.
- Tablas de dominio requeridas aún no existían; solo existía `public.coolify_deploy_probe`.

## Reutilizable

- Infra Coolify + Docker networks.
- Supabase Auth/Postgres/Storage self-hosted.
- Acceso DB vía `docker exec supabase-db psql`.
- Patrón de app containers usando `SUPABASE_URL=http://supabase-kong:8000` en la red `supabase_default`.

## Falta

- Checkout real del frontend para integrar rutas/componentes sin rehacer UI.
- Migraciones del dominio.
- RLS/policies.
- Storage privado.
- RPC pública limitada.
- Servicios TS/Zod/RHF en el repo.
- Dashboard privado, admin, casos, reportes, entregas, traslados.

## Riesgos / inseguro

- El probe temporal no representa el stack esperado ni seguridad de producción.
- Repo no accesible impide integración real en frontend existente.
- URL pública permanente por Caddy/Coolify tiene problema TLS/proxy pendiente; Quick Tunnel es temporal.
- Antes de uso real falta revisión legal, threat model formal, DPIA/PIA, retención de datos, y proceso operacional.

## Decisión de Fase 1/2

Como el repo no está disponible, se avanza en lo que sí se puede completar sin rehacer frontend:

1. Crear artefactos locales versionables bajo `/data/workspace/ni-o-terremoto-venezuela`.
2. Implementar Fase 2 completa como migración SQL idempotente para Supabase.
3. Aplicar y verificar migración en Supabase self-hosted.
4. Dejar instrucciones para integrar en el repo real cuando Chris habilite acceso.
