import { Schema, model, Document, Types } from "mongoose";

interface IConversation extends Document {
  walletAddress: string;
  messages: Types.ObjectId[];
  startedAt: Date;
  endedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
  walletAddress: { type: String, required: true },
  messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export const Conversation = model<IConversation>("Conversation", ConversationSchema);
export { IConversation };
