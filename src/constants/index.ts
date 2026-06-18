export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  PATIENT: "patient",
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SERVING: "serving",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
} as const;

export const APPOINTMENT_TYPE = {
  NEW: "new",
  FOLLOW_UP: "follow-up",
} as const;

export const PAYMENT_STATUS = {
  PAID: "paid",
  DUE: "due",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_METHOD = {
  CASH: "cash",
  BKASH: "bkash",
  NAGAD: "nagad",
  ROCKET: "rocket",
  CARD: "card",
} as const;

export const DOCTOR_STATUS = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  ON_LEAVE: "on-leave",
} as const;

export const QUEUE_STATUS = {
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed",
} as const;

export const DAYS = {
  SAT: "Sat",
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
} as const;

export const BLOOD_GROUPS = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
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
    { href: "/doctor/patients", label: "আজকের রোগী" },
    { href: "/doctor/schedule", label: "আমার সময়সূচী" },
    { href: "/doctor/income", label: "আয়ের হিসাব" },
    { href: "/doctor/profile", label: "প্রোফাইল" },
  ],
  receptionist: [
    { href: "/receptionist", label: "Dashboard" },
    { href: "/receptionist", label: "সিরিয়াল বুক করুন" },
    { href: "/receptionist/queue", label: "Queue Manager" },
    { href: "/receptionist/patients", label: "রোগী খুঁজুন" },
    { href: "/receptionist/reports", label: "আজকের রিপোর্ট" },
  ],
  patient: [
    { href: "/patient", label: "Dashboard" },
    { href: "/patient/appointments", label: "আমার অ্যাপয়েন্টমেন্ট" },
    { href: "/patient/doctors", label: "ডাক্তার খুঁজুন" },
    { href: "/patient/profile", label: "আমার প্রোফাইল" },
  ],
} as const;
