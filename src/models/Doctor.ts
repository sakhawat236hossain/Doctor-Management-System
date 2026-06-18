import mongoose, { Schema, Model, Types } from "mongoose";
import type { IDoctor, IScheduleSlot } from "@/types";

export interface IDoctorDocument extends Omit<IDoctor, "_id" | "userId">, mongoose.Document {
  userId: Types.ObjectId;
}

const ScheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    day: {
      type: String,
      enum: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxPatients: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctorDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    speciality: { type: String, required: true, trim: true },
    degree: [{ type: String, required: true, trim: true }],
    bio: { type: String, trim: true, default: "" },
    profileImage: { type: String, trim: true, default: "" },
    visitFee: { type: Number, required: true, min: 0 },
    followUpFee: { type: Number, required: true, min: 0 },
    chamberAddress: { type: String, trim: true, default: "" },
    chamberPhone: { type: String, trim: true, default: "" },
    schedule: [ScheduleSlotSchema],
    offDays: [{ type: Date }],
    status: {
      type: String,
      enum: ["available", "unavailable", "on-leave"],
      default: "available",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DoctorSchema.index({ userId: 1 });

export const DoctorModel: Model<IDoctorDocument> =
  mongoose.models.Doctor || mongoose.model<IDoctorDocument>("Doctor", DoctorSchema);

export type { IDoctor };
export default DoctorModel;
