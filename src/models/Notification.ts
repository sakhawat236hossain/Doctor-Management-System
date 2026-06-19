import mongoose, { Schema, Model, Types } from "mongoose";
import type { INotification } from "@/types";

export interface INotificationDocument
  extends Omit<INotification, "_id" | "userId">,
    mongoose.Document {
  userId: Types.ObjectId;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "alert"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export type { INotification };
export default NotificationModel;
