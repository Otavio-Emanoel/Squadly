import { Schema, model, InferSchemaType } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false, minlength: 6 },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: string };
export const User = model<UserDocument>('User', UserSchema);
