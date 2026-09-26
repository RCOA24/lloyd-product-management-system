# Lloyd Product Management System

A full-stack technical examination project for managing pharmaceutical product catalogue records. It is inspired by the public Lloyd Laboratories business domain.

> This is **not** an official Lloyd Laboratories application. It does not represent Lloyd Laboratories' internal systems, workflows, databases, products, or business processes. All seeded product records are demonstration data, not official SKUs or stock data.

## Features

- JWT-protected product CRUD
- Search and category filtering
- Product availability: **Available** or **Out of stock**
- Out-of-stock products appear first in the product catalogue
- Category and product summary reporting, CSV export, and browser print/PDF
- Automatic Entity Framework Core database migrations and idempotent demo-data seeding on API startup
- React + Ant Design frontend with a Vite API proxy

## Technology stack

- React, TypeScript, Vite, Ant Design, Axios
- ASP.NET Core Web API targeting .NET 10
- Entity Framework Core and SQL Server LocalDB
- JWT bearer authentication
- Git and GitHub

## Repository structure

```text
lloyd-product-management-system/
├── client/                              React frontend
├── server/                              ASP.NET Core backend
│   ├── Lloyd.ProductManagement.Api.csproj
│   └── Migrations/                      EF Core schema history
├── Lloyd.ProductManagement.sln          Visual Studio solution
└── README.md
```

Open `Lloyd.ProductManagement.sln` when using Visual Studio.

## Prerequisites

This guide is written for Windows and PowerShell. Install:

