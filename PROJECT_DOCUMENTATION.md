# Digital Evidence Locker - Project Documentation

This document provides a comprehensive, deep-dive technical overview of the Digital Evidence Locker system. It outlines the architecture, the technology stack, the exact libraries used, and a file-by-file breakdown of how the codebase is structured.

---

## 1. System Architecture Overview

The system is a decoupled **Full-Stack Web Application** consisting of:
1. **Frontend (Client):** A modern Single Page Application (SPA) built with React and Next.js. It handles routing, state, and user interfaces.
2. **Backend (API):** A RESTful Node.js/Express server that acts as the bridge between the database and the frontend. It enforces business logic, role-based access control (RBAC), and cryptography.
3. **Database:** A PostgreSQL relational database that serves as the persistent, immutable ledger for all evidence, users, and custody logs.

---

## 2. Tools, Technologies & Libraries

### Frontend Tech Stack
* **Next.js (App Router):** The React framework used for structure and routing (`/app`).
* **React:** The core library for building UI components (`useState`, `useEffect`).
* **Tailwind CSS:** A utility-first CSS framework used for all styling. It allows us to build the white, government-tech UI without writing custom `.css` classes.
* **Axios:** Used in `src/lib/api.ts` to make HTTP requests to the backend. It automatically attaches JWT tokens via interceptors.
* **Html5-Qrcode:** The library used in `QRScanner.tsx` to tap into the device webcam and decode physical QR codes.

### Backend Tech Stack
* **Node.js & Express.js:** The core runtime and web framework used to build the REST API.
* **PostgreSQL (via `pg`):** The relational database. The `pg` library is used to execute raw SQL queries. We do *not* use an ORM (like Prisma or Sequelize); we wrote raw SQL to maintain strict control over performance and database triggers.
* **bcryptjs:** Used for cryptographic password hashing (with 12 salt rounds) so plain-text passwords are never stored.
* **jsonwebtoken (JWT):** Used for stateless authentication. When a user logs in, they receive a JWT encoding their ID and Role, which is passed in the `Authorization` header of every request.
* **crypto:** Node's built-in cryptography library, heavily used in `blockchainService.js` to generate SHA-256 hashes for the custody chain.
* **qrcode:** Used in `qrUtil.js` to generate visual QR code images (as Base64 strings) when new evidence is registered.
* **multer:** A middleware used to handle `multipart/form-data`. It intercepts file uploads (photos, PDFs) from the frontend and saves them temporarily to the disk.
* **cloudinary:** A cloud storage provider. Evidence photos are uploaded here for permanent, secure external hosting to keep our database lightweight.

---

## 3. Database Schema & Security

The system uses PostgreSQL with the following core tables:
* **users:** Stores `name`, `email`, `password_hash`, and `role` (Admin, Officer, Custodian, Forensic Technician).
* **crimes:** Stores folders for investigations.
* **evidence:** Belongs to a crime. Stores `title`, `description`, `location_found`, and the generated `qr_code`.
* **evidence_photos:** Links Cloudinary image URLs to specific evidence.
* **forensic_reports:** Links uploaded PDF/Doc reports to specific evidence.
* **custody_logs:** **The Blockchain Ledger.** Stores `evidence_id`, `from_user`, `to_user`, `timestamp`, `previous_hash`, `current_hash`, and `block_index`.

**Anti-Tampering Engine:**
Inside PostgreSQL, we created a strict `TRIGGER` function (`prevent_update_delete`). This tells the database kernel itself to reject *any* `UPDATE` or `DELETE` SQL commands executed against the `custody_logs` table. Even if the backend is compromised, logs cannot be erased.

---

## 4. Backend File-by-File Breakdown

### Core Setup
* **`server.js`:** The entry point. Loads `.env` variables, tests the database connection, and starts listening on port 5000.
* **`app.js`:** Sets up Express middleware. Configures CORS, parses JSON, serves the static `/uploads` directory for forensic reports, and mounts all API routers.
* **`config/db.js`:** Establishes the PostgreSQL connection pool. **Crucial Fix:** Contains a custom Type Parser (`types.setTypeParser`) to force PostgreSQL to read timestamps as UTC. Without this, timezones shifted hashes by 5.5 hours.

### Routers (`/routes`)
Map HTTP endpoints to specific controller functions and apply middleware.
* **`authRoutes.js`:** `/login`, `/register`, `/users`
* **`crimeRoutes.js`:** Endpoints to create and list Crime folders.
* **`evidenceRoutes.js`:** Registering evidence and uploading photos.
* **`custodyRoutes.js`:** `/initiate` and `/accept` routes.
* **`forensicRoutes.js`:** Uploading and retrieving PDF forensic reports.
* **`auditRoutes.js`:** Endpoint that runs the entire blockchain verification process for all evidence.

### Middleware (`/middleware`)
* **`authMiddleware.js`:** Intercepts requests, reads the JWT from the header, verifies it using `process.env.JWT_SECRET`, and attaches the decoded user to `req.user`.
* **`roleMiddleware.js`:** `authorize('Officer', 'Admin')` — checks `req.user.role` and blocks unauthorized users with a `403 Forbidden`.

