import { ThirdwebClient } from '@thirdweb-dev/sdk';
import type { ValidationResult, PortfolioAnalysis } from '@/types/portfolio';

export interface AIClient extends ThirdwebClient {
    analyzePortfolioValidations(
        validations: ValidationResult[],
        tokenData: any[]
    ): Promise<PortfolioAnalysis>;
}

export const client = new ThirdwebClient({
    clientId: process.env['NEXT_PUBLIC_THIRDWEB_CLIENT_ID'] ?? ''
}) as AIClient;

client.analyzePortfolioValidations = async (
    validations: ValidationResult[],
    tokenData: any[]
): Promise<PortfolioAnalysis> => {
    const analysis = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ validations, tokenData })
    }).then(res => res.json());

    return analysis;
}; 