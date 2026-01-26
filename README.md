# OrderFlow Pro 📦

> A professional order management, inventory control, and label printing system tailored for e-commerce workflows.

OrderFlow Pro is a full-stack solution designed to streamline warehouse operations. It combines a responsive React frontend with a robust .NET 8 Clean Architecture backend, featuring real-time database interactions, hardware integration for label printing, and cloud-native deployment capabilities.

---

## 🚀 Tech Stack

### Frontend (Client)
*   **Framework:** React 19 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **State/Data:** Context API + Supabase Client
*   **Hardware Integration:** Web Bluetooth API & Zebra Browser Print

### Backend (API)
*   **Framework:** ASP.NET Core 8 Web API
*   **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API)
*   **Language:** C# 12
*   **Database ORM:** Entity Framework Core
*   **Validation:** FluentValidation
*   **Mapping:** AutoMapper
*   **Logging:** Serilog

### Infrastructure & DevOps
*   **Database:** PostgreSQL (via Supabase)
*   **Cloud Provider:** Google Cloud Platform (GCP)
*   **Compute:** Google Cloud Run (Serverless Containers)
*   **CI/CD:** GitHub Actions
*   **Containerization:** Docker (Multi-stage builds)

---

## ✨ Key Features

*   **📊 Order Management:** Real-time dashboard for viewing pending, processing, and shipped orders.
*   **🏷️ Label Printing:**
    *   **Zebra Integration:** Direct ZPL printing via Local Network (Browser Print Agent) or Bluetooth.
    *   **Sendify Integration:** API integration for generating shipping labels.
*   **📦 Inventory Control:** Product management with stats, soft-delete functionality, and active/trash views.
*   **🆘 Support System:** Integrated ticketing system to manage customer inquiries linked to specific orders.
*   **🔒 Security:** Secure authentication via Supabase Auth and JWT-secured backend endpoints.
*   **🛡️ Reliability:** Implemented "Safety Breaker" hooks to prevent API rate-limiting on the frontend.
*   **🌙 Dark Mode:** Fully responsive UI with toggleable dark/light themes.

---

## 📂 Project Structure

```bash
├── backend/                  # .NET 8 Web API
│   ├── src/
│   │   ├── API/              # Controllers & Entry point
│   │   ├── Application/      # Business Logic, DTOs, Validators
│   │   ├── Domain/           # Enterprise Entities & Interfaces
│   │   └── Infrastructure/   # EF Core, Repositories, Ext. Services
│   ├── Dockerfile            # Multi-stage Docker build
│   └── deploy.sh             # Manual deployment script
├── components/               # React UI Components
├── contexts/                 # React Contexts (Auth, Theme, Settings)
├── hooks/                    # Custom Hooks (Printer scanning, SafeFetch)
├── services/                 # Frontend Services (Order, Inventory, Zebra)
└── types/                    # TypeScript Type Definitions
```

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   .NET 8 SDK
*   Docker
*   A Supabase project (PostgreSQL)
*   Google Cloud CLI (for deployment)

### 1. Database Setup
Ensure your PostgreSQL database has the following tables matching the Domain entities:
*   `Users`
*   `Products`
*   `Orders`
*   `OrderItems`
*   `Categories`
*   `SupportTickets`

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Update `src/API/appsettings.json` with your database connection string:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=your-db-host;Database=postgres;Username=postgres;Password=your-pass;..."
}
```

Run the API:
```bash
dotnet run --project src/API
```
The API will start on port `8080` (or as configured).

### 3. Frontend Setup
Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

**Note:** On the first launch, click the **Settings (Gear)** icon in the UI to input your Supabase URL and Anon Key. These are stored in `localStorage` for the client.

---

## ☁️ Deployment (Google Cloud Run)

### Automated (GitHub Actions)
The project includes a CI/CD pipeline in `.github/workflows/deploy.yml`.
1.  Push code to `main`.
2.  Ensure GitHub Secrets are set:
    *   `GCP_PROJECT_ID`
    *   `GCP_CREDENTIALS` (JSON Service Account Key)

### Manual Deployment
Use the provided shell script to build and deploy directly from your machine:

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```
*You will be prompted to enter the Production DB Connection String securely.*

---

## 🖨️ Printer Setup

### LAN/USB Printing
1.  Install the **Zebra Browser Print** agent on the client machine.
2.  Ensure the agent is running and SSL is accepted (if applicable).
3.  In the app settings, click **Scan Local Network**.

### Bluetooth Printing
1.  Open the app in a Bluetooth-capable browser (Chrome/Edge).
2.  Click **Scan Bluetooth**.
3.  Select your printer from the browser's pairing dialog.

---
.
## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
