import { adjustForSlippage, initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk'
import { d, TickMath, ClmmPoolUtil, Percentage } from '@cetusprotocol/cetus-sui-clmm-sdk'
import BN from 'bn.js'
import Tools from '../../utils/tools'
import { handleError } from '../../utils'

class CetusTools {
  private static sdk: any

  private static initSDK() {
    if (!this.sdk) {
      this.sdk = initCetusSDK({
        network: 'mainnet',
        fullNodeUrl: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io',
        simulationAccount: process.env.SUI_WALLET_ADDRESS || '',
      })
    }
    return this.sdk
  }

  public static registerTools(tools: Tools) {
    // Pool Tools
    tools.registerTool(
      'get_cetus_pool',
      'Get details about a specific Cetus pool',
      [
        {
          name: 'pool_id',
          type: 'string',
          description: 'The object ID of the pool',
          required: true
        }
      ],
      async (...args) => this.getPool(args[0] as string)
    )

    // Position Tools
    tools.registerTool(
      'get_cetus_positions',
      'Get all positions for an address',
      [
        {
          name: 'address',
          type: 'string',
          description: 'The address to get positions for',
          required: true
        },
        {
          name: 'pool_id',
          type: 'string',
          description: 'Optional pool ID to filter positions',
          required: false
        }
      ],
      async (...args) => this.getPositions(args[0] as string, args[1] as string)
    )

    // Add Liquidity Tool
    tools.registerTool(
      'add_cetus_liquidity',
      'Add liquidity to a Cetus pool',
      [
        {
          name: 'pool_id',
          type: 'string',
          description: 'Pool ID to add liquidity to',
          required: true
        },
        {
          name: 'amount',
          type: 'string',
          description: 'Amount to add as liquidity',
          required: true
        },
        {
          name: 'slippage',
          type: 'number',
          description: 'Slippage tolerance (e.g. 0.01 for 1%)',
          required: true
        }
      ],
      async (...args) => this.addLiquidity(args[0] as string, args[1] as string, args[2] as number)
    )

    // Swap Tool
    tools.registerTool(
      'cetus_swap',
      'Perform a swap on Cetus',
      [
        {
          name: 'pool_id',
          type: 'string',
          description: 'Pool ID to swap on',
          required: true
        },
        {
          name: 'amount_in',
          type: 'string', 
          description: 'Amount to swap',
          required: true
        },
        {
          name: 'slippage',
          type: 'number',
          description: 'Slippage tolerance (e.g. 0.01 for 1%)',
          required: true
        }
      ],
      async (...args) => this.swap(args[0] as string, args[1] as string, args[2] as number)
    )
  }

  private static async getPool(poolId: string) {
    try {
      const sdk = this.initSDK()
      const pool = await sdk.Pool.getPool(poolId)
      return JSON.stringify([{
        reasoning: 'Successfully retrieved pool information',
        response: pool,
        status: 'success',
        query: `Get pool ${poolId}`,
        errors: []
      }])
    } catch (error) {
      return JSON.stringify([
        handleError(error, {
          reasoning: 'Failed to retrieve pool information',
          query: `Attempted to get pool ${poolId}`
        })
      ])
    }
  }

  private static async getPositions(address: string, poolId?: string) {
    try {
      const sdk = this.initSDK()
      const positions = await sdk.Position.getPositionList(address, poolId ? [poolId] : undefined)
      return JSON.stringify([{
        reasoning: 'Successfully retrieved positions',
        response: positions,
        status: 'success',
        query: `Get positions for address ${address}`,
        errors: []
      }])
    } catch (error) {
      return JSON.stringify([
        handleError(error, {
          reasoning: 'Failed to retrieve positions',
          query: `Attempted to get positions for address ${address}`
        })
      ])
    }
  }

  private static async addLiquidity(poolId: string, amount: string, slippage: number) {
    try {
      const sdk = this.initSDK()
      const pool = await sdk.Pool.getPool(poolId)
      
      // Calculate tick range around current price
      const currentTick = TickMath.sqrtPriceX64ToTickIndex(new BN(pool.current_sqrt_price))
      const tickSpacing = Number(pool.tickSpacing)
      const tickLower = TickMath.getPrevInitializableTickIndex(currentTick, tickSpacing)
      const tickUpper = TickMath.getNextInitializableTickIndex(currentTick, tickSpacing)

      // Calculate liquidity amounts
      const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
        tickLower,
        tickUpper,
        new BN(amount),
        true, // fix amount A
        true,
        slippage,
        new BN(pool.current_sqrt_price)
      )

      const payload = await sdk.Position.createAddLiquidityFixTokenPayload({
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        pool_id: poolId,
        amount_a: liquidityInput.tokenMaxA.toString(),
        amount_b: liquidityInput.tokenMaxB.toString(),
        tick_lower: tickLower.toString(),
        tick_upper: tickUpper.toString(),
        is_open: true,
        slippage,
        fix_amount_a: true,
        rewarder_coin_types: [],
        collect_fee: false,
        pos_id: ''
      })

      return JSON.stringify([{
        reasoning: 'Successfully created add liquidity transaction',
        response: payload,
        status: 'success',
        query: `Add liquidity to pool ${poolId}`,
        errors: []
      }])
    } catch (error) {
      return JSON.stringify([
        handleError(error, {
          reasoning: 'Failed to create add liquidity transaction',
          query: `Attempted to add liquidity to pool ${poolId}`
        })
      ])
    }
  }

  private static async swap(poolId: string, amountIn: string, slippage: number) {
    try {
      const sdk = this.initSDK()
      const pool = await sdk.Pool.getPool(poolId)

      // Pre-swap calculation
      const preSwap = await sdk.Swap.preswap({
        pool,
        current_sqrt_price: pool.current_sqrt_price,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        decimalsA: 9, // Should get from coin metadata
        decimalsB: 9,
        a2b: true,
        by_amount_in: true,
        amount: new BN(amountIn)
      })

        // slippage value
        const slippage = Percentage.fromDecimal(d(5))

      const toAmount = preSwap.byAmountIn ? preSwap.estimatedAmountOut : preSwap.estimatedAmountIn
      const amountLimit =  adjustForSlippage(toAmount, slippage, !preSwap.byAmountIn)


      const payload = await sdk.Swap.createSwapTransactionPayload({
        pool_id: poolId,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        a2b: true,
        by_amount_in: true,
        amount: amountIn,
        amount_limit: amountLimit.toString()
      })

      return JSON.stringify([{
        reasoning: 'Successfully created swap transaction',
        response: payload,
        status: 'success',
        query: `Swap on pool ${poolId}`,
        errors: []
      }])
    } catch (error) {
      return JSON.stringify([
        handleError(error, {
          reasoning: 'Failed to create swap transaction',
          query: `Attempted to swap on pool ${poolId}`
        })
      ])
    }
  }
}

export default CetusTools 