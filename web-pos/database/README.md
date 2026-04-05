# Web POS — Database

PostgreSQL schema and seed data for the restaurant POS system, targeting **Supabase**.

---

## Migration Files

| File | Description |
|---|---|
| `migrations/001_initial_schema.sql` | Enums, all tables, indexes, RLS policies, `updated_at` triggers |
| `migrations/002_seed_data.sql` | Demo store, users, menu, modifiers, areas, and tables |

Always run migrations **in order** — `001` must be applied before `002`.

---

## Running Migrations on Supabase

### Option A — Supabase SQL Editor (quickest for development)

1. Open your Supabase project dashboard.
2. Go to **SQL Editor** in the left sidebar.
3. Paste the contents of `001_initial_schema.sql` and click **Run**.
4. Paste the contents of `002_seed_data.sql` and click **Run**.

### Option B — Supabase CLI

```bash
# Link your project (first time only)
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

The CLI picks up files from the `supabase/migrations/` folder by convention.
If you are using this `database/migrations/` folder instead, copy the files
into `supabase/migrations/` or run them manually via the SQL Editor.

### Option C — psql (direct connection)

```bash
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f migrations/002_seed_data.sql
```

Retrieve `DATABASE_URL` from **Project Settings → Database → Connection string**
in the Supabase dashboard.

---

## Seed Data

`002_seed_data.sql` inserts development-only sample data:

- **1 store** — 範例餐廳
- **3 staff** — 王小明 (OWNER), 陳美華 (MANAGER), 李大山 (STAFF)
- **3 menu categories** and **8 menu items**
- **3 modifier groups** on 牛排套餐 (doneness, side dish, add-ons)
- **2 table areas** (室內 / 戶外) and **8 tables** (A1–A5, B1–B3)

Do not run seed data in production.

---

## Supabase Auth Integration

`user_profiles.user_id` is a foreign key to `auth.users(id)` — Supabase's
built-in authentication table.

Typical sign-up flow:

1. User signs up via Supabase Auth (email/password, OAuth, etc.).
2. A `user_profiles` row is created — either manually by an admin or via a
   Supabase Database Function / Edge Function triggered on `auth.users` insert.
3. The `user_profiles.user_id` column is set to the `auth.users.id` value
   returned after sign-up.

The seed file contains **placeholder UUIDs** for `user_id` (`aaaaaaaa-0000-…`).
Replace them with real `auth.users` IDs before using the seed data in a live
Supabase project, or create the auth users first and let your application
create the profile rows automatically.

### Row Level Security

All tables have RLS enabled. Authenticated users can only read and write data
that belongs to their own store, determined by looking up their `store_id` in
`user_profiles` via the helper function `auth_user_store_id()`.

The Supabase **service role** key bypasses RLS automatically and is safe to use
in server-side admin scripts and Edge Functions.
