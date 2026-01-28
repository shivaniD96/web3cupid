// ============ DEPLOYMENT CONFIG ============
// Update these values after deploying contracts

// Supported networks and their contract addresses
export const SUPPORTED_CHAINS = {
  // Arbitrum Sepolia (testnet)
  421614: {
    name: "Arbitrum Sepolia",
    contracts: {
      CryptoCupid: "", // Fill after deployment
      CupidToken: "",  // Fill after deployment
    },
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    fhenixEnabled: true,
  },
  // Ethereum Sepolia (testnet)
  11155111: {
    name: "Ethereum Sepolia",
    contracts: {
      CryptoCupid: "", // Fill after deployment
      CupidToken: "",  // Fill after deployment
    },
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    fhenixEnabled: true,
  },
  // Local development
  31337: {
    name: "Local Hardhat",
    contracts: {
      CryptoCupid: "", // Fill after local deployment
      CupidToken: "",
    },
    rpcUrl: "http://localhost:8545",
    blockExplorer: "",
    fhenixEnabled: false,
  },
};

// Default chain for development
export const DEFAULT_CHAIN_ID = 421614;

// App metadata
export const APP_CONFIG = {
  name: "CryptoCupid",
  description: "Privacy-Preserving Dating for Crypto Folks",
  url: "https://cryptocupid.xyz",
  icons: ["https://cryptocupid.xyz/icon.png"],
};

// WalletConnect project ID (get from cloud.walletconnect.com)
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Feature flags
export const FEATURES = {
  enablePremium: true,
  enableMessaging: true,
  enableVerification: true,
  debugMode: process.env.NODE_ENV === "development",
};
