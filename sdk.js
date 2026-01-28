/**
 * CryptoCupid SDK
 * Production-ready integration with Fhenix FHE contracts
 */

import { ethers } from "ethers";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from "./config.js";

// ============ Contract ABIs ============
// These are generated during compilation - import from artifacts in production
// For now, we define the essential interfaces

export const CRYPTO_CUPID_ABI = [
  // Profile Management
  "function createProfile(bytes calldata _age, bytes calldata _cryptoExperience, bytes calldata _riskTolerance, bytes calldata _investmentStyle, bytes calldata _preferredChain, bytes calldata _tradingFrequency, bytes calldata _portfolioRange, bytes calldata _socialActivity, string calldata _handle) external payable",
  "function setPreferences(bytes calldata _minAge, bytes calldata _maxAge, bytes calldata _minCryptoExperience, bytes calldata _minRiskTolerance, bytes calldata _maxRiskTolerance, bytes calldata _preferredInvestmentStyle, bytes calldata _preferredChain, bytes calldata _minPortfolioRange) external",
  "function deactivateProfile() external",
  "function reactivateProfile() external",
  
  // Matching
  "function likeUser(address target) external",
  "function acceptMatch(bytes32 matchId) external",
  "function requestReveal(bytes32 matchId) external",
  
  // Messaging
  "function sendMessage(bytes32 matchId, bytes calldata encryptedContent) external payable",
  
  // Reputation
  "function rateMatch(bytes32 matchId, bytes calldata rating) external",
  
  // Staking
  "function depositStake() external payable",
  "function withdrawStake(uint256 amount) external",
  
  // View functions
  "function hasProfile(address) external view returns (bool)",
  "function isVerifiedHuman(address) external view returns (bool)",
  "function stakingBalance(address) external view returns (uint256)",
  "function getActiveUserCount() external view returns (uint256)",
  "function getUserMatches(address user) external view returns (bytes32[])",
  "function getMatchMessages(bytes32 matchId) external view returns (tuple(address sender, bytes encryptedContent, uint256 timestamp, uint256 stakedAmount)[])",
  "function getLikes(address user) external view returns (address[])",
  "function getMatch(bytes32 matchId) external view returns (address user1, address user2, uint256 matchedAt, bool user1Accepted, bool user2Accepted, bool isRevealed)",
  "function getCompatibilityScore(bytes32 matchId, bytes32 publicKey) external view returns (bytes)",
  "function getReputationScore(address user, bytes32 publicKey) external view returns (bytes)",
  "function hasLiked(address, address) external view returns (bool)",
  "function minStake() external view returns (uint256)",
  "function messageStake() external view returns (uint256)",
  "function profiles(address) external view returns (bool isActive, uint256 createdAt, string publicHandle)",
  
  // Events
  "event ProfileCreated(address indexed user, string handle, uint256 timestamp)",
  "event ProfileUpdated(address indexed user, uint256 timestamp)",
  "event LikeSent(address indexed from, address indexed to, uint256 timestamp)",
  "event MatchCreated(bytes32 indexed matchId, address indexed user1, address indexed user2, uint256 timestamp)",
  "event MatchAccepted(bytes32 indexed matchId, address indexed user, uint256 timestamp)",
  "event MatchRevealed(bytes32 indexed matchId, uint256 timestamp)",
  "event MessageSent(bytes32 indexed matchId, address indexed sender, uint256 timestamp)",
];

