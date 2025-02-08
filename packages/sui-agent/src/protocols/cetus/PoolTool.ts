import { d, TickMath } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { CetusVaultsSDK } from '@cetusprotocol/vaults-sdk';
import BN from 'bn.js'
import { handleError } from '../../utils'

export class PoolTool {
  static async addLiquidity(
    sdk: CetusVaultsSDK,
    poolId: string, 
    amount: string,
    tickLower: number,
    tickUpper: number,
    slippage: number
  ) {
    try {
      const pool = await sdk.Pool.getPool(poolId)
      const curSqrtPrice = new BN(pool.current_sqrt_price)
      
      const liquidityInput = await sdk.Position.calculateAddLiquidity({
        pool,
        tickLower,
        tickUpper,
        amount: new BN(amount),
        fixedAmount: true,
        slippage: d(slippage)
      })

      const payload = await sdk.Position.createAddLiquidityPayload({
        pool_id: poolId,
        amount_a: liquidityInput.tokenMaxA.toString(),
        amount_b: liquidityInput.tokenMaxB.toString(),
        tick_lower: tickLower.toString(),
        tick_upper: tickUpper.toString(),
        slippage
      })

      return payload

    } catch (error) {
      throw error
    }
  }

  // Additional pool methods...
} 