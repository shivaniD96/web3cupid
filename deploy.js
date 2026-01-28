const { ethers } = require("hardhat");
const fs = require("fs");

// ============ DEPLOYMENT CONFIGURATION ============
// Modify these values before deploying

const CONFIG = {
  // CryptoCupid parameters
  minStake: ethers.parseEther("0.001"),        // 0.001 ETH minimum stake
  messageStake: ethers.parseEther("0.0001"),   // 0.0001 ETH per message
  
  // Set to address(0) initially, update after setting up oracle
  // For testing, you can use deployer address
  verificationOracle: null, // Will use deployer if null
  
  // CupidToken parameters (in wei, 18 decimals)
  superLikeCost: ethers.parseEther("10"),      // 10 CUPID per super like
  profileBoostCost: ethers.parseEther("50"),   // 50 CUPID per boost
  revealPreferenceCost: ethers.parseEther("25"), // 25 CUPID to reveal
  premiumMonthCost: ethers.parseEther("100"),  // 100 CUPID per month
  
  // Initial token mint (for airdrops, liquidity, team)
  initialMint: ethers.parseEther("1000000"),   // 1M tokens
  
  // Whether to mint initial tokens to deployer
  mintToDeployer: true,
};

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           💘 CryptoCupid Deployment Script 💘                ║");
  console.log("║         Privacy-Preserving Dating on Fhenix FHE              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Configuration:");
  console.log("━".repeat(60));
  console.log(`   Network:          ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Deployer:         ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance:          ${ethers.formatEther(balance)} ETH`);
  console.log("━".repeat(60));
  console.log(`   Min Stake:        ${ethers.formatEther(CONFIG.minStake)} ETH`);
  console.log(`   Message Stake:    ${ethers.formatEther(CONFIG.messageStake)} ETH`);
  console.log(`   Super Like Cost:  ${ethers.formatEther(CONFIG.superLikeCost)} CUPID`);
  console.log(`   Boost Cost:       ${ethers.formatEther(CONFIG.profileBoostCost)} CUPID`);
  console.log(`   Premium Cost:     ${ethers.formatEther(CONFIG.premiumMonthCost)} CUPID`);
  console.log(`   Initial Mint:     ${ethers.formatEther(CONFIG.initialMint)} CUPID`);
  console.log("━".repeat(60));
  console.log("\n");

  // Use deployer as verification oracle if not specified
  const verificationOracle = CONFIG.verificationOracle || deployer.address;
  console.log(`⚠️  Verification Oracle: ${verificationOracle}`);
  if (verificationOracle === deployer.address) {
    console.log("   (Using deployer - update this for production!)\n");
  }

  // Deploy CryptoCupid
  console.log("📝 [1/3] Deploying CryptoCupid contract...");
  const CryptoCupid = await ethers.getContractFactory("CryptoCupid");
  const cryptoCupid = await CryptoCupid.deploy(
    CONFIG.minStake,
    CONFIG.messageStake,
    verificationOracle
  );
  await cryptoCupid.waitForDeployment();
  const cupidAddress = await cryptoCupid.getAddress();
  console.log(`   ✅ CryptoCupid deployed to: ${cupidAddress}\n`);

  // Deploy CupidToken
  console.log("📝 [2/3] Deploying CupidToken contract...");
  const CupidToken = await ethers.getContractFactory("CupidToken");
  const cupidToken = await CupidToken.deploy(
    cupidAddress,
    CONFIG.superLikeCost,
    CONFIG.profileBoostCost,
    CONFIG.revealPreferenceCost,
    CONFIG.premiumMonthCost
  );
  await cupidToken.waitForDeployment();
  const tokenAddress = await cupidToken.getAddress();
  console.log(`   ✅ CupidToken deployed to: ${tokenAddress}\n`);

  // Mint initial tokens
  if (CONFIG.mintToDeployer && CONFIG.initialMint > 0) {
    console.log("📝 [3/3] Minting initial CUPID tokens...");
    const mintTx = await cupidToken.mint(deployer.address, CONFIG.initialMint);
    await mintTx.wait();
    console.log(`   ✅ Minted ${ethers.formatEther(CONFIG.initialMint)} CUPID to ${deployer.address}\n`);
  } else {
    console.log("📝 [3/3] Skipping initial mint\n");
  }

  // Generate deployment summary
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    🎉 Deployment Complete!                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\n📋 Contract Addresses:");
  console.log(`   CryptoCupid: ${cupidAddress}`);
  console.log(`   CupidToken:  ${tokenAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CryptoCupid: {
        address: cupidAddress,
        params: {
          minStake: CONFIG.minStake.toString(),
          messageStake: CONFIG.messageStake.toString(),
          verificationOracle: verificationOracle,
        }
      },
      CupidToken: {
        address: tokenAddress,
        params: {
          superLikeCost: CONFIG.superLikeCost.toString(),
          profileBoostCost: CONFIG.profileBoostCost.toString(),
          revealPreferenceCost: CONFIG.revealPreferenceCost.toString(),
          premiumMonthCost: CONFIG.premiumMonthCost.toString(),
          initialMint: CONFIG.initialMint.toString(),
        }
      }
    },
  };

  // Save to deployments folder
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const fileName = `${deploymentsDir}/${network.chainId}-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment saved to: ${fileName}`);

  // Generate frontend config
  const frontendConfig = `// Auto-generated - ${new Date().toISOString()}
// Network: ${network.name} (Chain ID: ${network.chainId})

export const CONTRACTS = {
  CryptoCupid: "${cupidAddress}",
  CupidToken: "${tokenAddress}",
};

export const CHAIN_ID = ${network.chainId};
export const NETWORK_NAME = "${network.name}";
`;

  const frontendConfigPath = `./frontend/config.${network.chainId}.js`;
  fs.writeFileSync(frontendConfigPath, frontendConfig);
  console.log(`📁 Frontend config saved to: ${frontendConfigPath}`);

  // Verification commands
  console.log("\n📝 Verification Commands:");
  console.log("━".repeat(60));
  console.log(`npx hardhat verify --network ${network.name} ${cupidAddress} \\`);
  console.log(`  "${CONFIG.minStake}" \\`);
  console.log(`  "${CONFIG.messageStake}" \\`);
  console.log(`  "${verificationOracle}"`);
  console.log("");
  console.log(`npx hardhat verify --network ${network.name} ${tokenAddress} \\`);
  console.log(`  "${cupidAddress}" \\`);
  console.log(`  "${CONFIG.superLikeCost}" \\`);
  console.log(`  "${CONFIG.profileBoostCost}" \\`);
  console.log(`  "${CONFIG.revealPreferenceCost}" \\`);
  console.log(`  "${CONFIG.premiumMonthCost}"`);
  
  console.log("\n📝 Next Steps:");
  console.log("━".repeat(60));
  console.log("1. Verify contracts on block explorer (commands above)");
  console.log("2. Update frontend/config.js with the generated config");
  console.log("3. Set up Worldcoin/Gitcoin verification oracle");
  console.log("4. Fund the oracle address for gas");
  console.log("5. Test profile creation on testnet");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
