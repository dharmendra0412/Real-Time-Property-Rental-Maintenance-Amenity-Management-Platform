# Real-Time Property Rental, Maintenance & Amenity Management Platform

A centralized, production-grade digital platform designed for property owners, tenants, and facilities staff. Built with **React 19**, **Tailwind CSS**, **Node.js (Express)**, **Socket.io**, and **100% Pure PostgreSQL (Neon Cloud)**.

## 🚀 Key Features

### 1. Real-Time Maintenance Management
- **Ticket Lifecycle**: Full state transitions (`PENDING` ➔ `IN_PROGRESS` ➔ `COMPLETED` ➔ `CLOSED`).
- **Urgency & Categorization**: `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` with `PLUMBING`, `ELECTRICAL`, `HVAC`, etc.
- **Photo Attachments**: Disk storage upload support for visual issue reporting.
- **Technician Assignment**: Owner/Admin assigns registered facilities staff.
- **Tenant CSAT Rating**: Post-completion 1-5 star ratings with feedback.
- **Real-Time Sync**: WebSockets broadcast updates instantly across all connected screens without page refreshes.

### 2. Amenity Slot Management & Booking
- **Availability Engine**: Dynamic slot calculation based on opening/closing hours and duration.
- **ACID Double-Booking Prevention**: Database-level atomic transactions prevent concurrent reservation conflicts (returns HTTP 409 Conflict).
- **Check-In & Check-Out Tracking**: Live session management (`CONFIRMED` ➔ `CHECKED_IN` ➔ `COMPLETED`).
- **Immediate Slot Release**: Instant slot reallocation upon cancellation.

### 3. Operational Dashboards & Analytics
- **Live KPIs**: Mean Time to Resolution (MTTR in hours), Completion Rate %, and Customer Satisfaction (CSAT).
- **Amenity Metrics**: Popular amenities ranking and active bookings today.
- **Audit Activity Feed**: Chronological log of ticket transitions and reservations.
- **Real-time Latency**: Live server query response time in milliseconds.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Lucide React, Socket.io-client, Vite |
| **Backend** | Node.js (v22), Express.js (v5), Socket.io |
| **Database** | PostgreSQL (Neon Cloud Serverless) with `pg` Pool |
| **Auth & Security** | Bcrypt password hashing (10 salt rounds), signed JWT tokens, SQL parameterization |
| **Deployment** | Vercel Serverless Ready (`vercel.json`, `api/index.js`) |

---

## ⚙️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dharmendra0412/Real-Time-Property-Rental-Maintenance-Amenity-Management-Platform.git
   cd Real-Time-Property-Rental-Maintenance-Amenity-Management-Platform
   ```

2. **Install root & client dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Neon PostgreSQL connection string:
   ```env
   PORT=5000
   JWT_SECRET=super_secure_property_management_jwt_secret_2026
   DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```

4. **Build Frontend & Start Server:**
   ```bash
   npm run build
   npm start
   ```
   Access the app at: `http://localhost:5000`

5. **Run Automated Tests:**
   ```bash
   npm test
   ```

---

## 🌐 Deploy to Vercel

1. Import this repository in [Vercel](https://vercel.com/new).
2. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: Any random secure secret key.
3. Click **Deploy**. Vercel will automatically compile the React app and deploy the backend API via serverless functions.

