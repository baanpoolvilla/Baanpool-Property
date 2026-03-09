# PropAdmin — Dynamic Property Management System

A **schema-driven admin web app** for managing property listings. Field definitions live in the database so the data model can evolve **without changing frontend code**.

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Framework | Next.js 16 (App Router) |
| UI        | React, TailwindCSS, shadcn/ui (base-ui) |
| Icons     | Lucide React            |
| Database  | PostgreSQL              |
| API       | PostgREST               |

## Quick Start

### 1. Database

```bash
# Create a PostgreSQL database, then run the seed script:
psql -d your_db -f database/setup.sql
```

This creates:
- `property_fields` — dynamic field definitions (schema)
- `properties` — property listings with JSONB `data` column
- Sample seed data (27 fields + 2 sample properties)

### 2. PostgREST

Point PostgREST at your database:

```ini
db-uri = "postgres://user:pass@localhost:5432/your_db"
db-schemas = "public"
db-anon-role = "web_anon"
server-port = 3001
```

### 3. Frontend

```bash
npm install
cp .env.example .env.local   # edit NEXT_PUBLIC_POSTGREST_URL if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/admin`.

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Property list
│   │   ├── layout.tsx            # Admin layout (Toaster)
│   │   ├── fields/
│   │   │   └── page.tsx          # Field management (CRUD)
│   │   └── property/
│   │       └── [id]/
│   │           └── page.tsx      # Dynamic property form (new / edit)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirects to /admin
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── admin-shell.tsx           # Sidebar + mobile nav wrapper
│   ├── admin-sidebar.tsx         # Desktop sidebar
│   ├── admin-mobile-nav.tsx      # Mobile hamburger nav
│   ├── completeness-score.tsx    # Data completeness progress bar
│   └── dynamic-field.tsx         # Core: renders field by type
├── hooks/
│   ├── use-property-fields.ts    # Cached field schema fetcher
│   └── use-auto-save.ts          # Debounced auto-save hook
└── lib/
    ├── api.ts                    # PostgREST API client
    ├── constants.ts              # Sections, field types
    ├── types.ts                  # TypeScript types
    └── utils.ts                  # shadcn cn() helper
database/
└── setup.sql                     # Full DB schema + seed data
```

## Pages

### `/admin` — Property List
- Searchable table of all properties
- Shows House ID, Name, Location, Guests, Completeness Score
- Delete with confirmation dialog

### `/admin/property/new` — New Property
### `/admin/property/[id]` — Edit Property
- Dynamic form generated from field definitions in DB
- Fields grouped by section with collapsible cards
- Supported types: text, number, boolean (switch), select, textarea, multiselect
- Completeness score bar
- Auto-save (3s debounce) on existing properties

### `/admin/fields` — Field Management
- CRUD table for field definitions
- Add / edit fields via dialog
- Toggle active/inactive
- Set type, section, order, required, options

## How Dynamic Fields Work

```
Admin manages fields → property_fields table
                              ↓
                    GET /property_fields
                              ↓
                    DynamicField component renders correct input
                              ↓
                    Data saved to properties.data (JSONB)
```

## Environment Variables

| Variable                    | Default                 | Description        |
|-----------------------------|-------------------------|--------------------|
| `NEXT_PUBLIC_POSTGREST_URL` | `http://localhost:3001` | PostgREST base URL |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
