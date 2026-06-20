# 🏥 MediFlow

**A comprehensive clinic & doctor management system — appointment booking, real-time serial queue, income analytics, and role-based dashboards.**

![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

---

## 🎯 Overview

MediFlow is a full-stack **Doctor Management System** designed for clinics and small hospitals. It provides dedicated dashboards for four user roles — **Admin**, **Doctor**, **Receptionist**, and **Patient** — enabling online and in-person appointment booking, a real-time serial/queue system, doctor schedule management, and comprehensive income analytics. The system supports **Bangla (Bengali) and English** with full localization, and features **dark/light mode** out of the box.

---

## ✨ Features

### 👨‍💼 Admin

- **Overview Dashboard** — stat cards (total doctors, patients, appointments, income), monthly income bar chart, active doctors table, recent appointments
- **Doctor Management** — full CRUD with a 3-step "Add Doctor" modal (account info → profile & speciality → weekly schedule), activate/deactivate toggle
- **Receptionist Management** — add, view, activate/deactivate receptionist accounts
- **Appointment Management** — view all appointments across doctors with filters (doctor, date, status, type) and detail modal
- **Income Reports** — clinic-wide analytics with pie chart (income by doctor), daily bar chart, doctor-wise breakdown table, PDF and CSV export
- **User Management** — list all users (any signup method), search/filter (role, status, provider, sort), pagination, view details drawer, edit info, admin-initiated password reset, change role (with Doctor/Patient document creation), activate/deactivate, delete with cascade — includes safeguards (self-lockout protection, last-admin protection)

### 🩺 Doctor

- **Dashboard** — today's stats (patients, completed, remaining, income), currently serving card with "Next Patient" action, patient list with real-time updates via Socket.io
- **Today's Patients** — filter tabs (all / waiting / serving / completed / no-show), status actions (serve, complete, no-show), real-time socket listeners
- **Schedule Management** — weekly schedule editor (day toggle, start/end time, max patients), off-days calendar with date picker, visit fee & follow-up fee settings, chamber address & phone
- **Income Reports** — date range selector (today / week / month / year / custom), summary stat cards, bar chart (income + collected), line chart (patient trends), breakdown table, CSV export
- **Profile** — quick links to schedule and fee settings
- **IN/OUT Toggle** — doctor availability status toggle built into the layout header with confirmation dialog

### 💁 Receptionist

- **Dashboard** — today's stats (bookings, serving, completed, collection) + integrated Quick Book form
- **Quick Book** — phone-number patient search → select existing or create new patient → choose doctor → visit type → date → confirm → shows serial number + printable token
- **Queue Manager** — doctor tab selector, doctor IN/OUT toggle, queue controls (open / next patient / pause / resume / close), live patient table with mark-served / no-show / cancel actions, all real-time via Socket.io
- **Patient Search** — search patients by name or phone with debounce, view appointment history
- **Print Token** — thermal-printer-friendly (80mm) appointment token with serial number, doctor info, and date

### 🧑‍🤝‍🧑 Patient

- **Dashboard** — welcome message, upcoming appointment card, live queue position widget (if today's appointment), quick links
- **Online Booking** — 3-step flow: pick date (calendar with disabled past dates and off-days, real-time slot availability) → fill details (type, phone, notes, payment method) → confirmation with assigned serial number
- **My Appointments** — tabs (upcoming / past / cancelled), cancel with confirmation, "book again" for completed appointments, appointment detail page with live queue position
- **Profile** — edit personal info (name, phone, date of birth, gender, blood group, address, emergency contact), change password

### 🌐 General

- **Bilingual** — full Bangla (Bengali) and English localization with language switcher, persisted to localStorage
- **Dark / Light Mode** — theme toggle via `next-themes`, persisted across sessions
- **Real-Time Updates** — Socket.io for live queue position, doctor status changes, and queue updates
- **Social Login** — Google and Facebook OAuth alongside email/password credentials
- **Role-Based Access** — middleware-level route protection for all role-prefixed paths, client-side `RoleGuard` for conditional UI, server-side `requireRole` helper for API routes
- **Public Pages** — landing page with hero, animated stats, how-it-works, featured doctors, testimonials, footer; searchable doctor directory with filters (speciality, available today, fee range); public doctor detail page
- **Notifications** — real-time notification bell with unread count badge, mark-as-read, socket-powered push updates
- **SMS Integration** — SSL Wireless API for Bangladesh, dev-mode console fallback, Bengali SMS templates
- **Rate Limiting** — in-memory rate limiting on sensitive POST endpoints (registration, booking)
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy
- **PDF Export** — admin income reports exportable as PDF via jsPDF
- **CSV Export** — doctor and admin income reports exportable as CSV
- **Responsive** — mobile-friendly layouts with bottom navigation for patients on small screens

---

## 🛠️ Tech Stack

| Category           | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Framework**      | Next.js 14.2 (App Router)                       |
| **Language**       | TypeScript 5.7 (strict mode)                    |
| **UI**             | Tailwind CSS 3.4, Shadcn/UI, Lucide Icons       |
| **Frontend State** | TanStack Query v5, React Hook Form + Zod        |
| **Charts**         | Recharts (Bar, Line, Pie)                       |
| **Auth**           | NextAuth.js v5 (beta) — Credentials + Google + Facebook |
| **Database**       | MongoDB + Mongoose 8                             |
| **Real-time**      | Socket.io (custom server) + socket.io-client    |
| **Validation**     | Zod                                              |
| **PDF**            | jsPDF                                            |
| **Date**           | date-fns, react-day-picker                      |
| **Notifications**  | Sonner (toast)                                   |
| **Theming**        | next-themes                                      |
| **Image Upload**   | Cloudinary (optional)                            |
| **SMS**            | SSL Wireless API (Bangladesh)                    |
| **Custom Server**  | Node.js HTTP + Socket.io (via `tsx`)             |

---

## 📁 Project Structure

```
mediflow/
├── server.ts                        # Custom Node.js server with Socket.io
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx       # Email + Google/Facebook login
│   │   │   └── register/page.tsx    # Patient self-registration
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Shared dashboard (Navbar + Sidebar)
│   │   │   ├── admin/               # Admin role pages
│   │   │   │   ├── page.tsx         #   Overview dashboard
│   │   │   │   ├── appointments/    #   All appointments
│   │   │   │   ├── doctors/         #   Doctor CRUD
│   │   │   │   ├── income/          #   Income reports
│   │   │   │   ├── receptionists/   #   Receptionist CRUD
│   │   │   │   └── users/           #   Full user management
│   │   │   ├── doctor/              # Doctor role pages
│   │   │   │   ├── page.tsx         #   Dashboard + queue
│   │   │   │   ├── patients/        #   Today's patients
│   │   │   │   ├── schedule/        #   Weekly schedule & fees
│   │   │   │   ├── income/          #   Income analytics
│   │   │   │   └── profile/         #   Profile settings
│   │   │   ├── receptionist/        # Receptionist role pages
│   │   │   │   ├── page.tsx         #   Dashboard + quick book
│   │   │   │   ├── queue/           #   Live queue manager
│   │   │   │   └── patients/        #   Patient search
│   │   │   └── patient/             # Patient role pages
│   │   │       ├── page.tsx         #   Welcome + upcoming
│   │   │       ├── appointments/    #   List + detail + live queue
│   │   │       └── profile/         #   Edit info + password
│   │   ├── api/
│   │   │   ├── auth/                # NextAuth + register
│   │   │   ├── appointments/        # Booking, availability, cancel
│   │   │   ├── doctors/             # Public list + detail + status + settings
│   │   │   ├── patients/            # Patient search
│   │   │   ├── payments/            # Payment operations
│   │   │   ├── queue/               # Queue CRUD + socket events
│   │   │   ├── profile/             # User profile + password change
│   │   │   ├── notifications/       # Notification CRUD + mark read
│   │   │   ├── reports/             # Doctor & admin report aggregations
│   │   │   ├── admin/               # Admin-only endpoints
│   │   │   │   ├── doctors/         #   Doctor CRUD (aggregation pipeline)
│   │   │   │   ├── receptionists/   #   Receptionist CRUD
│   │   │   │   ├── appointments/    #   Appointment listing
│   │   │   │   ├── overview/        #   Dashboard stats
│   │   │   │   └── users/           #   User management + role/status/reset-password
│   │   │   ├── health/              # Health check endpoint
│   │   │   └── register/            # Public registration
│   │   ├── doctors/                 # Public doctor pages
│   │   │   ├── page.tsx             #   Doctor directory + search
│   │   │   └── [doctorId]/          #   Doctor detail + booking
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout (fonts, providers, toaster)
│   │   └── globals.css              # Tailwind + CSS variables (light/dark)
│   ├── components/
│   │   ├── ui/                      # Shadcn/UI primitives (button, card, dialog, etc.)
│   │   ├── shared/                  # Navbar, Sidebar, RoleGuard, DoctorCard, NotificationBell, etc.
│   │   ├── admin/                   # Admin-specific components (dialogs, charts)
│   │   ├── doctor/                  # Doctor-specific components
│   │   ├── patient/                 # BookingSteps, LiveQueueWidget
│   │   ├── receptionist/            # QuickBookForm, PrintToken
│   │   └── providers.tsx            # QueryClient + Session + Theme providers
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth v5 config (Credentials + Google + Facebook)
│   │   ├── auth.config.ts           # Auth config (shared with middleware)
│   │   ├── db.ts                    # Mongoose connection (cached for hot-reload)
│   │   ├── socket.ts                # Socket.io client singleton + server emitter
│   │   ├── i18n.tsx                 # Custom i18n context (bn/en)
│   │   ├── requireRole.ts           # Server-side role guard helper
│   │   ├── utils.ts                 # cn(), formatDate, formatCurrency, etc.
│   │   ├── cloudinary.ts            # Cloudinary upload helpers
│   │   └── sms.ts                   # SMS service (SSL Wireless)
│   ├── models/
│   │   ├── User.ts                  # User schema (roles, authProviders)
│   │   ├── Doctor.ts                # Doctor schema (schedule, fees, offDays)
│   │   ├── Patient.ts               # Patient schema (DOB, gender, blood group)
│   │   ├── Appointment.ts           # Appointment schema (getNextSerial static)
│   │   ├── Payment.ts               # Payment schema (amount, status, method)
│   │   ├── Queue.ts                 # Queue schema (compound unique index)
│   │   └── Notification.ts          # Notification schema
│   ├── hooks/
│   │   └── useAuth.ts               # Auth session hook
│   ├── types/
│   │   ├── index.ts                 # Shared interfaces + type exports
│   │   └── next-auth.d.ts           # NextAuth type augmentation
│   ├── constants/
│   │   └── index.ts                 # Enums (roles, statuses, days, nav links)
│   ├── locales/
│   │   ├── bn.json                  # Bangla translations
│   │   └── en.json                  # English translations
│   └── middleware.ts                 # Route protection + rate limiting
├── .env.example                     # Environment variable template
├── next.config.js                   # Next.js config (images, security headers)
├── tailwind.config.ts               # Tailwind config (dark mode, theme)
├── tsconfig.json                    # TypeScript config (strict, path aliases)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.17 (required by Next.js 14)
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/mediflow.git
   cd mediflow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   # NextAuth
   AUTH_SECRET=your-secret-key-here        # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=

   # Facebook OAuth (optional)
   FACEBOOK_CLIENT_ID=
   FACEBOOK_CLIENT_SECRET=

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/mediflow

   # Socket.io
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

   # Cloudinary (optional — for image uploads)
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   # SMS — SSL Wireless (optional — Bangladesh only)
   SMS_API_KEY=
   SMS_SENDER_ID=
   ```

4. **Run the development server**

   **Option A — Standard Next.js dev server** (Socket.io real-time features will not work without the custom server):

   ```bash
   npm run dev
   ```

   **Option B — Custom server with Socket.io** (recommended for full functionality):

   ```bash
   npm run start:prod
   ```

   This starts the Next.js app with the Socket.io server attached via `server.ts`.

5. **Open** [http://localhost:3000](http://localhost:3000)

### Creating the First Admin

After the initial setup, register a patient account at `/register`, then manually update the role in MongoDB:

```bash
# Connect to MongoDB and run:
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

From there, use the admin dashboard to create doctor and receptionist accounts.

---

## 📜 Available Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start Next.js dev server (standard, no Socket.io) |
| `npm run build`     | Create optimized production build                |
| `npm run start`     | Start production server (after build)            |
| `npm run start:prod`| Start custom server with Socket.io (`tsx server.ts`) |
| `npm run lint`      | Run ESLint                                       |

---

## 🔐 Authentication

MediFlow supports three authentication methods:

| Method     | Provider   | Notes                                      |
| ---------- | ---------- | ------------------------------------------ |
| Email/Password | Credentials | Used by all roles; bcrypt hashed (12 rounds) |
| Google     | OAuth 2.0  | Creates/logs in as **patient** role only   |
| Facebook   | OAuth 2.0  | Creates/logs in as **patient** role only   |

- Social login accounts are **automatically linked** to existing credentials accounts by email
- **Deactivated users** cannot log in via any method
- After login, users are redirected to the home page `/` — not directly to their dashboard

---

## 🗄️ Database Models

| Model          | Key Fields                                                              |
| -------------- | ----------------------------------------------------------------------- |
| **User**       | name, email, password, role, phone, isActive, authProviders[]           |
| **Doctor**     | userId → User, speciality, degree[], bio, visitFee, followUpFee, schedule[], offDays[], status |
| **Patient**    | userId → User, dateOfBirth, gender, bloodGroup, address, emergencyContact |
| **Appointment**| doctorId → Doctor, patientId → Patient, bookedBy, appointmentDate, serialNumber, type, status |
| **Payment**    | appointmentId → Appointment, amount, status, method, paidAt, collectedBy |
| **Queue**      | doctorId → Doctor, date, currentSerial, totalBooked, status (unique: doctorId + date) |
| **Notification**| userId → User, title, message, type, isRead, link                      |

---

## 🌍 Localization

MediFlow includes full bilingual support:

- **Bangla (Bengali)** — default language
- **English** — full translation

Translation files: `src/locales/bn.json` and `src/locales/en.json` (446 lines each).

Language preference is stored in `localStorage` and persists across sessions. The custom i18n system (`src/lib/i18n.tsx`) provides:
- `useT()` hook for translation keys (e.g., `t("appointment.bookNow")`)
- Parameter interpolation (e.g., `t("patient.welcome", { name: "John" })`)
- Automatic fallback to the other language if a key is missing

---

## 📡 Real-Time Features

Powered by **Socket.io** with a custom Node.js server:

| Event                | Direction                | Description                          |
| -------------------- | ------------------------ | ------------------------------------ |
| `queue:updated`      | Receptionist → Patients  | Live queue position updates          |
| `doctor:status`      | Doctor → All             | Doctor IN/OUT status changes         |
| `notification:new`   | Server → User            | Real-time notification push          |
| `join:user`          | Client → Server          | Join user-specific room              |
| `join:doctor`        | Client → Server          | Join doctor room for queue updates   |

---

## 🛡️ Security

- **Route Protection** — middleware checks every nested route under role prefixes
- **API Role Checks** — `requireRole()` helper on all protected API routes returns 403 on mismatch
- **Client Guard** — `RoleGuard` component for conditional UI rendering
- **Rate Limiting** — in-memory rate limiter on registration and booking endpoints
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy
- **Password Hashing** — bcrypt with 12 salt rounds
- **Admin Safeguards** — cannot delete/demote own account; system always keeps at least 1 admin
- **Input Validation** — Zod schemas on all API request bodies

---

## 🗺️ Roadmap

The following features are planned but **not yet implemented**:

- [ ] Dedicated `/unauthorized` access-denied page
- [ ] Full doctor bio/speciality/degree editing from the doctor profile page
- [ ] Server-side role guards on all dashboard layouts (currently middleware + client-side only)
- [ ] CI/CD pipeline and automated build status badge
- [ ] Cloudinary integration for production image uploads
- [ ] Deployment configuration (Railway / Vercel)
- [ ] Comprehensive end-to-end and unit test suite
- [ ] Email notification templates

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ using <a href="https://nextjs.org">Next.js</a>, <a href="https://www.mongodb.com">MongoDB</a>, and <a href="https://ui.shadcn.com">Shadcn/UI</a>
</p>
# MediFlow — Doctor Management System

A comprehensive clinic management platform built with Next.js 14, MongoDB, Socket.io, and Tailwind CSS. Features bilingual (Bengali/English) UI, real-time queue management, role-based dashboards, and SMS integration for Bangladesh.

## Tech Stack

- **Framework:** Next.js 14.2 (App Router)
- **Language:** TypeScript 5.7
- **Database:** MongoDB + Mongoose 8.8
- **Auth:** NextAuth.js v5 (Credentials + JWT)
- **Real-time:** Socket.io 4.8
- **UI:** Tailwind CSS + Shadcn/ui + Radix primitives
- **Charts:** Recharts 2.14
- **Validation:** Zod 3.23
- **SMS:** SSL Wireless API (Bangladesh)
- **PDF:** jsPDF

## Setup

1. **Clone repo**
   ```bash
   git clone <your-repo-url>
   cd doctor-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Deploy on Railway

1. Push to GitHub
2. Create new project on [railway.app](https://railway.app) → **Deploy from GitHub**
3. Add environment variables (same as `.env.example`):
   - `AUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `NEXT_PUBLIC_SOCKET_URL` — Your Railway URL (e.g., `https://mediflow.up.railway.app`)
   - `SMS_API_KEY` — SSL Wireless API key (optional)
   - `SMS_SENDER_ID` — SSL Wireless sender ID (optional)
4. Railway will auto-detect `railway.json` and use the custom server with Socket.io
5. Deploy ✓

## Roles & Access

| Role | Access |
|------|--------|
| **Admin** | Full system access — manage doctors, receptionists, appointments, income reports |
| **Doctor** | Own dashboard, today's patients, schedule, income reports, profile |
| **Receptionist** | Book appointments, manage queue, search patients |
| **Patient** | Book appointments, view own appointments, browse doctors |

## API Routes

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers (login, session, etc.) |
| POST | `/api/register` | Register new user (patient) |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments (filtered by doctor/patient/date/status) |
| POST | `/api/appointments` | Book new appointment + create payment + update queue |
| PATCH | `/api/appointments` | Update appointment status |
| DELETE | `/api/appointments` | Cancel appointment |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors with user info (paginated, filterable) |
| GET | `/api/doctors?id=` | Get single doctor with full profile |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List/search patients |
| POST | `/api/patients` | Create patient profile |
| PATCH | `/api/patients` | Update patient profile |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List payments (filtered) |
| POST | `/api/payments` | Create payment record |
| PATCH | `/api/payments` | Update payment status |

### Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | Get queue for doctor/date |
| PATCH | `/api/queue` | Update queue (advance serial, pause/close) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get current user's notifications (last 10 + unread count) |
| POST | `/api/notifications` | Create notification |
| PATCH | `/api/notifications/[id]/read` | Mark notification as read |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | General reports (overview, appointments, revenue, doctors, users) |
| GET | `/api/reports/admin` | Admin income report (doctor-wise breakdown, CSV export) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/overview` | Dashboard overview (stats, monthly income, active doctors) |
| GET | `/api/admin/doctors` | List all doctors with today's stats |
| POST | `/api/admin/doctors` | Create doctor (User + Doctor profile atomically) |
| PATCH | `/api/admin/doctors` | Update/deactivate doctor |
| GET | `/api/admin/receptionists` | List all receptionists |
| POST | `/api/admin/receptionists` | Create receptionist user |
| PATCH | `/api/admin/receptionists` | Toggle receptionist active status |
| GET | `/api/admin/appointments` | All appointments with filters + payment data |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint (used by Railway) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (dashboard)/     # Role-based dashboards
│   │   ├── admin/       # Admin dashboard pages
│   │   ├── doctor/      # Doctor dashboard
│   │   ├── patient/     # Patient dashboard
│   │   └── receptionist/# Receptionist dashboard
│   ├── api/             # API routes (see table above)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   ├── loading.tsx      # Global loading skeleton
│   ├── error.tsx        # Error boundary
│   └── not-found.tsx    # 404 page
├── components/
│   ├── admin/           # Admin-specific components
│   ├── doctor/          # Doctor-specific components
│   ├── patient/         # Patient-specific components
│   ├── receptionist/    # Receptionist-specific components
│   ├── shared/          # Shared (Navbar, Sidebar, RoleGuard, NotificationBell)
│   └── ui/              # Shadcn/Radix UI primitives
├── constants/           # App constants (roles, nav links, etc.)
├── hooks/               # Custom hooks (useAuth)
├── lib/                 # Utilities (auth, db, socket, sms)
├── models/              # Mongoose models
└── types/               # TypeScript interfaces
```

## License

Private — All rights reserved.