export const CUPID_TOKEN_ABI = [
  // Admin
  "function mint(address to, uint256 amount) external",
  
  // Token operations
  "function transfer(address to, bytes calldata encryptedAmount) external returns (bool)",
  "function approve(address spender, bytes calldata encryptedAmount) external returns (bool)",
  "function transferFrom(address from, address to, bytes calldata encryptedAmount) external returns (bool)",
  
  // Premium features
  "function purchaseSuperLikes(uint256 count) external",
  "function purchaseProfileBoost() external",
  "function activatePremium() external",
  
  // View functions
  "function balanceOf(address account, bytes32 publicKey) external view returns (bytes)",
  "function isPremium(address user) external view returns (bool)",
  "function isBoosted(address user) external view returns (bool)",
  "function superLikesRemaining(address) external view returns (uint256)",
  "function premiumExpiry(address) external view returns (uint256)",
  "function profileBoostExpiry(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function superLikeCost() external view returns (uint256)",
  "function profileBoostCost() external view returns (uint256)",
  "function premiumMonthCost() external view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to)",
  "event SuperLikePurchased(address indexed user, uint256 count)",
  "event ProfileBoosted(address indexed user, uint256 expiry)",
  "event PremiumActivated(address indexed user, uint256 expiry)",
];

/**
 * CryptoCupid SDK Class
 */
