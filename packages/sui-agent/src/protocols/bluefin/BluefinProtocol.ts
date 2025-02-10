import { BluefinClient, ExtendedNetwork } from "@bluefin-exchange/bluefin-v2-client";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Protocol } from "../../@types/interface";
import {
  BluefinConfig,
  BluefinOrderParams,
  BluefinPositionParams,
  BluefinMarginParams,
  BluefinCancelOrderParams,
  BluefinUserDataParams,
  BluefinMarketDataParams,
} from "./types";

export class BluefinProtocol implements Protocol {
  private client: BluefinClient;
  private config: BluefinConfig;

  constructor(
    provider: SuiClient,
    keypair: Ed25519Keypair,
    config: BluefinConfig
  ) {
    this.config = config;
    const network: ExtendedNetwork = {
      name: config.network,
      url: provider.url,
    };

    this.client = new BluefinClient(
      config.isTermAccepted,
      network,
      keypair
    );
  }

  async initialize(): Promise<void> {
    await this.client.init();
  }

  async placeOrder(params: BluefinOrderParams) {
    const { symbol, side, type, price, quantity, timeInForce, leverage } = params;
    
    if (leverage) {
      await this.client.adjustLeverage({
        symbol,
        leverage,
      });
    }

    return this.client.postOrder({
      symbol,
      side,
      type,
      price,
      quantity,
      timeInForce,
    });
  }

  async cancelOrder(params: BluefinCancelOrderParams) {
    const { symbol, orderId, cancelAll } = params;
    
    if (cancelAll) {
      return this.client.cancelAllOpenOrders(symbol);
    }

    if (orderId) {
      return this.client.postCancelOrder({
        symbol,
        orderId,
      });
    }

    throw new Error("Either orderId or cancelAll must be specified");
  }

  async adjustPosition(params: BluefinPositionParams) {
    const { symbol, leverage } = params;
    
    if (!leverage) {
      throw new Error("Leverage must be specified");
    }

    return this.client.adjustLeverage({
      symbol,
      leverage,
    });
  }

  async adjustMargin(params: BluefinMarginParams) {
    const { symbol, amount, isDeposit } = params;
    
    return this.client.adjustMargin(
      symbol,
      isDeposit ? "ADD" : "REMOVE",
      amount
    );
  }

  async getUserOrders(params: BluefinUserDataParams) {
    const { symbol, parentAddress } = params;
    return this.client.getUserOrders({
      symbol,
      parentAddress,
    });
  }

  async getUserPositions(params: BluefinUserDataParams) {
    const { symbol, parentAddress } = params;
    return this.client.getUserPosition({
      symbol,
      parentAddress,
    });
  }

  async getUserAccountData(params: BluefinUserDataParams) {
    const { parentAddress } = params;
    return this.client.getUserAccountData(parentAddress);
  }

  async getMarketData(params: BluefinMarketDataParams) {
    const { symbol } = params;
    return this.client.getMarketData(symbol);
  }

  async getOrderbook(params: BluefinMarketDataParams) {
    const { symbol } = params;
    if (!symbol) {
      throw new Error("Symbol must be specified for orderbook data");
    }
    return this.client.getOrderbook({ symbol });
  }

  async getMarketInfo(params: BluefinMarketDataParams) {
    const { symbol } = params;
    return this.client.getExchangeInfo(symbol);
  }
} 