import { BluefinClient, ExtendedNetwork, ADJUST_MARGIN, ORDER_STATUS } from "@bluefin-exchange/bluefin-v2-client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import Tools from "../../utils/tools";
import { handleError } from "../../utils";
import {
  BluefinConfig,
  BluefinOrderParams,
  BluefinPositionParams,
  BluefinMarginParams,
  BluefinCancelOrderParams,
  BluefinUserDataParams,
  BluefinMarketDataParams,
} from "./types";

class BluefinTools {
  private static client: BluefinClient;

  private static async initClient(
    network: "mainnet" | "testnet" | "devnet",
    keypair: Ed25519Keypair
  ) {
    if (!this.client) {
      const networkConfig: ExtendedNetwork = {
        name: network,
        url: process.env.SUI_RPC_URL || "https://fullnode.mainnet.sui.io",
        webSocketURL: process.env.SUI_WS_URL || "wss://fullnode.mainnet.sui.io:443",
      };

      this.client = new BluefinClient(
        true,
        networkConfig,
        keypair.toSuiAddress()
      );
      await this.client.init();
    }
    return this.client;
  }

  private static formatResponse(result: any, query: string): string {
    return JSON.stringify([{
      reasoning: "Operation completed successfully",
      response: JSON.stringify(result),
      status: "success",
      query,
      errors: [],
    }]);
  }

  private static formatError(error: unknown, context: { reasoning: string; query: string }): string {
    const errorResponse = handleError(error, context);
    return JSON.stringify([errorResponse]);
  }

