import { Message,IMessage } from "../models/message.model";
import ConversationRepository from "../repositories/conversation.repository";
import { Types } from "mongoose";


class ConversationService {
    private conversationRepository: ConversationRepository;

    constructor() {
        this.conversationRepository = new ConversationRepository();
    }

    async startConversation(walletAddress: string) {
        return await this.conversationRepository.create({ walletAddress });
    }

    async endConversation(sessionId: Types.ObjectId) {
        return await this.conversationRepository.endConversation(sessionId);
    }

    async getUserConversations(walletAddress: string) {
        let decryptedConversations = await this.conversationRepository.getByWalletAddress(walletAddress);
        return decryptedConversations.map((dConvo) => ({
            ...dConvo.toObject(),
            messages: dConvo.messages.map((d) => 
                d && typeof d === "object" && "message" in d
                    ? { ...d.toObject(), message: d.getDecryptedMessage() } 
                    : d
            ),
        }));
    };
 
    async getConversation(sessionId: Types.ObjectId) {
        const conversation = await this.conversationRepository.getBySessionId(sessionId);
        if (!conversation) return null; 
        return {
            ...conversation.toObject(), 
            messages: conversation.messages.map((msg) => 
                msg && typeof msg === "object" && "message" in msg
                    ? { ...msg.toObject(), message: msg.getDecryptedMessage(), hi: 'hello' }
                    : msg
            ),
        };
    }
}

export default ConversationService;
