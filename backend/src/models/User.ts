import { Schema, model, InferSchemaType, Types } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    icon: { type: String, default: 'rocket', trim: true },
    status: { type: String, default: '', trim: true, maxlength: 140 },
    bio: { type: String, default: '', trim: true, maxlength: 280 },
    links: {
      github: { type: String, default: '', trim: true },
      linkedin: { type: String, default: '', trim: true },
      instagram: { type: String, default: '', trim: true },
      telegram: { type: String, default: '', trim: true },
      discord: { type: String, default: '', trim: true },
      website: { type: String, default: '', trim: true },
    },
    phone: { type: String, default: '', trim: true },
    theme: {
      type: String,
      enum: ['earth', 'mars', 'saturn', 'jupiter', 'venus', 'mercury', 'neptune', 'uranus', 'pluto', 'moon', 'sun'],
      default: 'earth',
    },
    level: { type: Number, default: 1, min: 1 },
    xp: { type: Number, default: 0, min: 0 },
    // Social graph
    followers: [{ type: Schema.Types.ObjectId, ref: 'User', select: false }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User', select: false }],
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: string };
export const User = model<UserDocument>('User', UserSchema);