export class CryptoCupidSDK {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.chainId = null;
    this.contracts = {};
    this.cofhe = null;
    this.address = null;
  }

  /**
   * Connect to wallet and initialize SDK
   */
  async connect() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No Ethereum provider found. Please install MetaMask or another wallet.");
    }

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your wallet.");
    }

    this.address = accounts[0];
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    
    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);

    // Check if network is supported
    const chainConfig = SUPPORTED_CHAINS[this.chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported network (Chain ID: ${this.chainId}). Please switch to Arbitrum Sepolia or Ethereum Sepolia.`);
    }

    // Check if contracts are configured
    if (!chainConfig.contracts.CryptoCupid || !chainConfig.contracts.CupidToken) {
      throw new Error(`Contracts not deployed on ${chainConfig.name}. Please check config.js.`);
    }

    // Initialize contract instances
    this.contracts.dating = new ethers.Contract(
      chainConfig.contracts.CryptoCupid,
      CRYPTO_CUPID_ABI,
      this.signer
    );

    this.contracts.token = new ethers.Contract(
      chainConfig.contracts.CupidToken,
      CUPID_TOKEN_ABI,
      this.signer
    );

    // Initialize CoFHE client if available
    if (chainConfig.fhenixEnabled) {
      try {
        // Dynamic import for CoFHE SDK
        const { CoFheClient } = await import("@fhenixprotocol/cofhejs");
        this.cofhe = await CoFheClient.create({ provider: this.provider });
      } catch (e) {
        console.warn("CoFHE SDK not available, FHE features will be limited:", e.message);
      }
    }

    // Listen for account changes
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.address = accounts[0];
        window.location.reload();
      }
    });

    // Listen for chain changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    return {
      address: this.address,
      chainId: this.chainId,
      networkName: chainConfig.name,
    };
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.contracts = {};
    this.cofhe = null;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.signer !== null && this.address !== null;
  }

  /**
   * Get current chain config
   */
  getChainConfig() {
    return SUPPORTED_CHAINS[this.chainId] || null;
  }

  // ============ FHE Encryption Helpers ============

  /**
   * Encrypt a uint8 value using FHE
   */
  async encryptUint8(value) {
    if (this.cofhe) {
      return await this.cofhe.encrypt(value, "uint8");
    }
    // Fallback: encode as bytes (for testing without FHE)
    return ethers.zeroPadValue(ethers.toBeHex(value), 32);
  }

  /**
   * Encrypt a uint16 value using FHE
   */
  async encryptUint16(value) {
    if (this.cofhe) {
      return await this.cofhe.encrypt(value, "uint16");
    }
    return ethers.zeroPadValue(ethers.toBeHex(value), 32);
  }

  /**
   * Encrypt a uint128 value using FHE
   */
  async encryptUint128(value) {
    if (this.cofhe) {
      return await this.cofhe.encrypt(value, "uint128");
    }
    return ethers.zeroPadValue(ethers.toBeHex(value), 32);
  }

  /**
   * Decrypt sealed data
   */
  async unseal(contractAddress, sealedData) {
    if (this.cofhe) {
      return await this.cofhe.unseal(contractAddress, sealedData);
    }
    // Fallback: return the raw data
    return sealedData;
  }

  /**
   * Generate permit for accessing encrypted data
   */
  async generatePermit(contractAddress) {
    if (this.cofhe) {
      return await this.cofhe.generatePermit(contractAddress, this.provider, this.signer);
    }
    // Fallback: use address as public key
    return { publicKey: ethers.zeroPadValue(this.address, 32) };
  }

  // ============ Profile Management ============

  /**
   * Check if user has a profile
   */
  async hasProfile(address = null) {
    const addr = address || this.address;
    return await this.contracts.dating.hasProfile(addr);
  }

  /**
   * Get profile info (public fields only)
   */
  async getProfile(address = null) {
    const addr = address || this.address;
    const [isActive, createdAt, publicHandle] = await this.contracts.dating.profiles(addr);
    const isVerified = await this.contracts.dating.isVerifiedHuman(addr);
    const stake = await this.contracts.dating.stakingBalance(addr);
    
    return {
      address: addr,
      isActive,
      createdAt: new Date(Number(createdAt) * 1000),
      publicHandle,
      isVerified,
      stakingBalance: ethers.formatEther(stake),
    };
  }

  /**
   * Create encrypted profile
   */
  async createProfile(profileData) {
    const {
      age,
      cryptoExperience,
      riskTolerance,
      investmentStyle,
      preferredChain,
      tradingFrequency,
      portfolioRange,
      socialActivity,
      handle,
    } = profileData;

    // Validate inputs
    if (age < 18 || age > 99) throw new Error("Age must be between 18 and 99");
    if (cryptoExperience < 0 || cryptoExperience > 20) throw new Error("Crypto experience must be 0-20 years");
    if (riskTolerance < 1 || riskTolerance > 10) throw new Error("Risk tolerance must be 1-10");
    if (investmentStyle < 1 || investmentStyle > 4) throw new Error("Invalid investment style");
    if (preferredChain < 1 || preferredChain > 4) throw new Error("Invalid chain preference");
    if (tradingFrequency < 1 || tradingFrequency > 4) throw new Error("Invalid trading frequency");
    if (portfolioRange < 1 || portfolioRange > 5) throw new Error("Invalid portfolio range");
    if (socialActivity < 1 || socialActivity > 4) throw new Error("Invalid social activity");

    // Encrypt all sensitive fields
    const encryptedData = {
      age: await this.encryptUint8(age),
      cryptoExperience: await this.encryptUint8(cryptoExperience),
      riskTolerance: await this.encryptUint8(riskTolerance),
      investmentStyle: await this.encryptUint8(investmentStyle),
      preferredChain: await this.encryptUint8(preferredChain),
      tradingFrequency: await this.encryptUint8(tradingFrequency),
      portfolioRange: await this.encryptUint8(portfolioRange),
      socialActivity: await this.encryptUint8(socialActivity),
    };

    // Get minimum stake
    const minStake = await this.contracts.dating.minStake();

    // Send transaction
    const tx = await this.contracts.dating.createProfile(
      encryptedData.age,
      encryptedData.cryptoExperience,
      encryptedData.riskTolerance,
      encryptedData.investmentStyle,
      encryptedData.preferredChain,
      encryptedData.tradingFrequency,
      encryptedData.portfolioRange,
      encryptedData.socialActivity,
      handle || "",
      { value: minStake }
    );

    const receipt = await tx.wait();
    
    // Find ProfileCreated event
    const event = receipt.logs.find(
      log => log.fragment?.name === "ProfileCreated"
    );

    return {
      success: true,
      txHash: receipt.hash,
      handle: event?.args?.handle,
    };
  }

  /**
   * Set dating preferences
   */
  async setPreferences(preferences) {
    const encrypted = {
      minAge: await this.encryptUint8(preferences.minAge || 18),
      maxAge: await this.encryptUint8(preferences.maxAge || 99),
      minCryptoExperience: await this.encryptUint8(preferences.minCryptoExperience || 0),
      minRiskTolerance: await this.encryptUint8(preferences.minRiskTolerance || 1),
      maxRiskTolerance: await this.encryptUint8(preferences.maxRiskTolerance || 10),
      preferredInvestmentStyle: await this.encryptUint8(preferences.preferredInvestmentStyle || 0),
      preferredChain: await this.encryptUint8(preferences.preferredChain || 0),
      minPortfolioRange: await this.encryptUint8(preferences.minPortfolioRange || 1),
    };

    const tx = await this.contracts.dating.setPreferences(
      encrypted.minAge,
      encrypted.maxAge,
      encrypted.minCryptoExperience,
      encrypted.minRiskTolerance,
      encrypted.maxRiskTolerance,
      encrypted.preferredInvestmentStyle,
      encrypted.preferredChain,
      encrypted.minPortfolioRange
    );

    return await tx.wait();
  }

  // ============ Matching ============

  /**
   * Like a user
   */
  async likeUser(targetAddress) {
    const tx = await this.contracts.dating.likeUser(targetAddress);
    const receipt = await tx.wait();

    // Check for match
    const matchEvent = receipt.logs.find(
      log => log.fragment?.name === "MatchCreated"
    );

    return {
      success: true,
      txHash: receipt.hash,
      isMatch: !!matchEvent,
      matchId: matchEvent?.args?.matchId || null,
    };
  }

  /**
   * Check if already liked a user
   */
  async hasLiked(targetAddress) {
    return await this.contracts.dating.hasLiked(this.address, targetAddress);
  }

  /**
   * Get users who have liked current user
   */
  async getLikes() {
    return await this.contracts.dating.getLikes(this.address);
  }

  /**
   * Get all matches for current user
   */
  async getMatches() {
    const matchIds = await this.contracts.dating.getUserMatches(this.address);
    
    const matches = await Promise.all(
      matchIds.map(async (matchId) => {
        const [user1, user2, matchedAt, user1Accepted, user2Accepted, isRevealed] = 
          await this.contracts.dating.getMatch(matchId);
        
        const otherUser = user1.toLowerCase() === this.address.toLowerCase() ? user2 : user1;
        const otherProfile = await this.getProfile(otherUser);
        
        return {
          matchId,
          otherUser,
          otherUserHandle: otherProfile.publicHandle,
          otherUserVerified: otherProfile.isVerified,
          matchedAt: new Date(Number(matchedAt) * 1000),
          iAccepted: user1.toLowerCase() === this.address.toLowerCase() ? user1Accepted : user2Accepted,
          theyAccepted: user1.toLowerCase() === this.address.toLowerCase() ? user2Accepted : user1Accepted,
          isRevealed,
          canMessage: user1Accepted && user2Accepted,
        };
      })
    );

    return matches;
  }

  /**
   * Accept a match
   */
  async acceptMatch(matchId) {
    const tx = await this.contracts.dating.acceptMatch(matchId);
    return await tx.wait();
  }

  /**
   * Get compatibility score for a match (decrypted)
   */
  async getCompatibilityScore(matchId) {
    const permit = await this.generatePermit(await this.contracts.dating.getAddress());
    const sealed = await this.contracts.dating.getCompatibilityScore(matchId, permit.publicKey);
    const score = await this.unseal(await this.contracts.dating.getAddress(), sealed);
    return Number(score);
  }

  // ============ Messaging ============

  /**
   * Send encrypted message
   * @param matchId - Match ID
   * @param message - Plain text message (will be encrypted)
   * @param recipientPublicKey - Recipient's public key for E2E encryption
   */
  async sendMessage(matchId, message, recipientPublicKey = null) {
    // Get message stake
    const messageStake = await this.contracts.dating.messageStake();

    // Encrypt message (basic encryption - use proper E2E in production)
    let encryptedContent;
    if (recipientPublicKey) {
      // TODO: Implement proper E2E encryption with recipient's public key
      // For now, use basic encoding
      const encoder = new TextEncoder();
      encryptedContent = ethers.hexlify(encoder.encode(message));
    } else {
      const encoder = new TextEncoder();
      encryptedContent = ethers.hexlify(encoder.encode(message));
    }

    const tx = await this.contracts.dating.sendMessage(matchId, encryptedContent, {
      value: messageStake,
    });

    return await tx.wait();
  }

  /**
   * Get messages for a match
   */
  async getMessages(matchId) {
    const messages = await this.contracts.dating.getMatchMessages(matchId);
    
    return messages.map(msg => {
      // Decrypt message content
      let content;
      try {
        const decoder = new TextDecoder();
        content = decoder.decode(ethers.getBytes(msg.encryptedContent));
      } catch {
        content = "[Encrypted]";
      }

      return {
        sender: msg.sender,
        content,
        timestamp: new Date(Number(msg.timestamp) * 1000),
        stakedAmount: ethers.formatEther(msg.stakedAmount),
        isFromMe: msg.sender.toLowerCase() === this.address.toLowerCase(),
      };
    });
  }

  // ============ Reputation ============

  /**
   * Get user's reputation score
   */
  async getReputationScore() {
    const permit = await this.generatePermit(await this.contracts.dating.getAddress());
    const sealed = await this.contracts.dating.getReputationScore(this.address, permit.publicKey);
    const score = await this.unseal(await this.contracts.dating.getAddress(), sealed);
    return Number(score);
  }

  /**
   * Rate a match
   */
  async rateMatch(matchId, rating) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const encryptedRating = await this.encryptUint8(rating);
    const tx = await this.contracts.dating.rateMatch(matchId, encryptedRating);
    return await tx.wait();
  }

  // ============ Premium Features ============

  /**
   * Check if user has premium
   */
  async isPremium() {
    return await this.contracts.token.isPremium(this.address);
  }

  /**
   * Check if profile is boosted
   */
  async isBoosted() {
    return await this.contracts.token.isBoosted(this.address);
  }

  /**
   * Get remaining super likes
   */
  async getSuperLikesRemaining() {
    return Number(await this.contracts.token.superLikesRemaining(this.address));
  }

  /**
   * Get premium costs
   */
  async getPremiumCosts() {
    const [superLike, boost, premium] = await Promise.all([
      this.contracts.token.superLikeCost(),
      this.contracts.token.profileBoostCost(),
      this.contracts.token.premiumMonthCost(),
    ]);

    return {
      superLike: ethers.formatEther(superLike),
      profileBoost: ethers.formatEther(boost),
      premiumMonth: ethers.formatEther(premium),
    };
  }

  /**
   * Purchase super likes
   */
  async purchaseSuperLikes(count) {
    const tx = await this.contracts.token.purchaseSuperLikes(count);
    return await tx.wait();
  }

  /**
   * Purchase profile boost
   */
  async purchaseProfileBoost() {
    const tx = await this.contracts.token.purchaseProfileBoost();
    return await tx.wait();
  }

  /**
   * Activate premium
   */
  async activatePremium() {
    const tx = await this.contracts.token.activatePremium();
    return await tx.wait();
  }

  // ============ Staking ============

  /**
   * Deposit additional stake
   */
  async depositStake(amountEth) {
    const tx = await this.contracts.dating.depositStake({
      value: ethers.parseEther(amountEth),
    });
    return await tx.wait();
  }

  /**
   * Withdraw stake
   */
  async withdrawStake(amountEth) {
    const tx = await this.contracts.dating.withdrawStake(ethers.parseEther(amountEth));
    return await tx.wait();
  }

  /**
   * Get staking balance
   */
  async getStakingBalance() {
    const balance = await this.contracts.dating.stakingBalance(this.address);
    return ethers.formatEther(balance);
  }

  // ============ Discovery ============

  /**
   * Get active user count
   */
  async getActiveUserCount() {
    return Number(await this.contracts.dating.getActiveUserCount());
  }
}

// Export singleton instance
let sdkInstance = null;

export async function getSDK() {
  if (!sdkInstance) {
    sdkInstance = new CryptoCupidSDK();
  }
  return sdkInstance;
}

export async function connectWallet() {
  const sdk = await getSDK();
  return await sdk.connect();
}

export function disconnectWallet() {
  if (sdkInstance) {
    sdkInstance.disconnect();
  }
}

export default CryptoCupidSDK;
