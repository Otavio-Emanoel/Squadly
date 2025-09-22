import { Schema, model, InferSchemaType } from 'mongoose';

const ChatSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    participantsKey: { type: String, required: true, unique: true, index: true }, // ex: sorted 'userIdA:userIdB'
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: '' },
    messageCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export type ChatDocument = InferSchemaType<typeof ChatSchema> & { _id: string };
export const Chat = model<ChatDocument>('Chat', ChatSchema);