### Controllers (`/controllers`)
The "brains" of the routes. They extract data from `req.body`, call Services or Models, and return `res.json()`.
* **`authController.js`:** Hashes passwords and issues JWTs.
* **`custodyController.js`:** Extremely important. In `acceptTransfer`, it first calls `BlockchainService.verifyChain()`. If the chain is corrupt, it immediately blocks the transfer.
* **`evidenceController.js`:** Runs `verifyChain` on every piece of evidence before sending it to the frontend, attaching a dynamic `isCorrupted` boolean flag so the frontend can lock the UI.
* **`forensicController.js`:** Handles saving the local path of uploaded files and building proper HTTP URLs for them.

### Services (`/services`)
* **`blockchainService.js`:** The heart of the integrity system.
  * `Block` class: Defines `index`, `timestamp`, `data`, `previousHash`, and `hash`.
  * `addBlock()`: Formats the block, runs `JSON.stringify` on the data, and computes a SHA-256 hash. **Crucial Fix:** Uses `parseInt()` on IDs because `JSON.stringify({"id": "3"})` produces a completely different hash than `JSON.stringify({"id": 3})`.
  * `verifyChain()`: Reads all logs for an evidence item, rebuilds every block in memory using the stored data, re-hashes it, and compares it to the stored `current_hash`. It also checks if `previous_hash` physically links to the preceding block.

### Models (`/models`)
Data Access Layer. All raw SQL queries live here.
* **`userModel.js`, `crimeModel.js`, `evidenceModel.js`, `custodyLogModel.js`**: Each executes parameterized queries (`$1, $2`) to prevent SQL Injection attacks.

---

## 5. Frontend File-by-File Breakdown

### Configuration & Utilities
* **`src/lib/api.ts`:** An Axios instance configured with an interceptor. Whenever the app makes a request (`api.get('/crimes')`), this file automatically attaches `Bearer <token>` from `localStorage` to the request headers.

### Layout & Global Components
* **`src/app/layout.tsx`:** The root HTML wrapper. Imports global styles.
* **`src/app/globals.css`:** Contains Tailwind directives and custom component styles (`.btn-primary`, `.card`, `.badge`, `.input-field`).
* **`src/components/Sidebar.tsx`:** Reads the user's role from `localStorage` and dynamically renders the navigation links (e.g., hiding "Custody Transfer" from Admins).
* **`src/components/QRScanner.tsx`:** Uses the `html5-qrcode` library to render a live camera feed and parse QR payloads.

### Pages (`src/app/`)
* **`login/page.tsx`:** Form that posts to `/auth/login` and saves the resulting JWT and user object to `localStorage`.
* **`dashboard/page.tsx`:** Fetches statistics and displays the "Recent Crimes" table.
* **`crimes/register/page.tsx`:** Form to create a new investigation folder.
* **`crimes/[id]/page.tsx`:** The Crime Folder view. Fetches all evidence linked to this crime. Reads the `isCorrupted` boolean sent by the backend. If true, it visually replaces the "Open" badge with a red "⚠ CORRUPTED" badge and replaces the "View Details" link with a locked button.
* **`evidence/register/page.tsx`:** Complex form that registers evidence, generates the QR code via the backend, and handles the `multipart/form-data` upload for the initial evidence photograph.
* **`evidence/[id]/page.tsx`:** The Evidence Detail page. Displays the QR code, the photo grid, the uploaded Forensic Reports (and an upload form if the user is a Tech), and a formal table of the block-by-block Custody Chain history (if the user is an Admin).
* **`custody/page.tsx`:** The handshake UI. Contains the dropdown to "Initiate Transfer" (hidden from Forensic Techs) and the "Scan QR to Accept" modal.
* **`audit/page.tsx`:** The Integrity Audit dashboard. Pings the backend to run a full blockchain verification sweep across the entire system. Renders green "CHAIN INTACT" or red "TAMPER DETECTED" badges.

---

## 6. How the "Tamper" Attack Works

The script `backend/simulate_tamper.js` bypasses the application logic and connects directly to the PostgreSQL database.
1. It executes `ALTER TABLE custody_logs DISABLE TRIGGER ALL;` to temporarily bypass our anti-tampering lock.
2. It randomly picks a block in the middle of a custody chain and runs a direct SQL `UPDATE` to change the `to_user` value.
3. It re-enables the triggers.

Because the `to_user` data was changed inside the database without recomputing the SHA-256 hash, the stored `current_hash` no longer matches the data. 

When the user opens the frontend:
1. The frontend hits `/api/evidence/all`.
2. The backend runs `BlockchainService.verifyChain()`.
3. The backend reconstructs the block, re-hashes it, and realizes the hash doesn't match the database string.
4. The backend returns `{ isCorrupted: true }`.
5. The frontend reads this flag, turns the UI red, and locks out the "View Details" button.
6. If a user maliciously tries to bypass the UI and hit the transfer API directly, `custodyController.acceptTransfer` intercepts it, runs `verifyChain`, and returns a hard `403 Forbidden` firewall block.
