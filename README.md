# 💘 CryptoCupid

**Privacy-Preserving Dating for Crypto Natives**

The first dating app where your preferences stay encrypted, matching happens on encrypted data, and privacy is the default—powered by [Fhenix](https://fhenix.io) Fully Homomorphic Encryption.

---

## 🚀 Quick Start (Deploy Today)

### Prerequisites

- Node.js v18+
- A wallet with testnet ETH ([Arbitrum Sepolia Faucet](https://faucet.arbitrum.io/))
- ~0.01 ETH for deployment gas

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/crypto-cupid.git
cd crypto-cupid
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your **private key** (the wallet that will deploy):

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
```

### 3. Deploy to Testnet

```bash
# Compile contracts
npm run compile

# Deploy to Arbitrum Sepolia
npm run deploy:arb-sepolia
```

You'll see output like:
```
✅ CryptoCupid deployed to: 0x1234...
✅ CupidToken deployed to: 0x5678...
📁 Frontend config saved to: ./frontend/config.421614.js
```

### 4. Update Frontend Config

The deployment script auto-generates `frontend/config.421614.js`. Copy the addresses to `frontend/config.js`:

```javascript
// frontend/config.js
export const SUPPORTED_CHAINS = {
  421614: {
    name: "Arbitrum Sepolia",
    contracts: {
      CryptoCupid: "0x1234...", // Your deployed address
      CupidToken: "0x5678...",  // Your deployed address
    },
    // ...
  },
};
```

### 5. Run Frontend

The frontend is a single React component. Integrate it into your React app:

```bash
# If using Next.js or Vite
npm install ethers@^6.9.0 lucide-react

# Copy frontend files to your project
cp frontend/* your-app/src/
```

---

## 📋 Deployment Configuration

Edit `scripts/deploy.js` to customize:

```javascript
const CONFIG = {
  minStake: ethers.parseEther("0.001"),      // Profile creation stake
  messageStake: ethers.parseEther("0.0001"), // Per-message stake
  superLikeCost: ethers.parseEther("10"),    // 10 CUPID tokens
  profileBoostCost: ethers.parseEther("50"), // 50 CUPID tokens
  premiumMonthCost: ethers.parseEther("100"), // 100 CUPID tokens
  initialMint: ethers.parseEther("1000000"), // Initial token supply
};
```

---

## 🔐 How FHE Privacy Works

| Data | Storage | Who Can See |
|------|---------|-------------|
| Age | Encrypted on-chain | Only you |
| Wealth/Portfolio | Encrypted on-chain | Only you |
| Preferences | Encrypted on-chain | Only you |
| Compatibility Score | Computed on encrypted data | Both matched users |
| Messages | E2E encrypted | Sender & recipient |

**Matching Flow:**
1. You submit encrypted preferences
2. Contract computes compatibility on **encrypted data**
3. Only if both users "like" each other, they see the match
4. Compatibility score revealed only to matched pair

---

## 📁 Project Structure

```
crypto-cupid/
├── contracts/
│   ├── CryptoCupid.sol    # Main dating contract (profiles, matching, messages)
│   └── CupidToken.sol     # Premium features token (encrypted balances)
├── frontend/
│   ├── CryptoCupid.jsx    # React app component
│   ├── sdk.js             # Contract integration SDK
│   └── config.js          # Network & contract configuration
├── scripts/
│   ├── deploy.js          # Deployment script with config
│   └── generate-abi.js    # ABI extraction for frontend
├── test/
│   └── CryptoCupid.test.js
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## 🔧 Contract Functions

### Profile Management
- `createProfile(...)` - Create encrypted profile (requires stake)
- `setPreferences(...)` - Set encrypted dating preferences
- `deactivateProfile()` / `reactivateProfile()`

### Matching
- `likeUser(address)` - Like a user (creates match if mutual)
- `acceptMatch(matchId)` - Accept a match to enable messaging
- `getCompatibilityScore(matchId, publicKey)` - Get sealed score

### Messaging
- `sendMessage(matchId, encryptedContent)` - Send encrypted message (requires stake)
- `getMatchMessages(matchId)` - Get all messages for a match

### Premium (CupidToken)
- `purchaseSuperLikes(count)` - Buy super likes
- `purchaseProfileBoost()` - 24h visibility boost
- `activatePremium()` - 30-day premium subscription

---

## 🛡️ Security Checklist

Before mainnet:

- [ ] Audit smart contracts
- [ ] Set up proper verification oracle (Worldcoin/Gitcoin)
- [ ] Implement proper E2E message encryption
- [ ] Add rate limiting
- [ ] Set up monitoring & alerts
- [ ] Multi-sig for admin functions

---

## 🌐 Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Arbitrum Sepolia | 421614 | ✅ Ready |
| Ethereum Sepolia | 11155111 | ✅ Ready |
| Arbitrum One | 42161 | 🔜 Mainnet |
| Ethereum | 1 | 🔜 Mainnet |

---

## 📝 Verify Contracts

After deployment:

```bash
# CryptoCupid
npx hardhat verify --network arbitrumSepolia <CRYPTO_CUPID_ADDRESS> \
  "1000000000000000" "100000000000000" "<DEPLOYER_ADDRESS>"

# CupidToken
npx hardhat verify --network arbitrumSepolia <CUPID_TOKEN_ADDRESS> \
  "<CRYPTO_CUPID_ADDRESS>" "10000000000000000000" "50000000000000000000" \
  "25000000000000000000" "100000000000000000000"
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open PR

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

<p align="center">
  <b>Built with 💘 and 🔐</b><br>
  <i>Powered by Fhenix FHE</i>
</p>
