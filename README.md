# Lloyd Product Management System

A technical examination project for managing pharmaceutical products. The application uses a pharmaceutical product-management domain inspired by the publicly available business domain of Lloyd Laboratories.

> This is **not** an official Lloyd Laboratories application. It does not represent Lloyd Laboratories' internal systems, workflows, databases, products, or business processes.

## Technology stack

- ReactJS with TypeScript and Vite
- Ant Design
- Axios
- ASP.NET Core Web API targeting .NET 10
- Entity Framework Core
- Microsoft SQL Server LocalDB
- Controller-based REST API
- Git and GitHub

## Repository structure

```text
lloyd-product-management-system/
├── client/                         React frontend
├── server/                         ASP.NET Core backend
├── Lloyd.ProductManagement.sln     Repository-root Visual Studio solution
├── .gitignore
└── README.md
```

The backend project is located at:

```text
server/Lloyd.ProductManagement.Api.csproj
```

Always open the repository-root solution rather than an old Visual Studio project session:

```text
Lloyd.ProductManagement.sln
```

## Prerequisites

Install the following on Windows:

- .NET 10 SDK
- Node.js and npm
- SQL Server LocalDB (`(localdb)\MSSQLLocalDB`)
- Visual Studio or VS Code with C# support
- Git

Verify the tools:

```powershell
dotnet --version
node --version
npm --version
git --version
```

## Database configuration

The development database uses SQL Server LocalDB and Windows authentication:

```text
Server=(localdb)\MSSQLLocalDB
Database=LloydProductManagementDb
Trusted_Connection=True
TrustServerCertificate=True
```

The connection string is in `server/appsettings.json`. It does not contain a database password. Do not add database passwords, JWT signing keys, or other secrets to committed configuration files.

The existing `InitialCreate` migration defines the Users, Categories, and Products tables. Do not delete or recreate that migration.

For a fresh database, apply the existing migrations from the repository root:

```powershell
dotnet ef database update --project .\server\Lloyd.ProductManagement.Api.csproj
```

If the `dotnet ef` command is unavailable, install or use the EF Core CLI tool appropriate for the installed .NET SDK.

## Backend setup and run

From the repository root:

```powershell
dotnet restore .\Lloyd.ProductManagement.sln
dotnet build .\Lloyd.ProductManagement.sln
```

For local development, configure a development admin user before the first run if the Users table is empty. These values are process environment variables and are not committed:

```powershell
$env:SeedAdmin__Username = "admin"
$env:SeedAdmin__Password = "replace-with-a-local-development-password"
$env:Jwt__Key = "replace-with-at-least-32-random-characters"
```

A development JWT key is generated automatically when `Jwt__Key` is omitted. Supplying a local key makes tokens remain valid across application restarts. In non-Development environments, `Jwt:Key` must be configured externally.

Start the HTTP profile:

```powershell
dotnet run --project .\server\Lloyd.ProductManagement.Api.csproj --launch-profile http
```

The expected local URL is:

```text
http://localhost:5240
```

The API does not define a root `/` endpoint. Use a specific API route such as:

```text
http://localhost:5240/api/categories
```

The HTTPS profile is also available:

```text
https://localhost:7095
```

Use only one backend process at a time. If port 5240 is already in use, stop the existing API process or use it instead of starting a second copy.

## Frontend setup and run

In a second terminal:

```powershell
Set-Location .\client
npm install
npm run dev
```

Open the Vite development URL shown in the terminal, normally:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to:

```text
http://localhost:5240
```

This keeps local browser requests same-origin and avoids requiring a separate development CORS configuration.

Frontend validation commands:

```powershell
npm run lint
npm run build
```

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "username": "admin",
  "password": "your-development-password"
}
```

A successful response returns a JWT access token and safe user information. Send the token on protected endpoints:

```http
Authorization: Bearer <access-token>
```

Passwords are stored using ASP.NET password hashing. Plaintext passwords and JWT signing keys are not stored in the repository.

## REST API

### Categories

```http
GET /api/categories
```

Returns active categories ordered by name. This endpoint is currently public.

### Products

All product endpoints require a bearer token.

```http
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Product list filtering:

