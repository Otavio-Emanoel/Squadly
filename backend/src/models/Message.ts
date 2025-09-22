import { Schema, model, InferSchemaType } from 'mongoose';

const MessageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    editedAt: { type: Date, default: null },
    // usuários que visualizaram esta mensagem (1:1: será no máximo o outro participante)
    seenBy: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true }
);

export type MessageDocument = InferSchemaType<typeof MessageSchema> & { _id: string };
export const Message = model<MessageDocument>('Message', MessageSchema);
