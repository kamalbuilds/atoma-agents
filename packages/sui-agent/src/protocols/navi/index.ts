import { NAVISDKClient, Sui } from 'navi-sdk';
import { handleError } from '../../utils';
import sentioApi from '../../config/sentio';
import { Liquidation } from './types';

// Initialize NAVI SDK client
let naviClient: NAVISDKClient | null = null;

/**
 * Initializes the NAVI SDK client
 * @param mnemonic - Optional mnemonic for account generation
 * @param networkType - Network type ('mainnet' or custom RPC)
 * @param numberOfAccounts - Number of accounts to generate
 * @returns JSON string with initialization status
 */

export async function initializeNaviClient(
  ...args: (string | number | bigint | boolean)[]
): Promise<string> {
  const [mnemonic, networkType, numberOfAccounts] = args as [
    string,
    string,
    number,
  ];

  try {
    naviClient = new NAVISDKClient({
      mnemonic,
      networkType,
      numberOfAccounts: numberOfAccounts || 5,
    });
    const account = naviClient.accounts[0];
    return JSON.stringify([
      {
        reasoning: 'Successfully initialized NAVI SDK client',
        response: JSON.stringify(
          {
            numberOfAccounts: naviClient.accounts.length,
            networkType,
            mnemonic: naviClient.getMnemonic(),
            address: account.address,
          },
          null,
          2,
        ),
        status: 'success',
        query: 'Initialize NAVI SDK client',
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to initialize NAVI SDK client',
        query: 'Attempted to initialize NAVI SDK client',
      }),
    ]);
  }
}

/**
 * Gets account information for a specific index
 * @param accountIndex - Index of the account to retrieve
 * @returns JSON string with account information
 */
export async function getNaviAccount(
  ...args: (string | number | bigint | boolean)[]
): Promise<string> {
  const [accountIndex] = args as [number];

  try {
    if (!naviClient) {
      throw new Error('NAVI SDK client not initialized');
    }

    const account = naviClient.accounts[accountIndex];
    if (!account) {
      throw new Error(`No account found at index ${accountIndex}`);
    }

    return JSON.stringify([
      {
        reasoning: 'Successfully retrieved NAVI account information',
        response: JSON.stringify(
          {
            address: account.address,
            publicKey: account.getPublicKey(),
          },
          null,
          2,
        ),
        status: 'success',
        query: `Get NAVI account at index ${accountIndex}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to retrieve NAVI account information',
        query: `Attempted to get NAVI account at index ${accountIndex}`,
      }),
    ]);
  }
}

export async function fetchLiquidationsFromSentio() {
  try {
    const response = await sentioApi.post('/sql/execute', {
      sqlQuery: {
        sql: 'select * from Liquidation',
      },
    });
    return response.data;
  } catch (error) {
    handleError(error, {
      reasoning: 'Failed to Fetch Liquidations from sentio',
      query: `Attempted to fetch liquidations from sentio`,
    });
  }
}

async function checkUserLiquidations(address: string) {
  try {
    const response = await sentioApi.post('/sql/execute', {
      sqlQuery: {
        sql: `SELECT * FROM Liquidation WHERE user = '${address}' OR liquidation_sender = '${address}'`,
      },
    });
    const liquidations = response.data;

    return {
      asUser: liquidations.result.rows.filter(
        (l: Liquidation) => l.user === address,
      ),
      asLiquidator: liquidations.result.rows.filter(
        (l: Liquidation) => l.liquidation_sender === address,
      ),
      totalLiquidations: liquidations.length,
    };
  } catch (error) {
    handleError(error, {
      reasoning: 'Failed to fetch liquidation status for user ',
      query: `Attempted to fetch liquidation status for user`,
    });
    console.error('Error checking user liquidations:', error);
    return {
      asUser: [],
      asLiquidator: [],
      totalLiquidations: 0,
    };
  }
}

export async function checkUserLiquidationStatusTool(
  ...args: (string | number | bigint | boolean)[]
): Promise<string> {
  const [walletAddress] = args as [string];
  const result = await checkUserLiquidations(walletAddress);
  return JSON.stringify([
    {
      reasoning: 'Successfully retrieved liquidation status',
      response: JSON.stringify(result),
      status: 'success',
      query: `Check liquidation status for ${walletAddress}`,
      errors: [],
    },
  ]);
}

/**
 * Gets NAVI portfolio for the specified address
 * @param address - Address to get NAVI portfolio for
 * @returns JSON string with NAVI portfolio
 */

export async function getNaviPortfolio(address: string) {
  const account = naviClient?.accounts[0];
  if (!account) {
    throw new Error('NAVI SDK client not initialized');
  }
  const result = account.getNAVIPortfolio(address, true);
  return JSON.stringify([
    {
      reasoning: 'Successfully retrieved NAVI portfolio',
      response: JSON.stringify(result),
      status: 'success',
      query: `Get NAVI portfolio for ${address}`,
      errors: [],
    },
  ]);
}

/**
 * Gets available rewards for the specified address
 * @param address - Address to get available rewards for
 * @returns JSON string with available rewards
 */

export async function getNaviAvailableRewards(address: string) {
  const account = naviClient?.accounts[0];
  if (!account) {
    throw new Error('NAVI SDK client not initialized');
  }
  const result = naviClient?.getAddressAvailableRewards(address, 1);
  return JSON.stringify([
    {
      reasoning: 'Successfully retrieved NAVI available rewards',
      response: JSON.stringify(result),
      status: 'success',
      query: `Get NAVI available rewards for ${address}`,
      errors: [],
    },
  ]);
}

/**
 * Gets NAVI pools for the specified coin
 * @param coin - Coin to get NAVI pools for
 * @returns JSON string with NAVI pools
 */

export async function getNaviPools(coin: string) {
  const result = naviClient?.getPoolInfo();
  return JSON.stringify([
    {
      reasoning: 'Successfully retrieved NAVI pools',
      response: JSON.stringify(result),
      status: 'success',
      query: `Get NAVI pools for ${coin}`,
      errors: [],
    },
  ]);
}

/**
 * Deposits NAVI for the specified coin
 * @param coin - Coin to deposit NAVI for
 * @param amount - Amount to deposit
 * @returns JSON string with deposit result
 */

export async function depositNavi(coin: string, amount: number) {
  const account = naviClient?.accounts[0];
  if (!account) {
    throw new Error('NAVI SDK client not initialized');
  }
  const result = account.depositToNavi(Sui, amount);
  return JSON.stringify([
    {
      reasoning: 'Successfully deposited NAVI',
      response: JSON.stringify(result),
      status: 'success',
      query: `Deposit NAVI ${coin} ${amount}`,
      errors: [],
    },
  ]);
}

/**
 * Withdraws NAVI for the specified coin
 * @param coin - Coin to withdraw NAVI for
 * @param amount - Amount to withdraw
 * @returns JSON string with withdrawal result
 */

export async function withrawFromNavi(coin: string, amount: number) {
  const account = naviClient?.accounts[0];
  if (!account) {
    throw new Error('NAVI SDK client not initialized');
  }
  const result = account.withdraw(Sui, amount);
  return JSON.stringify([
    {
      reasoning: 'Successfully withdrew from NAVI',
      response: JSON.stringify(result),
      status: 'success',
      query: `Withdraw NAVI ${coin} ${amount}`,
      errors: [],
    },
  ]);
}
