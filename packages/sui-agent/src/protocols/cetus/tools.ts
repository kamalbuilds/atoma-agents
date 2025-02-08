import { CetusVaultsSDK } from '@cetusprotocol/cetus-sui-clmm-sdk'
import Tools from '../../utils/tools'
import { handleError } from '../../utils'

class CetusTools {
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
      this.getPool
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
        }
      ],
      this.getPositions
    )

    // Swap Tools
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
      this.swap
    )
  }

  private static async getPool(poolId: string) {
    try {
      const sdk = new CetusVaultsSDK({ network: 'mainnet' })
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


}

export default CetusTools 