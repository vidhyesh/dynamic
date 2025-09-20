// Import statements
import 'dotenv/config';
import { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";

// Types for better understanding
interface WalletInfo {
  accountAddress: string;
  walletId: string;
  publicKeyHex: string;
}

// Initialize EVM client
export const authenticatedEvmClient = async () => {
  const client = new DynamicEvmWalletClient({
    environmentId: process.env.DYNAMIC_ENVIRONMENT_ID!,
  });
  await client.authenticateApiToken(process.env.DYNAMIC_AUTH_TOKEN!);
  return client;
};

// Function to create a new wallet
export const createNewWallet = async (password?: string): Promise<WalletInfo> => {
  try {
    const evmClient = await authenticatedEvmClient();

    const evmWallet = await evmClient.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      password: password || "your-secure-password",
      onError: (error: Error) => {
        console.error("EVM wallet creation error:", error);
      },
      backUpToClientShareService: true,
    });

    const walletInfo: WalletInfo = {
      accountAddress: evmWallet.accountAddress,
      walletId: evmWallet.walletId,
      publicKeyHex: evmWallet.publicKeyHex,
    };

    console.log("✅ New wallet created successfully!");
    console.log("📍 Address:", walletInfo.accountAddress);
    console.log("🆔 Wallet ID:", walletInfo.walletId);
    console.log("🔑 Public Key:", walletInfo.publicKeyHex);

    return walletInfo;
  } catch (error) {
    console.error("❌ Wallet creation failed:", error);
    throw error;
  }
};

// Function to initialize an existing wallet (use this when you already have a wallet address)
export const initializeExistingWallet = async (walletAddress: string) => {
  try {
    const evmClient = await authenticatedEvmClient();

    console.log("🔄 Initializing existing wallet:", walletAddress);

    // You can verify the wallet exists by checking its balance or getting key shares
    await checkWalletExists(evmClient, walletAddress);

    console.log("✅ Wallet initialized successfully!");
    return { evmClient, walletAddress };
  } catch (error) {
    console.error("❌ Failed to initialize wallet:", error);
    throw error;
  }
};

