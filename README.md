# TIPC Admin System

A modern Article Management System built with Next.js, Prisma, and PostgreSQL for TIPC (Taiwan Indigenous People Cultural Park).

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tipc"

# Cloudinary (Required for image uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

**📚 See [docs/CLOUDINARY_SETUP.md](docs/CLOUDINARY_SETUP.md) for detailed Cloudinary setup instructions**

### 3. Setup Database
```bash
# Run migrations
npx prisma migrate dev

# Seed initial data
npx tsx scripts/seed-nine-blocks.ts

# Create test user (optional)
npx tsx scripts/create-test-user.ts
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page.

## Features

### ✅ Article Management
- Rich block-based content editor
- Text, Image, and Quote blocks
- Drag-and-drop block reordering
- Reference annotations with validation
- Multiple videos and podcasts per article

### ✅ Image Handling
- **Cloudinary Integration** - All images stored in Cloudinary CDN
- Automatic image optimization
- Cover image support (required for each article)
- Content block images
- Image preview and management

### ✅ Metadata & Classification
- Nine Blocks categorization (九宮格分類)
- Cake Category (蛋糕圖分類)
- Keywords (up to 6 per article)
- Custom slug generation

### ✅ Security
- User authentication with bcrypt
- Input validation with Zod
- SQL injection prevention
- CSRF protection

## Project Structure

```
TIPC_adminSystem/
├── app/
│   ├── api/                    # API routes
│   │   ├── articles/           # Article CRUD operations
│   │   ├── auth/login/         # User authentication
│   │   ├── keywords/search/    # Keyword search
│   │   ├── metadata/           # Metadata fetching
│   │   └── upload-image/       # Cloudinary image upload
│   ├── dashboard/              # Admin dashboard
│   │   ├── upload/article/     # Article creation page
│   │   └── update/article/[id] # Article editing page
│   └── login/                  # Login page
├── lib/
│   ├── cloudinary.ts           # Cloudinary configuration
│   ├── prisma.ts               # Prisma client with connection pooling
│   └── validation/             # Zod validation schemas
│       ├── article.schema.ts   # Article validation rules
│       ├── reference-integrity.ts # Reference validation
│       └── index.ts            # Validation exports
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── scripts/
│   ├── seed-nine-blocks.ts     # Seed 九宮格 categories
│   └── create-test-user.ts     # Create test admin user
├── types/
│   └── article.ts              # TypeScript type definitions
└── docs/                       # Documentation
    ├── CLOUDINARY_SETUP.md
    ├── DATA_MODEL_RATIONALE.md
    └── IMAGE_METADATA_STORAGE.md
```

## Documentation

- **[Cloudinary Setup](docs/CLOUDINARY_SETUP.md)** - Complete guide for image upload integration
- **[Data Model Rationale](docs/DATA_MODEL_RATIONALE.md)** - Database design decisions
- **[Image Metadata Storage](docs/IMAGE_METADATA_STORAGE.md)** - How images are stored and managed
- **[Validation Usage](VALIDATION_USAGE.md)** - Article validation patterns and examples

## Technology Stack

- **Frontend**: Next.js 16.1.1 (Turbopack), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma ORM with PostgreSQL adapter
- **Database**: PostgreSQL with connection pooling (pg)
- **Image Storage**: Cloudinary CDN
- **Validation**: Zod schema validation
- **Authentication**: bcrypt password hashing
- **TypeScript**: Full type safety

## Development

### Run Database Migrations
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

### View Database
```bash
npx prisma studio
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
