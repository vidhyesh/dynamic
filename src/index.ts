// Import statements
import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
import { ThresholdSignatureScheme } from '@dynamic-labs-wallet/core';

// Initialize EVM client
export const authenticatedEvmClient = async () => {
  const client = new DynamicEvmWalletClient({
    authToken: process.env.DYNAMIC_AUTH_TOKEN!,
    environmentId: process.env.DYNAMIC_ENVIRONMENT_ID!,
  });
  await client.authenticateApiToken(process.env.DYNAMIC_AUTH_TOKEN!);
  return client;
};

// Example usage
async function main() {
  try {
    // Initialize the EVM client
    const evmClient = await authenticatedEvmClient();

    // Create a new EVM wallet
    const evmWallet = await evmClient.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      password: "your-secure-password", // Optional: Password for wallet encryption
      onError: (error: Error) => {
        console.error("EVM wallet creation error:", error);
      },
      backUpToClientShareService: true,
    });

    console.log("EVM wallet created:", evmWallet.accountAddress);

    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();