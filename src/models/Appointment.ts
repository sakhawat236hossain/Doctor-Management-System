import mongoose, { Schema, Model, Types } from "mongoose";
import type { IAppointment } from "@/types";

export interface IAppointmentDocument
  extends Omit<IAppointment, "_id" | "doctorId" | "patientId" | "bookedBy">,
    mongoose.Document {
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  bookedBy: Types.ObjectId;
}

interface IAppointmentModel extends Model<IAppointmentDocument> {
  getNextSerial(doctorId: string | Types.ObjectId, date: Date): Promise<number>;
}

const AppointmentSchema = new Schema<IAppointmentDocument, IAppointmentModel>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentDate: { type: Date, required: true },
    serialNumber: { type: Number, required: true },
    timeSlot: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["new", "follow-up"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "serving", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

AppointmentSchema.statics.getNextSerial = async function (
  doctorId: string | Types.ObjectId,
  date: Date
): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const lastAppointment = await this.findOne({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ serialNumber: -1 })
    .select("serialNumber")
    .lean();

  return lastAppointment ? lastAppointment.serialNumber + 1 : 1;
};

export const AppointmentModel: IAppointmentModel =
  (mongoose.models.Appointment as IAppointmentModel) ||
  mongoose.model<IAppointmentDocument, IAppointmentModel>(
    "Appointment",
    AppointmentSchema
  );

export type { IAppointment };
export default AppointmentModel;
