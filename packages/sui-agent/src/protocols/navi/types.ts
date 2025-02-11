import {
  Sui,
  USDT,
  WETH,
  vSui,
  haSui,
  CETUS,
  NAVX,
  WBTC,
  AUSD,
  wUSDC,
  nUSDC,
  ETH,
  USDY,
  NS,
  LorenzoBTC,
  DEEP,
  FDUSD,
  BLUE,
  BUCK,
  suiUSDT,
} from 'navi-sdk';

interface Liquidation {
  user: string;
  liquidation_sender: string;
  [key: string]: unknown;
}

export type { Liquidation };

export type {
  Sui,
  USDT,
  WETH,
  vSui,
  haSui,
  CETUS,
  NAVX,
  WBTC,
  AUSD,
  wUSDC,
  nUSDC,
  ETH,
  USDY,
  NS,
  LorenzoBTC,
  DEEP,
  FDUSD,
  BLUE,
  BUCK,
  suiUSDT,
};
