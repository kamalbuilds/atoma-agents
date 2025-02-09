import { describe, expect, test } from '@jest/globals';
import Agents from '../agents/SuiAgent';

// Initialize agent with test credentials
const agent = new Agents(process.env.BEARER_TOKEN || '');

describe('Cetus Protocol Integration Tests', () => {
  // Test pool data retrieval
  test('should get pool information', async () => {
    const testPoolId = '0x5c45d10c26c5fb53bfaff819666da6bc7053d2190dfa29fec311cc666ff1f4b0';
    const response = await agent.SuperVisorAgent(`Get information about Cetus pool ${testPoolId}`);
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(response.response).toHaveProperty('poolAddress');
  });

  // Test position data retrieval
  test('should get positions for address', async () => {
    const testAddress = '0xcd0247d0b67e53dde69b285e7a748e3dc390e8a5244eb9dd9c5c53d95e4cf0aa';
    const response = await agent.SuperVisorAgent(`Get all Cetus positions for address ${testAddress}`);
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(Array.isArray(response.response)).toBe(true);
  });

  // Test pool statistics
  test('should get pool statistics', async () => {
    const testPoolId = '0x5c45d10c26c5fb53bfaff819666da6bc7053d2190dfa29fec311cc666ff1f4b0';
    const response = await agent.SuperVisorAgent(`Get statistics for Cetus pool ${testPoolId}`);
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(response.response).toHaveProperty('tvl');
  });

  // Test swap quote calculation
  test('should calculate swap quote', async () => {
    const testPoolId = '0x5c45d10c26c5fb53bfaff819666da6bc7053d2190dfa29fec311cc666ff1f4b0';
    const response = await agent.SuperVisorAgent(
      `Calculate swap quote for 1 SUI to USDC on Cetus pool ${testPoolId} with 1% slippage`
    );
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(response.response).toHaveProperty('amount_limit');
  });

  // Test liquidity position calculation
  test('should calculate liquidity position', async () => {
    const testPoolId = '0x5c45d10c26c5fb53bfaff819666da6bc7053d2190dfa29fec311cc666ff1f4b0';
    const response = await agent.SuperVisorAgent(
      `Calculate liquidity position for adding 100 USDC to Cetus pool ${testPoolId} with 0.5% slippage`
    );
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(response.response).toHaveProperty('amount_a');
    expect(response.response).toHaveProperty('amount_b');
  });

  // Test pool creation parameters
  test('should validate pool creation parameters', async () => {
    const response = await agent.SuperVisorAgent(
      'Create a new Cetus pool for SUI/USDC with tick spacing 2 and initial price 1.0'
    );
    expect(response).toBeDefined();
    expect(response.errors).toHaveLength(0);
    expect(response.response).toHaveProperty('initialize_sqrt_price');
  });
}); 