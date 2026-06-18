export type UserRole = "admin" | "doctor" | "receptionist" | "patient";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  password?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DayOfWeek = "Sat" | "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface IScheduleSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  maxPatients: number;
}

export interface IDoctor {
  _id?: string;
  userId: string;
  speciality: string;
  degree: string[];
  bio: string;
  profileImage: string;
  visitFee: number;
  followUpFee: number;
  chamberAddress: string;
  chamberPhone: string;
  schedule: IScheduleSlot[];
  offDays: Date[];
  status: "available" | "unavailable" | "on-leave";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPatient {
  _id?: string;
  userId: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  address: string;
  emergencyContact: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAppointment {
  _id?: string;
  doctorId: string;
  patientId: string;
  bookedBy: string;
  appointmentDate: Date;
  serialNumber: number;
  timeSlot: string;
  type: "new" | "follow-up";
  status: "pending" | "confirmed" | "serving" | "completed" | "cancelled" | "no-show";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayment {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  status: "paid" | "due" | "refunded";
  method: "cash" | "bkash" | "nagad" | "rocket" | "card";
  paidAt?: Date;
  collectedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IQueue {
  _id?: string;
  doctorId: string;
  date: Date;
  currentSerial: number;
  totalBooked: number;
  status: "open" | "paused" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingPayments: number;
}
