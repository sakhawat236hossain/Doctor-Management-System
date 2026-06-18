import mongoose, { Schema, Model, Types } from "mongoose";
import type { IPatient } from "@/types";

export interface IPatientDocument extends Omit<IPatient, "_id" | "userId">, mongoose.Document {
  userId: Types.ObjectId;
}

const PatientSchema = new Schema<IPatientDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      required: true,
      trim: true,
    },
    address: { type: String, trim: true, default: "" },
    emergencyContact: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

PatientSchema.index({ userId: 1 });

export const PatientModel: Model<IPatientDocument> =
  mongoose.models.Patient || mongoose.model<IPatientDocument>("Patient", PatientSchema);

export type { IPatient };
export default PatientModel;
