import { Request, Response } from 'express';
import ConversationService from '../services/conversation.service';
import MessageService from '../services/message.service';
import Agent from '@atoma-agents/sui-agent/src/agents/SuiAgent';
import config from '../config/config';
const { atomaSdkBearerAuth } = config.auth;
const suiAgent = new Agent(atomaSdkBearerAuth);
import { Types } from 'mongoose';

class ConversationController {
  private conversationService: ConversationService;
  private messageService: MessageService;
  private temporaryConversations: Map<
    string,
    { walletAddress: string; messages: { sender: string; message: string }[] }
  >;

  constructor() {
    this.conversationService = new ConversationService();
    this.messageService = new MessageService();
    this.temporaryConversations = new Map();
  }
  startConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json({ error: 'Missing Wallet Address' });
        return;
      }
      const conversation = await this.conversationService.startConversation(walletAddress);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ error: 'Failed to start conversation' });
    }
  };

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { message, walletAddress, sender } = req.body;

      if (!Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ error: 'Invalid conversation ID' });
        return;
      }
      const result = await suiAgent.SuperVisorAgent(message, walletAddress);
      const newMessage = await this.messageService.createMessage({
        sender: sender ? sender : 'user',
        walletAddress,
        message,
        sessionId: new Types.ObjectId(conversationId)
      });
      await this.messageService.createMessage({
        sender: 'ai',
        walletAddress,
        message:
          typeof result[0].response === 'string'
            ? result[0].response
            : JSON.stringify(result[0].response),
        sessionId: new Types.ObjectId(conversationId)
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  };

  getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;

      if (!Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ error: 'Invalid conversation ID' });
        return;
      }

      const conversation = await this.conversationService.getConversation(
        new Types.ObjectId(conversationId)
      );

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  };

  getUserConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      const conversations = await this.conversationService.getUserConversations(walletAddress);
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  };
  getUserConversationIds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      const conversationIds = await this.conversationService.getUserConversationIds(walletAddress);

      res.status(200).json(conversationIds);
    } catch (ex) {
      res.status(404).json({ error: 'conversation not found' });
    }
  };

  startTemporaryConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        res.status(400).json({ error: 'Missing Wallet Address' });
        return;
      }
      const tempId = new Types.ObjectId().toString();
      this.temporaryConversations.set(tempId, { walletAddress, messages: [] });
      res.status(201).json({ tempId });
    } catch (error) {
      console.error('Error starting temporary conversation:', error);
      res.status(500).json({ error: 'Failed to start temporary conversation' });
    }
  };

  sendTemporaryMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempId } = req.params;
      const { message, walletAddress, sender } = req.body;

      if (!this.temporaryConversations.has(tempId)) {
        res.status(400).json({ error: 'Temporary conversation not found' });
        return;
      }

      const result = await suiAgent.SuperVisorAgent(message, walletAddress);
      const userMessage = { sender: (sender as string) || 'user', message };
      const botMessage = { sender: 'ai', message: result[0].response };
      this.temporaryConversations.get(tempId)?.messages.push(userMessage, botMessage);
      res.status(201).json({ userMessage, botMessage });
    } catch (error) {
      console.error('Error sending temporary message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  };
  getTemporaryConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempId } = req.params;

      if (!this.temporaryConversations.has(tempId)) {
        res.status(404).json({ error: 'Temporary conversation not found' });
        return;
      }
      res.status(200).json(this.temporaryConversations.get(tempId));
    } catch (error) {
      console.error('Error fetching temporary conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  };
}

export default ConversationController;
