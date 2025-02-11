import { Tool } from './interface';

export interface ToolExecutionContext {
  walletAddress?: string;
  chainId?: string;
  timestamp?: number;
  priority?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  data: string;
  error?: string;
  executionTime?: number;
  retries?: number;
}

export interface ToolDependency {
  toolName: string;
  required: boolean;
  parameters?: {
    [key: string]: string | number | boolean;
  };
}

export interface EnhancedTool extends Tool {
  category: string;
  version: string;
  dependencies?: ToolDependency[];
  parallelExecutionSupported?: boolean;
  requiredContext?: string[];
  validateInput?: (args: any[]) => boolean;
  transformOutput?: (result: any) => any;
  execute: (
    args: any[],
    context: ToolExecutionContext,
  ) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionPlan {
  tools: EnhancedTool[];
  executionOrder: number[];
  parallelGroups?: number[][];
  context: ToolExecutionContext;
}

export interface ToolExecutionStats {
  toolName: string;
  executionTime: number;
  success: boolean;
  error?: string;
  retries: number;
}

export interface ToolExecutionSummary {
  totalExecutionTime: number;
  successfulTools: string[];
  failedTools: string[];
  stats: ToolExecutionStats[];
} 