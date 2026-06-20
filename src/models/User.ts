import mongoose, { Schema, Model } from "mongoose";
import type { IUser } from "@/types";

export interface IUserDocument extends Omit<IUser, "_id">, mongoose.Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false, default: "" },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist", "patient"],
      required: true,
    },
    phone: { type: String, trim: true, default: "" },
    profileImage: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    authProviders: [{ type: String, enum: ["credentials", "google", "facebook"], default: ["credentials"] }],
  },
  { timestamps: true }
);


export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export type { IUser };
export default UserModel;