1. [.NET 10 SDK](https://dotnet.microsoft.com/download)
2. [Node.js LTS](https://nodejs.org/) (includes npm)
3. SQL Server LocalDB, using the default `(localdb)\MSSQLLocalDB` instance
4. Git
5. Optionally, Visual Studio or VS Code with C# support

Verify the command-line tools from the repository root:

```powershell
dotnet --version
node --version
npm --version
git --version
```

The API project targets `net10.0`. If `dotnet --version` does not report a compatible .NET 10 SDK, install it before continuing.

## Run from a clean clone

### 1. Clone and restore dependencies

```powershell
git clone https://github.com/RCOA24/lloyd-product-management-system.git
Set-Location .\lloyd-product-management-system

dotnet restore .\Lloyd.ProductManagement.sln
Set-Location .\client
npm ci
Set-Location ..
```

`npm ci` installs the exact frontend dependency versions recorded in `client/package-lock.json`. If you intentionally change dependencies, use `npm install` instead.

### 2. Configure a development administrator

Before the **first** backend start, set these environment variables in the PowerShell terminal that will run the API:

```powershell
$env:SeedAdmin__Username = "admin"
$env:SeedAdmin__Password = "replace-with-a-strong-local-password"
$env:Jwt__Key = "replace-this-with-at-least-32-random-characters"
```

- The seed creates an administrator only when both `SeedAdmin__*` values are set and the `Users` table is empty.
- The password is stored as an ASP.NET Core password hash; no plaintext password is committed.
- `Jwt__Key` is optional in Development. Without it, the API creates a temporary key at startup, which invalidates login tokens after every restart. Supplying a local value keeps tokens valid across restarts.
- Do **not** commit passwords, JWT keys, or `.env.local` files.

### 3. Start the backend

The easiest path is the HTTPS profile, because the frontend proxies to it by default:

```powershell
dotnet run --project .\server\Lloyd.ProductManagement.Api.csproj --launch-profile https
```

Expected API URLs:

```text
https://localhost:7095
http://localhost:5240
```

On its first successful start, the API automatically:

1. Connects to `(localdb)\MSSQLLocalDB`.
2. Creates or migrates the `LloydProductManagementDb` database using all EF Core migrations.
3. Seeds categories, standard available demo products, and six out-of-stock demo products.
4. Seeds the administrator configured in step 2 when no users exist.

No separate `dotnet ef database update` command is needed during normal startup. To apply migrations manually instead, run:

```powershell
dotnet ef database update --project .\server\Lloyd.ProductManagement.Api.csproj
```

### 4. Trust the local HTTPS certificate if needed

If the HTTPS API profile fails due to a development certificate problem, run once in an elevated or normal developer PowerShell as appropriate:

```powershell
dotnet dev-certs https --trust
```

Then stop and restart the API.

### 5. Start the frontend

Open a second PowerShell terminal in the repository root:

```powershell
Set-Location .\client
npm run dev
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

The browser sends requests to `/api`; Vite proxies them to `https://localhost:7095`. This is the intended local-development configuration and avoids requiring a broad API CORS policy.

### 6. Sign in

Use the credentials from step 2, for example:

```text
Username: admin
Password: replace-with-a-strong-local-password
```

## Database and seeded data

The committed development connection string is in `server/appsettings.json`:

```text
Server=(localdb)\MSSQLLocalDB;Database=LloydProductManagementDb;Trusted_Connection=True;TrustServerCertificate=True
```

It uses Windows authentication and contains no password. The availability migration adds a required `Products.AvailabilityStatus` column whose default is `Available`, so existing rows receive `Available` when the migration is applied.

The seeder is **idempotent by product name**: it adds missing records but does not overwrite records that already exist. A new database receives standard generic entries plus these six `OutOfStock` demonstration records:

- Demo Product - Out of Stock
- Demo Antibiotic - Out of Stock
- Demo Antifungal - Out of Stock
- Demo Antihistamine - Out of Stock
- Demo Vitamin - Out of Stock
- Demo Other Product - Out of Stock

The API returns out-of-stock records before available records, then sorts alphabetically within each group.

## Backend commands

From the repository root:

```powershell
dotnet build .\Lloyd.ProductManagement.sln
dotnet run --project .\server\Lloyd.ProductManagement.Api.csproj --launch-profile https
```

The API has no root (`/`) route. Use `https://localhost:7095/api/categories` to confirm that it is responding.

To run the HTTP-only profile instead:

```powershell
dotnet run --project .\server\Lloyd.ProductManagement.Api.csproj --launch-profile http
```

When using HTTP-only mode, create an uncommitted `client/.env.local` file with:

```text
VITE_API_PROXY_TARGET=http://localhost:5240
```

Restart Vite after creating or changing this file. Run only one API process at a time.

## Frontend commands

```powershell
Set-Location .\client
npm run lint
npm run build
npm run dev
```

## REST API

### Authentication

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "your-local-development-password"
}
```

A successful login returns a JWT access token. Send it to protected endpoints:

```http
Authorization: Bearer <access-token>
```

### Categories

```http
GET /api/categories
```

Returns active categories ordered by name. This endpoint is public.

### Products

All product endpoints require a bearer token.

```http
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Optional list filters:

```http
GET /api/products?search=tablet&categoryId=1
```

Create or update payload example:

```json
{
  "productName": "Example Product",
  "genericName": "Example Generic",
  "categoryId": 1,
  "dosageForm": "Tablet",
  "strength": "500 mg",
  "description": "Example product description.",
  "availabilityStatus": "Available"
}
```

Allowed availability values are `Available` and `OutOfStock`. The API accepts them case-insensitively and returns the normalized value. Invalid values return `400 Bad Request`.

### Product summary report

```http
GET /api/reports/products/summary
```

The report requires a bearer token and returns total, active/inactive, category, and dosage-form counts. In the React UI, export the snapshot as CSV or use **Print / PDF** to save through the browser.

## API smoke test with PowerShell

After starting the HTTP profile and configuring the matching client/proxy as needed:

```powershell
$baseUrl = "http://localhost:5240"

$loginBody = @{
  username = "admin"
  password = "your-local-development-password"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$headers = @{ Authorization = "Bearer $($login.accessToken)" }

Invoke-RestMethod "$baseUrl/api/categories"
Invoke-RestMethod "$baseUrl/api/products" -Headers $headers
Invoke-RestMethod "$baseUrl/api/products?search=tablet" -Headers $headers
Invoke-RestMethod "$baseUrl/api/reports/products/summary" -Headers $headers
```

## Troubleshooting

| Symptom | Cause and resolution |
| --- | --- |
| `dotnet` cannot target `net10.0` | Install the .NET 10 SDK and reopen the terminal. |
| API fails before it starts | Confirm SQL Server LocalDB is installed and that your Windows account can access `(localdb)\MSSQLLocalDB`. Database migration runs before the API begins serving requests. |
| HTTPS API/certificate error | Run `dotnet dev-certs https --trust`, then restart the API. |
| Frontend cannot reach `/api` | Start the HTTPS backend profile, or set `VITE_API_PROXY_TARGET=http://localhost:5240` in ignored `client/.env.local` when using HTTP-only mode; restart Vite afterwards. |
| Login returns `401 Unauthorized` | Confirm the seeded username/password. If a user already exists, changing `SeedAdmin__*` will not reset that user; use the original credentials or intentionally recreate the local development database. |
| Existing token suddenly stops working | Set a persistent local `Jwt__Key`; otherwise Development generates a new temporary key each API restart. |
| A second API start fails or a build cannot copy output files | Stop the already-running API/debug session first. Only one process can own the ports and output assemblies at a time. |
| A new seed is not appearing | Seeds add records only when their product name is missing; they do not update existing records. Restart the API to run the seed check. |

## Validation

Run before committing changes:

```powershell
Set-Location .\client
npm run lint
npm run build
Set-Location ..
dotnet build .\Lloyd.ProductManagement.sln
```

## Scope and limitations

This is a technical examination project, not a production pharmaceutical system. It intentionally uses a simple architecture and does not include production secret management, refresh tokens, audit trails, inventory quantity management, rate limiting, or deployment infrastructure. Product availability is a demonstration status and should not be treated as a real inventory source of truth.
