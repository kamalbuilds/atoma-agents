import { Tool, toolResponse } from '../@types/interface';
import {
  EnhancedTool,
  ToolExecutionContext,
  ToolExecutionPlan,
  ToolExecutionResult,
  ToolExecutionStats,
  ToolExecutionSummary,
} from '../@types/tool';
import Atoma from '../config/atoma';

export class ToolManager {
  private tools: Map<string, EnhancedTool>;
  private prompt: string;
  private defaultContext: ToolExecutionContext;

  constructor(prompt: string, defaultContext: Partial<ToolExecutionContext> = {}) {
    this.tools = new Map();
    this.prompt = prompt;
    this.defaultContext = {
      timestamp: Date.now(),
      priority: 1,
      maxRetries: 3,
      timeout: 30000,
      ...defaultContext,
    };
  }

  /**
   * Register a new enhanced tool
   */
  registerTool(tool: EnhancedTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name ${tool.name} already exists`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Create an execution plan for multiple tools
   */
  async createExecutionPlan(
    query: string,
    AtomaClass: Atoma,
    context: Partial<ToolExecutionContext> = {},
  ): Promise<ToolExecutionPlan> {
    const toolResponse = await this.selectTools(query, AtomaClass, context.walletAddress);
    if (!toolResponse) {
      throw new Error('No suitable tools found for the query');
    }

    const selectedTools: EnhancedTool[] = [];
    const executionOrder: number[] = [];
    const parallelGroups: number[][] = [];
    let currentGroup: number[] = [];

    // Convert tool names to actual tool instances and determine execution order
    for (let i = 0; i < toolResponse.tools.length; i++) {
      const toolName = toolResponse.tools[i];
      const tool = this.tools.get(toolName);
      
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      selectedTools.push(tool);
      executionOrder.push(i);

      // Group tools that can be executed in parallel
      if (tool.parallelExecutionSupported) {
        currentGroup.push(i);
      } else {
        if (currentGroup.length > 0) {
          parallelGroups.push([...currentGroup]);
          currentGroup = [];
        }
      }
    }

    // Add the last parallel group if it exists
    if (currentGroup.length > 0) {
      parallelGroups.push(currentGroup);
    }

    return {
      tools: selectedTools,
      executionOrder,
      parallelGroups,
      context: { ...this.defaultContext, ...context },
    };
  }

  /**
   * Execute a plan of multiple tools
   */
  async executePlan(plan: ToolExecutionPlan): Promise<ToolExecutionSummary> {
    const startTime = Date.now();
    const stats: ToolExecutionStats[] = [];
    const successfulTools: string[] = [];
    const failedTools: string[] = [];

    // Execute tools in parallel groups where possible
    for (let i = 0; i < plan.executionOrder.length; i++) {
      const toolIndex = plan.executionOrder[i];
      const currentTool = plan.tools[toolIndex];
      if (!currentTool) {
        throw new Error(`Tool at index ${toolIndex} not found in execution plan`);
      }

      const parallelGroup = plan.parallelGroups?.find(group => group.includes(toolIndex));

      if (parallelGroup && parallelGroup.length > 0) {
        // Execute parallel group
        const validTools = parallelGroup
          .map(index => plan.tools[index])
          .filter((tool): tool is EnhancedTool => tool !== undefined);

        if (validTools.length !== parallelGroup.length) {
          throw new Error('Some tools in the parallel group are undefined');
        }

        type ExecutionPair = {
          tool: EnhancedTool;
          execution: Promise<ToolExecutionResult>;
        };

        // Execute all tools in parallel and collect results
        const executions: ExecutionPair[] = validTools.map(tool => ({
          tool,
          execution: this.executeSingleTool(tool, [], plan.context),
        }));

        // Wait for all executions to complete
        const results = await Promise.all(executions.map(e => e.execution));
        
        // Process results from parallel execution
        results.forEach((result, index) => {
          const execution = executions[index];
          if (!execution) {
            throw new Error(`Execution at index ${index} not found`);
          }

          if (result.success) {
            successfulTools.push(execution.tool.name);
          } else {
            failedTools.push(execution.tool.name);
          }
          stats.push({
            toolName: execution.tool.name,
            executionTime: result.executionTime || 0,
            success: result.success,
            error: result.error,
            retries: result.retries || 0,
          });
        });

        // Skip the indices we just processed
        i += parallelGroup.length - 1;
      } else {
        // Execute single tool
        const result = await this.executeSingleTool(currentTool, [], plan.context);
        if (result.success) {
          successfulTools.push(currentTool.name);
        } else {
          failedTools.push(currentTool.name);
        }
        stats.push({
          toolName: currentTool.name,
          executionTime: result.executionTime || 0,
          success: result.success,
          error: result.error,
          retries: result.retries || 0,
        });
      }
    }

    return {
      totalExecutionTime: Date.now() - startTime,
      successfulTools,
      failedTools,
      stats,
    };
  }

  /**
   * Execute a single tool with retries and timeout
   */
  private async executeSingleTool(
    tool: EnhancedTool,
    args: any[],
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    let retries = 0;
    const startTime = Date.now();

    while (retries <= (context.maxRetries || this.defaultContext.maxRetries)) {
      try {
        // Validate input if validator exists
        if (tool.validateInput && !tool.validateInput(args)) {
          throw new Error('Invalid input parameters');
        }

        // Execute with timeout
        const result = await Promise.race([
          tool.execute(args, context),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Execution timeout')), 
            context.timeout || this.defaultContext.timeout)
          ),
        ]);

        // Transform output if transformer exists
        const transformedResult = tool.transformOutput 
          ? tool.transformOutput(result)
          : result;

        return {
          ...transformedResult,
          executionTime: Date.now() - startTime,
          retries,
        };
      } catch (error) {
        retries++;
        if (retries > (context.maxRetries || this.defaultContext.maxRetries)) {
          return {
            success: false,
            data: '',
            error: error instanceof Error ? error.message : String(error),
            executionTime: Date.now() - startTime,
            retries,
          };
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    return {
      success: false,
      data: '',
      error: 'Maximum retries exceeded',
      executionTime: Date.now() - startTime,
      retries,
    };
  }

  /**
   * Select appropriate tools based on user query
   */
  private async selectTools(
    query: string,
    AtomaClass: Atoma,
    walletAddress?: string,
  ): Promise<toolResponse | null> {
    const finalPrompt = this.prompt.replace(
      '${toolsList}',
      JSON.stringify(Array.from(this.tools.values())),
    );

    const promptWithAddr = walletAddress
      ? `${finalPrompt}.Wallet address is ${walletAddress}.`
      : finalPrompt;

    const response = await AtomaClass.atomaChat([
      { role: 'assistant', content: promptWithAddr },
      { role: 'user', content: query },
    ]);

    if (
      response &&
      'choices' in response &&
      response.choices[0]?.message?.content
    ) {
      const parsedContent = JSON.parse(response.choices[0].message.content);
      if (Array.isArray(parsedContent) && parsedContent.length > 0) {
        return parsedContent[0] as toolResponse;
      }
    }

    return null;
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export default ToolManager; 