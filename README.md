# Assetory

**Simplify fixed asset management and double-entry accounting with real-time financial clarity.**

Have you ever struggled to track asset depreciation, maintain double-entry bookkeeping, and generate accurate financial statements for your business?

**Assetory** helps you streamline fixed asset tracking, automate straight-line depreciation, manage multi-level Chart of Accounts (COA), record balanced journal entries, and generate comprehensive financial reports with a modern, real-time interactive dashboard.

---

## Key Features

- **Executive Financial Dashboard** → Real-time KPI cards, interactive curved trend charts (Income vs Expense), asset portfolio breakdowns, and recent activity logs.
- **Fixed Asset Lifecycle & Automated Depreciation** → Track asset acquisition costs, residual values, and tax groups. Automatic straight-line monthly & annual depreciation calculations with single-click ledger posting.
- **Double-Entry General Ledger & Journals** → Auto-generated sequential journal vouchers (`JV-YYYYMM-XXXX`), strict debit/credit balance enforcement, and journal reversal support.
- **Pre-Seeded Chart of Accounts (COA)** → Multi-level standard accounting hierarchy (Assets, Liabilities, Equity, Revenues, Expenses) auto-configured for every user.
- **Comprehensive Financial Statements** → Real-time generation of Balance Sheet (Neraca Keuangan), Income Statement (Laba dan Rugi), Cash Flow Statement (Arus Kas), Trial Balance (Neraca Saldo), Equity Changes, and Financial Notes (CALK).
- **Multi-Tenant Data Isolation** → User-scoped data security ensuring complete isolation of accounts, assets, and transactions.

---

## How It Works

### 1. Asset & Depreciation Engine
- Records fixed assets with tax group categories (4, 8, 16, or 20-year economic life).
- Computes monthly and cumulative straight-line depreciation automatically.
- Posts depreciation adjustments directly to general ledger accounts with full audit trail.

### 2. Double-Entry Accounting System
- Enforces strict accounting equation: `Assets = Liabilities + Equity`.
- Validates double-entry balance (`SUM(debit) == SUM(kredit)`) before committing transactions.
- Supports journal reversal workflows to adjust historical entries cleanly.

### 3. Interactive Analytics & Reporting
- Custom React SVG trend visualization with bezier curves, gradient areas, view switchers (Area, Bar, Net Profit), and hover inspection cards.
- On-the-fly financial report calculation with exportable print-friendly views.

---

## Project Architecture

```
assetory/
├── app/
│   ├── Http/
│   │   ├── Controllers/         # Application controllers (Asset, Journal, COA, Report Dashboard)
│   │   └── Middleware/          # Auth & Inertia requests middleware
│   ├── Models/                  # Eloquent models (Asset, Coa, Journal, JournalItem, User)
│   └── Providers/               # Service providers
│
├── config/                      # Configuration files (app, database, inertia)
│
├── database/
│   ├── factories/               # Model factories for testing
│   ├── migrations/              # Database schema migrations
│   └── seeders/                 # Database seeders (CoaSeeder, SimulationSeeder)
│
├── docs/                        # Account CSV mapping & documentation
│   └── acount.csv
│
├── public/                      # Static assets & build output
│   ├── favicon.svg              # Browser tab SVG icon
│   └── logo.svg                 # Application logo
│
├── resources/
│   ├── css/                     # Tailwind CSS entry points
│   ├── js/                      # React Inertia frontend application
│   │   ├── components/          # Reusable UI components (FinancialTrendChart, AppSidebar, AppHeader)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Page layouts (AppLayout, AuthLayout)
│   │   ├── pages/               # Inertia page components (dashboard, assets, coas, journals, reports)
│   │   └── types/               # TypeScript definitions
│   └── views/
│       └── app.blade.php        # Main Blade HTML root template
│
├── routes/                      # Route definitions
│   ├── web.php                  # Web application routes
│   ├── auth.php                 # Authentication routes
│   └── settings.php             # User settings routes
│
├── tests/                       # Automated test suite (Pest PHP)
│   ├── Feature/                 # Feature tests (AssetTest, JournalTest, DashboardTest, ReportTest)
│   └── Unit/                    # Unit tests
│
├── vite.config.js               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── composer.json                # PHP dependencies
└── package.json                 # Node.js dependencies
```

---

## Technology Stack

### Backend
- **Laravel 12** → Modern PHP framework with streamlined file structure
- **PHP 8.2+** → Core backend language
- **Inertia.js v2 (Laravel)** → Monolithic SPA adapter without API complexity
- **MySQL / PostgreSQL** → Relational database engine
- **Pest 3 & PHPUnit 11** → Testing framework

### Frontend
- **React 19** → UI component rendering
- **Inertia.js v2 (React)** → Client-side SPA routing & state management
- **TypeScript** → Type safety and DX
- **Tailwind CSS v4** → Utility-first styling with modern dark mode support
- **Lucide React** → Icon set
- **Vite 6** → Frontend asset bundler

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Falrlz/assetory.git
cd assetory
```

### 2. Install PHP & Node.js Dependencies
```bash
composer install
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
php artisan key:generate
```

Configure your database connection in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=assetory
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Run Database Migrations & Seeders
```bash
php artisan migrate --seed
```

### 5. Start Development Servers
Run the full application (Vite + Laravel CLI) concurrently:
```bash
composer run dev
```

Or run them individually:
```bash
# Terminal 1: Vite dev server
npm run dev

# Terminal 2: Laravel local server
php artisan serve
```

Access the application in your browser at `http://localhost:8000`.

---

## Running Tests & Code Quality

### Run Automated Backend Tests (Pest)
```bash
php artisan test --compact
```

### Run Pint Code Formatter
```bash
vendor/bin/pint --dirty
```

### Build Production Bundle
```bash
npm run build
```

---
