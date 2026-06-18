export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  PATIENT: "patient",
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const APPOINTMENT_TYPE = {
  VISIT: "visit",
  FOLLOW_UP: "follow-up",
} as const;

export const PAYMENT_STATUS = {
  PAID: "paid",
  DUE: "due",
} as const;

export const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  ONLINE: "online",
  INSURANCE: "insurance",
} as const;

export const DOCTOR_STATUS = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
} as const;

export const QUEUE_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
} as const;

export const DAYS = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const NAV_LINKS = {
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/reports", label: "Reports" },
  ],
  doctor: [
    { href: "/doctor", label: "Dashboard" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/queue", label: "Queue" },
  ],
  receptionist: [
    { href: "/receptionist", label: "Dashboard" },
    { href: "/receptionist/appointments", label: "Appointments" },
    { href: "/receptionist/payments", label: "Payments" },
    { href: "/receptionist/queue", label: "Queue" },
  ],
  patient: [
    { href: "/patient", label: "Dashboard" },
    { href: "/patient/appointments", label: "Appointments" },
    { href: "/patient/payments", label: "Payments" },
  ],
} as const;