  public static registerTools(tools: Tools) {
    // Order Management Tools
    tools.registerTool(
      "place_bluefin_order",
      "Place a new order on Bluefin",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: true,
        },
        {
          name: "side",
          type: "string",
          description: "Order side (BUY/SELL)",
          required: true,
        },
        {
          name: "type",
          type: "string",
          description: "Order type (LIMIT/MARKET)",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
          description: "Order quantity",
          required: true,
        },
        {
          name: "price",
          type: "number",
          description: "Order price (required for LIMIT orders)",
          required: false,
        },
        {
          name: "leverage",
          type: "number",
          description: "Position leverage",
          required: false,
        },
      ],
      async (...args) => {
        try {
          const result = await this.placeOrder({
            symbol: args[0] as string,
            side: args[1] as any,
            type: args[2] as any,
            quantity: args[3] as number,
            price: args[4] as number || undefined,
            leverage: args[5] as number || undefined,
          });
          return this.formatResponse(result, `Place ${args[1]} order for ${args[3]} ${args[0]} at ${args[4] || 'MARKET'}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to place order",
            query: `Failed to place ${args[1]} order for ${args[3]} ${args[0]}`,
          });
        }
      }
    );

    tools.registerTool(
      "cancel_bluefin_order",
      "Cancel an existing order on Bluefin",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: true,
        },
        {
          name: "order_id",
          type: "string",
          description: "Order ID to cancel",
          required: false,
        },
        {
          name: "cancel_all",
          type: "boolean",
          description: "Cancel all open orders",
          required: false,
        },
      ],
      async (...args) => {
        try {
          const result = await this.cancelOrder({
            symbol: args[0] as string,
            orderId: args[1] as string,
            cancelAll: args[2] as boolean,
          });
          return this.formatResponse(result, `Cancel ${args[2] ? 'all orders' : `order ${args[1]}`} for ${args[0]}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to cancel order",
            query: `Failed to cancel ${args[2] ? 'all orders' : `order ${args[1]}`} for ${args[0]}`,
          });
        }
      }
    );

    // Position Management Tools
    tools.registerTool(
      "adjust_bluefin_position",
      "Adjust position leverage on Bluefin",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: true,
        },
        {
          name: "leverage",
          type: "number",
          description: "New leverage value",
          required: true,
        },
      ],
      async (...args) => {
        try {
          const result = await this.adjustPosition({
            symbol: args[0] as string,
            leverage: args[1] as number,
          });
          return this.formatResponse(result, `Adjust leverage to ${args[1]}x for ${args[0]}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to adjust position",
            query: `Failed to adjust leverage to ${args[1]}x for ${args[0]}`,
          });
        }
      }
    );

    tools.registerTool(
      "adjust_bluefin_margin",
      "Add or remove margin from a position",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: true,
        },
        {
          name: "amount",
          type: "number",
          description: "Amount to add/remove",
          required: true,
        },
        {
          name: "is_deposit",
          type: "boolean",
          description: "True for deposit, false for withdrawal",
          required: true,
        },
      ],
      async (...args) => {
        try {
          const result = await this.adjustMargin({
            symbol: args[0] as string,
            amount: args[1] as number,
            isDeposit: args[2] as boolean,
          });
          return this.formatResponse(result, `${args[2] ? 'Add' : 'Remove'} ${args[1]} margin for ${args[0]}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to adjust margin",
            query: `Failed to ${args[2] ? 'add' : 'remove'} ${args[1]} margin for ${args[0]}`,
          });
        }
      }
    );

    // Market Data Tools
    tools.registerTool(
      "get_bluefin_orderbook",
      "Get the orderbook for a trading pair",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: true,
        },
      ],
      async (...args) => {
        try {
          const result = await this.getOrderbook({
            symbol: args[0] as string,
          });
          return this.formatResponse(result, `Get orderbook for ${args[0]}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to get orderbook",
            query: `Failed to get orderbook for ${args[0]}`,
          });
        }
      }
    );

    tools.registerTool(
      "get_bluefin_market_data",
      "Get market data for a trading pair",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol",
          required: false,
        },
      ],
      async (...args) => {
        try {
          const result = await this.getMarketData({
            symbol: args[0] as string,
          });
          return this.formatResponse(result, `Get market data for ${args[0] || 'all markets'}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to get market data",
            query: `Failed to get market data for ${args[0] || 'all markets'}`,
          });
        }
      }
    );

    // User Data Tools
    tools.registerTool(
      "get_bluefin_user_positions",
      "Get user's open positions",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol (optional)",
          required: false,
        },
        {
          name: "parent_address",
          type: "string",
          description: "Parent address (optional)",
          required: false,
        },
      ],
      async (...args) => {
        try {
          const result = await this.getUserPositions({
            symbol: args[0] as string,
            parentAddress: args[1] as string,
          });
          return this.formatResponse(result, `Get positions for ${args[1] || 'user'} ${args[0] ? `in ${args[0]}` : ''}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to get user positions",
            query: `Failed to get positions for ${args[1] || 'user'} ${args[0] ? `in ${args[0]}` : ''}`,
          });
        }
      }
    );

    tools.registerTool(
      "get_bluefin_user_orders",
      "Get user's orders",
      [
        {
          name: "symbol",
          type: "string",
          description: "Trading pair symbol (optional)",
          required: false,
        },
        {
          name: "parent_address",
          type: "string",
          description: "Parent address (optional)",
          required: false,
        },
      ],
      async (...args) => {
        try {
          const result = await this.getUserOrders({
            symbol: args[0] as string,
            parentAddress: args[1] as string,
            statuses: [ORDER_STATUS.OPEN, ORDER_STATUS.PARTIAL_FILLED],
          });
          return this.formatResponse(result, `Get orders for ${args[1] || 'user'} ${args[0] ? `in ${args[0]}` : ''}`);
        } catch (error) {
          return this.formatError(error, {
            reasoning: "Failed to get user orders",
            query: `Failed to get orders for ${args[1] || 'user'} ${args[0] ? `in ${args[0]}` : ''}`,
          });
        }
      }
    );
  }

  private static async placeOrder(params: BluefinOrderParams): Promise<any> {
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

  private static async cancelOrder(params: BluefinCancelOrderParams): Promise<any> {
    const { symbol, orderId, cancelAll } = params;
    
    if (cancelAll) {
      return this.client.cancelAllOpenOrders(symbol);
    } else if (orderId) {
      return this.client.postCancelOrder({
        symbol,
        hash: orderId,
      });
    } else {
      throw new Error("Either orderId or cancelAll must be specified");
    }
  }

  private static async adjustPosition(params: BluefinPositionParams): Promise<any> {
    const { symbol, leverage } = params;
    
    if (!leverage) {
      throw new Error("Leverage must be specified");
    }

    return this.client.adjustLeverage({
      symbol,
      leverage,
    });
  }

  private static async adjustMargin(params: BluefinMarginParams): Promise<any> {
    const { symbol, amount, isDeposit } = params;
    
    return this.client.adjustMargin(
      symbol,
      isDeposit ? ADJUST_MARGIN.Add : ADJUST_MARGIN.Remove,
      amount
    );
  }

  private static async getUserOrders(params: BluefinUserDataParams): Promise<any> {
    const { symbol, parentAddress } = params;
    return this.client.getUserOrders({
      symbol,
      parentAddress,
      statuses: [ORDER_STATUS.OPEN, ORDER_STATUS.PARTIAL_FILLED],
    });
  }

  private static async getUserPositions(params: BluefinUserDataParams): Promise<any> {
    const { symbol, parentAddress } = params;
    return this.client.getUserPosition({
      symbol,
      parentAddress,
    });
  }

  private static async getOrderbook(params: BluefinMarketDataParams): Promise<any> {
    const { symbol } = params;
    if (!symbol) {
      throw new Error("Symbol must be specified for orderbook data");
    }
    return this.client.getOrderbook({ 
      symbol,
      limit: 50,
    });
  }

  private static async getMarketData(params: BluefinMarketDataParams): Promise<any> {
    const { symbol } = params;
    return this.client.getMarketData(symbol);
  }
}

export default BluefinTools; 