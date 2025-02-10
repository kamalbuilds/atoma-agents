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
        return await this.conversationRepository.getByWalletAddress(walletAddress);
    }

    async getConversation(sessionId: Types.ObjectId) {
        const conversation = await this.conversationRepository.getBySessionId(sessionId);
        
        if (conversation) {
            // **Decrypt messages before returning**
            conversation.messages = conversation.messages.map((msg: any) => ({
                ...msg.toObject(),
                message: msg.getDecryptedMessage(),
            }));
        }

        return conversation;
    }
}

export default ConversationService;
