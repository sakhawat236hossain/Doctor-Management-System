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
