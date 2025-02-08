export interface CetusPool {
  poolAddress: string
  coinTypeA: string
  coinTypeB: string
  current_sqrt_price: string
  current_tick_index: string
  tickSpacing: string
}

export interface AddLiquidityParams {
  coinTypeA: string
  coinTypeB: string
  pool_id: string
  tick_lower: string
  tick_upper: string
  fix_amount_a: boolean
  amount_a: string
  amount_b: string
  slippage: number
  is_open: boolean
  rewarder_coin_types: string[]
  collect_fee: boolean
  pos_id: string
}

export interface SwapParams {
  pool_id: string
  coinTypeA: string
  coinTypeB: string
  a2b: boolean
  by_amount_in: boolean
  amount: string
  amount_limit: string
} 