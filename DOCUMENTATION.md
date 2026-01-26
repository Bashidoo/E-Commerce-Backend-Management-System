# OrderFlow Pro - System Documentation

## 1. Executive Summary
OrderFlow Pro is a comprehensive Store Management System designed for e-commerce workflows. It provides a unified interface for order processing, inventory management, customer support, and shipping label generation.

The system utilizes a **Hybrid Architecture**:
- **Backend (.NET 8):** Handles complex business logic, authentication, proxying third-party APIs (Sendify), and serves as the centralized API.
- **Frontend (React 19):** Handles UI/UX, direct hardware integration (Bluetooth/LAN Printers), and real-time data synchronization via Supabase.

---

## 2. Architecture Overview

### 2.1 Backend: Clean Architecture
The backend follows strict **Clean Architecture** principles to ensure separation of concerns and testability.

*   **`Domain` (Core):**
    *   Contains enterprise logic and types (`Entities`).
    *   Defines `Interfaces` for repositories.
    *   *Dependencies:* None.
*   **`Application` (Business Logic):**
    *   Orchestrates data flow.
    *   Contains `DTOs`, `Validators` (FluentValidation), `Mappings` (AutoMapper), and `Services`.
    *   *Dependencies:* Domain.
*   **`Infrastructure` (Data & External):**
    *   Implements interfaces defined in Domain.
    *   Handles Database (EF Core / Npgsql), Auth (JWT Generation), and external integrations.
    *   *Dependencies:* Application, Domain.
*   **`API` (Presentation):**
    *   Entry point (Controllers).
    *   Global Exception Handling.
    *   Dependency Injection (DI) composition root (`Program.cs`).
    *   *Dependencies:* Application, Infrastructure.

### 2.2 Frontend: Service-Based React
The frontend uses a service layer pattern to abstract data fetching logic from UI components.

*   **`services/`**: Contains singletons (`orderService`, `inventoryService`) that interact with Supabase or the .NET API.
*   **`contexts/`**: Global state management for Authentication, Themes, and Notifications.
*   **`components/`**: Modular UI elements using Tailwind CSS.
*   **Hardware Integration**:
    *   **Zebra Browser Print**: HTTP calls to `localhost:9100` for LAN printing.
    *   **Web Bluetooth**: Direct browser-to-device communication for mobile printing.

---

## 3. Database Schema
The system runs on **PostgreSQL** (via Supabase).

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| `Users` | System users and customers. | 1:N with `Orders`. |
| `Products` | Inventory items with soft-delete support. | N:1 with `Categories`. |
| `Categories` | Product classifications. | 1:N with `Products`. |
| `Orders` | Sales transactions. | 1:N with `OrderItems`, N:1 with `Users`. |
| `OrderItems` | Line items within an order. | N:1 with `Orders`, N:1 with `Products`. |
| `SupportTickets` | Customer support issues. | N:1 with `Users`, Optional link to `Orders`. |

---

## 4. Configuration & Environment Variables

### 4.1 Backend (`appsettings.json` / Environment)
The backend requires specific environment variables to run, especially in Cloud Run.

| Variable | Key in `appsettings.json` | Description |
| :--- | :--- | :--- |
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | PostgreSQL connection string. |
| `JwtSettings__Secret` | `JwtSettings:Secret` | Key for signing JWT tokens (min 32 chars). |
| `SENDIFY_API_KEY` | *N/A (Env Only)* | Private key for the Sendify Shipping API. |
| `ASPNETCORE_ENVIRONMENT` | *N/A* | `Development` or `Production`. |

**Startup Logic:**
The backend implements a **Fail-Fast** mechanism. If `DefaultConnection` is missing at startup, the application throws a `Critical Error` and shuts down immediately to prevent unstable states.

### 4.2 Frontend (`.env` / Local Storage)
The frontend connects to Supabase and the .NET Backend.

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | The unique Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for Supabase RLS. |
| `VITE_API_URL` | URL of the deployed .NET Backend. |

**Runtime Configuration:**
If environment variables are missing (common in some build pipelines), the user can configure Supabase credentials via the **Settings Modal** (Gear Icon) in the UI. These are saved to `localStorage`.

---

## 5. API Reference
The backend exposes a RESTful API documented via Swagger (`/swagger` in Development).

### Shipping / Labels
*   **POST** `/api/shipping/generate-label`
    *   *Headers:* `x-api-key` (Optional override)
    *   *Body:* `{ shipment_ids: [...] }`
    *   *Description:* Proxies requests to Sendify. Uses the server-side `SENDIFY_API_KEY` if no header is provided, ensuring secrets aren't exposed to the client.

### Authentication
*   **POST** `/api/auth/login`
    *   *Body:* `{ email, password }`
    *   *Returns:* JWT Token + User Info.
*   **POST** `/api/auth/register`
    *   *Body:* User registration details.

### Orders
*   **GET** `/api/orders`
*   **POST** `/api/orders`
    *   *Description:* Creates an order and decrements product stock transactionally.

### Products
*   **GET** `/api/products` (Active only)
*   **DELETE** `/api/products/{id}`
    *   *Description:* Performs a Soft Delete (`IsDeleted = true`).

---

## 6. Deployment Guide (Google Cloud Run)

The application is containerized using a multi-stage `Dockerfile` optimized for Linux.

### Dockerfile Stages:
1.  **Base:** `mcr.microsoft.com/dotnet/aspnet:8.0` (Runtime image).
2.  **Build:** `mcr.microsoft.com/dotnet/sdk:8.0` (Compiles code).
3.  **Publish:** specific `dotnet publish` command.
4.  **Final:** Copies artifacts to Base image.

### Deployment Steps (Manual):
1.  Authenticate with GCP: `gcloud auth login`
2.  Build the image:
    ```bash
    docker build -t gcr.io/[PROJECT_ID]/orderflow-backend .
    ```
3.  Push to Registry:
    ```bash
    docker push gcr.io/[PROJECT_ID]/orderflow-backend
    ```
4.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy orderflow-api \
      --image gcr.io/[PROJECT_ID]/orderflow-backend \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars "ConnectionStrings__DefaultConnection=[DB_STRING],JwtSettings__Secret=[SECRET],SENDIFY_API_KEY=[KEY]"
    ```

### Troubleshooting
*   **500 Startup Error:** Check Cloud Run logs. If you see "CRITICAL ERROR: ConnectionString... is NULL", verify your secret injection or environment variable naming.
*   **CORS Issues:** Ensure the Frontend URL is allowed in `Program.cs` CORS policy (currently allows `*`).

---

## 7. Label Printing Workflow

### Scenario A: Local Zebra Printer (LAN/USB)
1.  User clicks "Scan Local Network".
2.  Frontend calls `localhost:9100/available` (Zebra Browser Print Agent).
3.  User selects printer.
4.  ZPL code is sent directly from Browser -> Local Agent -> Printer.

### Scenario B: Bluetooth Mobile Printer
1.  User clicks "Scan Bluetooth".
2.  Browser requests `navigator.bluetooth.requestDevice`.
3.  User pairs device.
4.  ZPL code is written to the printer's GATT Characteristic (Serial Port Profile).

### Scenario C: PDF Label (Sendify)
1.  User clicks "Generate Label".
2.  Frontend calls Backend `/api/shipping/generate-label`.
3.  Backend injects API Secret and calls Sendify API.
4.  Sendify returns a PDF URL.
5.  Frontend opens PDF in a new tab.