// Helper function to check if wallet exists
const checkWalletExists = async (evmClient: any, walletAddress: string) => {
  try {
    const { http } = await import('viem');
    const { base } = await import('viem/chains');

    const publicClient = evmClient.createViemPublicClient({
      chain: base,
      rpcUrl: 'https://mainnet.base.org',
    });

    // Try to get balance to verify wallet exists
    await publicClient.getBalance({
      address: walletAddress as `0x${string}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Wallet verification failed: ${errorMessage}`);
  }
};

// Function to perform wallet operations (transactions, signing, etc.)
export const performWalletOperations = async (walletAddress: string, password: string) => {
  console.log("\n--- 💼 Wallet Operations ---");

  try {
    const evmClient = await authenticatedEvmClient();

    // 1. Check wallet balance
    await checkBalance(evmClient, walletAddress);

    // 2. Sign a message
    await signMessage(evmClient, walletAddress, password);

    // 3. Prepare a transaction (without sending)
    await prepareTransaction(evmClient, walletAddress);

  } catch (error) {
    console.error("❌ Wallet operations failed:", error);
  }
};

// Check wallet balance
async function checkBalance(evmClient: any, walletAddress: string) {
  try {
    const { http } = await import('viem');
    const { base } = await import('viem/chains');

    const publicClient = evmClient.createViemPublicClient({
      chain: base,
      rpcUrl: 'https://mainnet.base.org',
    });

    const balance = await publicClient.getBalance({
      address: walletAddress as `0x${string}`,
    });

    console.log(`💰 Balance: ${balance.toString()} wei`);
    console.log(`💰 Balance in ETH: ${Number(balance) / 1e18}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Balance check failed:", errorMessage);
  }
}

// Sign a message
async function signMessage(evmClient: any, walletAddress: string, password: string) {
  try {
    const message = `Hello from wallet ${walletAddress} at ${new Date().toISOString()}`;

    // 🔒 SECURITY NOTE: This only works for wallets created by YOUR authenticated client!
    // Dynamic Labs verifies:
    // 1. Your auth token (proves you're authorized)
    // 2. The wallet belongs to your environment
    // 3. Your client has the necessary key shares
    // 4. The password matches (if wallet was created with one)

    const signature = await evmClient.signMessage({
      message,
      accountAddress: walletAddress,
      password: password, // Additional security layer
    });

    console.log("✍️  Message signed:", message);
    console.log("🔏 Signature:", signature);

    // Verify the signature
    const isValid = await evmClient.verifyMessageSignature({
      accountAddress: walletAddress,
      message,
      signature,
    });

    console.log("✅ Signature verification:", isValid ? "Valid" : "Invalid");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Message signing failed:", errorMessage);
  }
}

// Prepare a transaction (demonstration only)
async function prepareTransaction(evmClient: any, walletAddress: string) {
  try {
    const { http } = await import('viem');
    const { base } = await import('viem/chains');
    const { parseEther } = await import('viem/utils');

    const publicClient = evmClient.createViemPublicClient({
      chain: base,
      rpcUrl: 'https://mainnet.base.org',
    });

    // Example transaction (sending 0.001 ETH)
    const transactionRequest = {
      to: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Null address for demo
      value: parseEther('0.001'),
    };

    const preparedTx = await publicClient.prepareTransactionRequest({
      ...transactionRequest,
      chain: base,
      account: walletAddress as `0x${string}`,
    });

    console.log("📝 Transaction prepared:", {
      to: preparedTx.to,
      value: preparedTx.value?.toString(),
      gas: preparedTx.gas?.toString(),
      gasPrice: preparedTx.gasPrice?.toString(),
    });

    console.log("ℹ️  Note: Transaction not sent - this is just preparation demo");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Transaction preparation failed:", errorMessage);
  }
}

// Demonstration of security - try to access a wallet you don't own
async function demonstrateSecurity() {
  console.log("\n🔒 Security Demonstration:");

  try {
    const evmClient = await authenticatedEvmClient();

    // Try to sign with a random wallet address (this will fail!)
    const randomWalletAddress = "0x742d35Cc64C1b0ED5bbE8db88b556F0f0b7E9999";

    console.log("🚨 Attempting to sign with unauthorized wallet:", randomWalletAddress);

    const signature = await evmClient.signMessage({
      message: "Unauthorized access attempt",
      accountAddress: randomWalletAddress,
      password: "any-password",
    });

    console.log("❌ This should not work!");

  } catch (error) {
    console.log("✅ Security working! Cannot access unauthorized wallet:");
    const errorMessage = error instanceof Error ? error.message : 'Access denied';
    console.log("   Error:", errorMessage);
  }
}

// Main function - demonstrates both creating new wallet and using existing wallet
async function main() {
  console.log("🚀 Starting wallet operations...\n");

  try {
    // Option 1: Create a new wallet
    console.log("=== Creating New Wallet ===");
    const newWallet = await createNewWallet("my-secure-password");
    // const newWallet2 = await createNewWallet("my-secure-password");
    // const newWallet3 = await createNewWallet("my-secure-password");

    console.log("\nNew Wallet Address:", newWallet);
    // Use the newly created wallet
    // console.log("\n=== Interacting with New Wallet ===");
    // await performWalletOperations("0x6465482b114FC64E2Bbd0DE02DA21A9A4854Bc4b", "my-secure-password");

    // Demonstrate security
    // await demonstrateSecurity();

    // Option 2: Use an existing wallet (comment out the above and use this instead)
    // console.log("\n=== Using Existing Wallet ===");
    // const existingWalletAddress = "0x6465482b114FC64E2Bbd0DE02DA21A9A4854Bc4b"; // Replace with your wallet address
    // const { evmClient } = await initializeExistingWallet(existingWalletAddress);
    // await performWalletOperations(existingWalletAddress, "my-secure-password");

  } catch (error) {
    console.error("❌ Main execution failed:", error);
  }
}

// Run the example
main();
