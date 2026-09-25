# Databases — Gig

Two stores, one compose file.

```bash
cd databases
docker compose up -d
```

| Store    | Why it's here                                            | Port |
|----------|----------------------------------------------------------|------|
| Postgres | Durable data: users, platforms, income records, statements, ITR filings, GST/e-invoices, calendar tokens, reviews, FAQs | `5433` |
| Redis    | Ephemeral data: OTP codes + rate-limit counters (TTL-managed), GET-cached read endpoints | `6380` |

First boot runs `postgres/init/01-schema.sql` then `02-seed.sql` automatically
(docker-entrypoint-initdb.d). Data survives across `docker compose down`
(the `gig_pgdata` volume); use `down -v` to wipe.

## Redis key layout

All keys carry a TTL. Nothing here is durable; flush safely in dev.

### Auth — OTP codes

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `otp:{purpose}:{mobile}` | 6-digit code | 5 min | Login / PAN-update OTP. Deleted on successful verify. |
| `rl:otp:req:{mobile}` | counter | 60 min | Max 3 OTP sends per mobile per hour. |
| `rl:otp:ver:{mobile}` | counter | 15 min | Max 5 verify attempts, else new OTP required. |

### Cache — GET responses

| Key | TTL | Purpose |
|-----|-----|---------|
| `cache:/faqs` | 10 min | FAQ list — nearly static, high read volume |
| `cache:/reviews` | 2 min | Approved reviews wall |
| `cache:/stats/public` | 5 min | Landing-page counters |

Cache keys are written through `redisClient.cacheAside(key, ttl, loader)`,
which handles stampede control (only one caller loads on miss).

## Seeding by hand

The init scripts only run on an **empty** data directory. To reseed an
existing database:

```bash
docker exec -i gig-postgres psql -U gig -d gig_db < postgres/init/01-schema.sql
docker exec -i gig-postgres psql -U gig -d gig_db < postgres/init/02-seed.sql
```