```http
GET /api/products?search=tablet&categoryId=1
```

The list endpoint searches ProductName, GenericName, and DosageForm. It returns active products ordered by ProductName.

Create/update request example:

```json
{
  "productName": "Example Product",
  "genericName": "Example Generic",
  "categoryId": 1,
  "dosageForm": "Tablet",
  "strength": "500 mg",
  "description": "Example product description."
}
```

Expected status behavior:

- `POST` valid product: `201 Created`
- `GET` existing product: `200 OK`
- `GET` missing product: `404 Not Found`
- `PUT` valid product: `200 OK`
- `PUT` missing product: `404 Not Found`
- `DELETE` valid product: `204 No Content`
- `DELETE` missing product: `404 Not Found`
- Invalid request: `400 Bad Request`
- Missing/invalid authentication: `401 Unauthorized`

### Product summary report

```http
GET /api/reports/products/summary
```

Returns server-side aggregations for:

- Total products
- Active products
- Inactive products
- Products by category
- Products by dosage form

The report requires a bearer token.

## Testing the API with PowerShell

Start the backend first, then run:

```powershell
$baseUrl = "http://localhost:5240"

$loginBody = @{
  username = "admin"
  password = "your-development-password"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$headers = @{
  Authorization = "Bearer $($login.accessToken)"
}

Invoke-RestMethod "$baseUrl/api/categories"
Invoke-RestMethod "$baseUrl/api/products" -Headers $headers
Invoke-RestMethod "$baseUrl/api/products?search=tablet" -Headers $headers
Invoke-RestMethod "$baseUrl/api/reports/products/summary" -Headers $headers
```

Create a product:

```powershell
$productBody = @{
  productName = "Example Product"
  genericName = "Example Generic"
  categoryId = 1
  dosageForm = "Tablet"
  strength = "500 mg"
  description = "Created during API testing."
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "$baseUrl/api/products" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $productBody
```

## Challenges encountered

1. **Backend moved into the repository**
   - The backend was initially outside the Git repository.
   - A repository-root solution was created at `Lloyd.ProductManagement.sln`.
   - The solution references `server/Lloyd.ProductManagement.Api.csproj`.
   - Visual Studio may retain the old path in an already-open session; close and reopen the root solution.

2. **Generated files appeared as Git changes**
   - A root `.gitignore` was added for `.NET` `bin/` and `obj/` output, Node dependencies, build output, IDE files, logs, and local environment files.
   - Generated artifacts are not part of the feature commits.

3. **HTTP and HTTPS development profiles**
   - The HTTP profile listens on port 5240.
   - `UseHttpsRedirection` can log a warning when only the HTTP profile is running, but the API route still works.
   - The correct API route must be used instead of the undefined root `/` route.

4. **Authentication secrets and development users**
   - JWT signing keys and development passwords are supplied through environment variables.
   - No credentials are committed to Git.

5. **Frontend-to-backend local development**
   - Vite proxies `/api` requests to the ASP.NET Core server so the React app can call the API without adding a broad CORS policy for local development.

## Git feature history

Feature progress is intentionally separated into focused commits:

```text
chore: initialize frontend and backend projects
feat: add categories API and persistence
chore: automate API launch workflow
feat: configure database and category API
feat: implement user authentication
feat: implement product creation
feat: implement product retrieval
feat: implement product update
feat: implement product deletion
feat: add product search and filtering
feat: implement product summary report
feat: integrate React product management UI
```

## Scope and limitations

This is a technical examination project, not a production pharmaceutical system. It intentionally keeps the architecture simple:

- EF Core is used directly through `ApplicationDbContext`.
- There is no repository/CQRS/MediatR layer.
- JWT access tokens are stateless and short-lived.
- Product delete is a direct delete operation.
- The application uses LocalDB for development.
- Production secret management, rate limiting, refresh tokens, audit trails, and deployment infrastructure are outside the examination scope.

## Next development considerations

The core requested features are now represented:

- Login
- Product CRUD
- Product search/filtering
- Simple report generation
- RESTful API
- React and Ant Design frontend

Before a formal demonstration, verify the LocalDB service, set development environment variables, start the backend first, then start the client and test the login, product operations, and report from the frontend.
