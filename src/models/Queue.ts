import mongoose, { Schema, Model, Types } from "mongoose";
import type { IQueue } from "@/types";

export interface IQueueDocument extends Omit<IQueue, "_id" | "doctorId">, mongoose.Document {
  doctorId: Types.ObjectId;
}

const QueueSchema = new Schema<IQueueDocument>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true },
    currentSerial: { type: Number, default: 0 },
    totalBooked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "paused", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

QueueSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const QueueModel: Model<IQueueDocument> =
  mongoose.models.Queue || mongoose.model<IQueueDocument>("Queue", QueueSchema);

export type { IQueue };
export default QueueModel;
