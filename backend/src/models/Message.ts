import { Schema, model, InferSchemaType } from 'mongoose';

const MessageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type MessageDocument = InferSchemaType<typeof MessageSchema> & { _id: string };
export const Message = model<MessageDocument>('Message', MessageSchema);
