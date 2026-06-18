import mongoose, { Schema, Model, Types } from "mongoose";
import type { IPayment } from "@/types";

export interface IPaymentDocument
  extends Omit<IPayment, "_id" | "appointmentId" | "patientId" | "doctorId" | "collectedBy">,
    mongoose.Document {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  collectedBy: Types.ObjectId;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["paid", "due", "refunded"],
      default: "due",
    },
    method: {
      type: String,
      enum: ["cash", "bkash", "nagad", "rocket", "card"],
      required: true,
    },
    paidAt: { type: Date },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

PaymentSchema.index({ doctorId: 1, status: 1 });

export const PaymentModel: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export type { IPayment };
export default PaymentModel;
