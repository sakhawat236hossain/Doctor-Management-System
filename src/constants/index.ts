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
    { href: "/admin", labelKey: "nav.overview" },
    { href: "/admin/doctors", labelKey: "nav.doctors" },
    { href: "/admin/receptionists", labelKey: "nav.receptionists" },
    { href: "/admin/appointments", labelKey: "nav.appointments" },
    { href: "/admin/income", labelKey: "nav.incomeReport" },
  ],
  doctor: [
    { href: "/doctor", labelKey: "nav.dashboard" },
    { href: "/doctor/patients", labelKey: "nav.todayPatients" },
    { href: "/doctor/schedule", labelKey: "nav.mySchedule" },
    { href: "/doctor/income", labelKey: "nav.incomeAccount" },
    { href: "/doctor/profile", labelKey: "nav.profile" },
  ],
  receptionist: [
    { href: "/receptionist", labelKey: "nav.dashboard" },
    { href: "/receptionist", labelKey: "nav.bookSerial" },
    { href: "/receptionist/queue", labelKey: "nav.queueManager" },
    { href: "/receptionist/patients", labelKey: "nav.searchPatient" },
  ],
  patient: [
    { href: "/patient", labelKey: "nav.dashboard" },
    { href: "/patient/appointments", labelKey: "nav.myAppointments" },
    { href: "/patient/doctors", labelKey: "nav.findDoctor" },
    { href: "/patient/profile", labelKey: "nav.myProfile" },
  ],
} as const;
