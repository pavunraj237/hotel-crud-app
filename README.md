# Hotel List CRUD Application 🏨

A full-stack, responsive Hotel Management Single Page Application (SPA) built with **React**, **Redux Toolkit**, **Node.js**, **Express**, and **PostgreSQL**.

---

## 🌟 Key Features

### 🖥️ Frontend (React + Redux Toolkit)
- **Single Page Application (SPA)**:
  - Public hotel catalog with live search, price distribution histogram, and dual-handle slider.
  - Separate read-only detail page (`/hotels/:id`) showing full hotel photo without cropping, accurate coordinates, and interactive map marker.
  - Separate dedicated edit page (`/hotels/:id/edit`) for authorized hotel hosts.
  - Authentication pages (`/login` and `/signup`) matching application theme.
- **Dual-Handle Price Filter & Histogram**:
  - Small price-distribution histogram dynamically populated using actual hotel price data from PostgreSQL.
  - Dual-handle range slider synchronized with minimum and maximum input fields.
  - Prices use Indian Rupees (INR); the initial filter range is ₹1,500–₹15,000 and expands for hotels outside that range.
  - Minimum price cannot exceed maximum price.
  - Debounced Redux updates prevent excessive API requests while sliding.
  - Reset button restores full bounds.
- **Card-Based Responsive View**:
  - Flexible CSS grid (`minmax(min(100%, 280px), 1fr)`) prevents mobile horizontal overflow.
  - Displays thumbnail, nightly rate badge, title, host attribution, and accurate coordinate metrics.
- **Authentication & Authorization**:
  - Secure signup with name, normalized email, password, and confirmation.
  - Passwords hashed with bcrypt; HTTP-only cookie session management (no tokens in `localStorage`).
  - Automatic session restoration on initial page load via `/api/auth/me`.
  - Edit and Delete permissions strictly restricted to the hotel's owner.
- **Interactive OpenStreetMap with Leaflet**:
  - Center pin on exact latitude and longitude with direction indicators (N/S, E/W).
- **SEO & Accessibility**:
  - Dynamic page titles and OpenGraph tags via `react-helmet-async`.
  - Accessible range slider controls usable via touch, mouse, and keyboard.
  - Informative alt text on all images.

### ⚙️ Backend (Node.js + Express + PostgreSQL)
- **Native SQL Queries**: Direct PostgreSQL connection via `pg.Pool` without an ORM. All queries use parameterized placeholders (`$1, $2, ...`) for SQL injection protection.
- **Global Price Statistics**:
  - `GET /api/hotels/price-stats`: Aggregates minimum, maximum, and 20 distribution buckets across all hotels.
- **RESTful Endpoints**:
  - `GET /api/hotels`: Paginated catalog with title search (`ILIKE`), price range filtering (`>=`, `<=`), and pagination (`LIMIT`, `OFFSET`).
  - `GET /api/hotels/:id`: Returns full details of an individual hotel.
  - `POST /api/hotels`: Requires auth. Accepts `multipart/form-data`, validates input, stores image locally in `uploads/`, and sets `user_id`.
  - `PUT /api/hotels/:id`: Requires auth & owner verification. Updates hotel details. Unlinks old image if a new one is uploaded.
  - `DELETE /api/hotels/:id`: Requires auth & owner verification. Deletes database record and unlinks image from disk.
  - `POST /api/auth/signup`: Rate-limited account registration.
  - `POST /api/auth/login`: Rate-limited login setting secure HTTP-only cookie.
  - `POST /api/auth/logout`: Clears auth cookie.
  - `GET /api/auth/me`: Verifies active JWT cookie and returns authenticated user.
- **Local File Management**: Secure storage using `multer` with file-type validation and 5MB size limit.

---

## 🗄️ Database Schema

The database uses native PostgreSQL data types with foreign keys and indexes:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotels_title ON hotels (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels (price);
CREATE INDEX IF NOT EXISTS idx_hotels_user_id ON hotels (user_id);
```

---

## ⚙️ Environment Variables

The backend configuration is stored in `backend/.env` (reference template in `backend/.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=hotel_db

# Authentication Configuration (Keep secret in production!)
JWT_SECRET=your_jwt_secret_key_change_in_production
```

> **Note**: If your local PostgreSQL instance runs on an alternative port (such as `5433`), ensure `DB_PORT` in `backend/.env` matches your port to avoid `ECONNREFUSED` connection errors.

---

## 🚀 Installation & Running

### Step 1: Install Dependencies
From the project root:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Database Setup & Migration
1. Ensure PostgreSQL is started on your computer.
2. Create the database if it doesn't already exist:
   ```sql
   CREATE DATABASE hotel_db;
   ```
3. Run the safe, non-destructive migration script:
   ```bash
   cd backend
   npm run migrate
   ```
   *This creates the `users` table, adds `user_id` to `hotels` without data loss, creates a starter demo user (`demo@example.com` / `Password123!`), and associates existing unassigned hotels.*

### Step 3: Start the Backend Server
```bash
cd backend
npm run dev
```
- API Base: `http://localhost:5000/api/hotels`
- Price Statistics: `http://localhost:5000/api/hotels/price-stats`
- Health check: `http://localhost:5000/api/health`

### Step 4: Start the Frontend App
In a separate terminal window:
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🛠️ Troubleshooting Database Connection (`ECONNREFUSED`)

If the backend reports `ECONNREFUSED`:
1. **Verify PostgreSQL is Running**:
   - On Windows: Open Services (`services.msc`) and verify that `postgresql-x64-<version>` is in the **Running** state, or run:
     ```powershell
     Start-Service -Name *postgres*
     ```
2. **Check Port Configuration**:
   - Default PostgreSQL port is `5432`. However, some installations (e.g. parallel versions or pgAdmin bundles) default to `5433`.
   - Update `DB_PORT` in `backend/.env` to match your active port.
3. **Verify Database Health**:
   - Open `http://localhost:5000/api/health` in your browser. The endpoint returns detailed diagnostics and actionable resolution steps if the database is unreachable.

---

## 📁 Key Routes & File Structure

| Route | Component | Description |
|---|---|---|
| `/` | `HotelListPage.jsx` | Card grid with search, price histogram dual slider, and pagination |
| `/hotels/:id` | `HotelDetailPage.jsx` | Full photo without cropping, accurate coordinates, and interactive map |
| `/hotels/:id/edit` | `HotelEditPage.jsx` | Dedicated edit page (protected by ownership authorization) |
| `/login` | `LoginPage.jsx` | Sign in page with demo credentials helper |
| `/signup` | `SignupPage.jsx` | Account creation page with validation |
