# Bhausaheb Faral Agent

AI storefront that lets a small Indian home business take Diwali faral orders from the diaspora, with PayPal handling cross-border payment.

> Work in progress for *Build What's Next with PayPal and AI*. The full README (demo link, judge quick test, architecture) lands in M7. See `PRD.md` for the plan.

## Local setup

Requires Node 22+ and Docker (or any Postgres).

```bash
# 1. Postgres for local dev
docker run -d --name bhausaheb-pg -e POSTGRES_USER=faral -e POSTGRES_PASSWORD=faral \
  -e POSTGRES_DB=faral -p 5433:5432 postgres:17-alpine

# 2. Env
cp .env.example .env.local
# set DATABASE_URL=postgresql://faral:faral@localhost:5433/faral and fill the rest

# 3. Install, migrate, seed, run
npm install          # also runs `prisma generate`
npx prisma migrate dev
npm run db:seed
npm run dev          # http://localhost:3000
```

Useful scripts: `npm test` (unit tests), `npm run db:reset` (wipe + re-seed), `node scripts/generate-product-art.mjs` (placeholder images).

## License

MIT, see [LICENSE](LICENSE).
