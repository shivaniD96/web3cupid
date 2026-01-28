// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, euint128, ebool, Common} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint128} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

/**
 * @title CupidToken - FHE-Encrypted Dating App Token
 * @notice Privacy-preserving token for CryptoCupid premium features
 * @dev Implements encrypted balances using Fhenix FHE
 */
contract CupidToken {
    
    string public constant name = "Cupid Token";
    string public constant symbol = "CUPID";
    uint8 public constant decimals = 18;
    
    // Encrypted balances
    mapping(address => euint128) internal _encryptedBalances;
    mapping(address => mapping(address => euint128)) internal _encryptedAllowances;
    
    // Public total supply for transparency
    uint256 public totalSupply;
    
    // Premium feature costs (configurable)
    uint256 public superLikeCost;
    uint256 public profileBoostCost;
    uint256 public revealPreferenceCost;
    uint256 public premiumMonthCost;
    
    // Feature durations (configurable)
    uint256 public boostDuration;
    uint256 public premiumDuration;
    
    // Feature tracking
    mapping(address => uint256) public premiumExpiry;
    mapping(address => uint256) public superLikesRemaining;
    mapping(address => uint256) public profileBoostExpiry;
    
    address public datingContract;
    address public owner;
    
    // Events
    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event SuperLikePurchased(address indexed user, uint256 count);
    event ProfileBoosted(address indexed user, uint256 expiry);
    event PremiumActivated(address indexed user, uint256 expiry);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CostsUpdated(uint256 superLike, uint256 boost, uint256 reveal, uint256 premium);
    event DurationsUpdated(uint256 boostDuration, uint256 premiumDuration);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice Deploy CupidToken with configurable parameters
     * @param _datingContract Address of the CryptoCupid contract
     * @param _superLikeCost Cost in tokens for a super like
     * @param _profileBoostCost Cost in tokens for a profile boost
     * @param _premiumMonthCost Cost in tokens for premium subscription
     */
    constructor(
        address _datingContract,
        uint256 _superLikeCost,
        uint256 _profileBoostCost,
        uint256 _revealPreferenceCost,
        uint256 _premiumMonthCost
    ) {
        owner = msg.sender;
        datingContract = _datingContract;
        superLikeCost = _superLikeCost;
        profileBoostCost = _profileBoostCost;
        revealPreferenceCost = _revealPreferenceCost;
        premiumMonthCost = _premiumMonthCost;
        boostDuration = 24 hours;
        premiumDuration = 30 days;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice Update feature costs
     */
    function updateCosts(
        uint256 _superLikeCost,
        uint256 _profileBoostCost,
        uint256 _revealPreferenceCost,
        uint256 _premiumMonthCost
    ) external onlyOwner {
        superLikeCost = _superLikeCost;
        profileBoostCost = _profileBoostCost;
        revealPreferenceCost = _revealPreferenceCost;
        premiumMonthCost = _premiumMonthCost;
        emit CostsUpdated(_superLikeCost, _profileBoostCost, _revealPreferenceCost, _premiumMonthCost);
    }
    
    /**
     * @notice Update feature durations
     */
    function updateDurations(uint256 _boostDuration, uint256 _premiumDuration) external onlyOwner {
        boostDuration = _boostDuration;
        premiumDuration = _premiumDuration;
        emit DurationsUpdated(_boostDuration, _premiumDuration);
    }
    
    /**
     * @notice Mint tokens to an address (encrypted)
     * @param to Recipient address
     * @param amount Amount to mint (will be encrypted)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        euint128 encAmount = FHE.asEuint128(uint128(amount));
        
        if (!Common.isInitialized(_encryptedBalances[to])) {
            _encryptedBalances[to] = encAmount;
        } else {
            _encryptedBalances[to] = FHE.add(_encryptedBalances[to], encAmount);
        }
        
        // Set permissions
        FHE.allowThis(_encryptedBalances[to]);
        FHE.allow(_encryptedBalances[to], to);
        
        totalSupply += amount;
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice Transfer tokens (encrypted amounts)
     * @param to Recipient address
     * @param encryptedAmount Encrypted transfer amount
     */
    function transfer(address to, InEuint128 memory encryptedAmount) external returns (bool) {
        require(to != address(0), "Transfer to zero address");
        
        euint128 amount = FHE.asEuint128(encryptedAmount);
        
        // Check sufficient balance (encrypted comparison)
        ebool hasEnough = FHE.gte(_encryptedBalances[msg.sender], amount);
        
        // Conditional transfer
        euint128 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint128(0));
        
        // Update balances
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], transferAmount);
        
        if (!Common.isInitialized(_encryptedBalances[to])) {
            _encryptedBalances[to] = transferAmount;
        } else {
            _encryptedBalances[to] = FHE.add(_encryptedBalances[to], transferAmount);
        }
        
        // Set permissions
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allowThis(_encryptedBalances[to]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        FHE.allow(_encryptedBalances[to], to);
        
        emit Transfer(msg.sender, to);
        return true;
    }
    
    /**
     * @notice Approve spender for encrypted amount
     */
    function approve(address spender, InEuint128 memory encryptedAmount) external returns (bool) {
        require(spender != address(0), "Approve to zero address");
        
        _encryptedAllowances[msg.sender][spender] = FHE.asEuint128(encryptedAmount);
        
        FHE.allowThis(_encryptedAllowances[msg.sender][spender]);
        FHE.allow(_encryptedAllowances[msg.sender][spender], msg.sender);
        FHE.allow(_encryptedAllowances[msg.sender][spender], spender);
        
        emit Approval(msg.sender, spender);
        return true;
    }
    
    /**
     * @notice Transfer from with encrypted amounts
     */
    function transferFrom(
        address from,
        address to,
        InEuint128 memory encryptedAmount
    ) external returns (bool) {
        require(to != address(0), "Transfer to zero address");
        
        euint128 amount = FHE.asEuint128(encryptedAmount);
        
        // Check allowance
        ebool hasAllowance = FHE.gte(_encryptedAllowances[from][msg.sender], amount);
        ebool hasBalance = FHE.gte(_encryptedBalances[from], amount);
        ebool canTransfer = FHE.and(hasAllowance, hasBalance);
        
        euint128 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint128(0));
        
        // Update balances and allowances
        _encryptedBalances[from] = FHE.sub(_encryptedBalances[from], transferAmount);
        _encryptedAllowances[from][msg.sender] = FHE.sub(_encryptedAllowances[from][msg.sender], transferAmount);
        
        if (!Common.isInitialized(_encryptedBalances[to])) {
            _encryptedBalances[to] = transferAmount;
        } else {
            _encryptedBalances[to] = FHE.add(_encryptedBalances[to], transferAmount);
        }
        
        // Set permissions
        FHE.allowThis(_encryptedBalances[from]);
        FHE.allowThis(_encryptedBalances[to]);
        FHE.allowThis(_encryptedAllowances[from][msg.sender]);
        FHE.allow(_encryptedBalances[from], from);
        FHE.allow(_encryptedBalances[to], to);
        
        emit Transfer(from, to);
        return true;
    }
    
    /**
     * @notice Get encrypted balance hash
     */
    function balanceOfHash(address account) external view returns (uint256) {
        require(msg.sender == account, "Can only view own balance");
        return euint128.unwrap(_encryptedBalances[account]);
    }

    /**
     * @notice Request async decryption of balance
     */
    function requestBalanceDecrypt() external {
        FHE.decrypt(_encryptedBalances[msg.sender]);
    }

    /**
     * @notice Get encrypted allowance hash
     */
    function allowanceHash(address _owner, address spender) external view returns (uint256) {
        require(msg.sender == _owner || msg.sender == spender, "Not authorized");
        return euint128.unwrap(_encryptedAllowances[_owner][spender]);
    }

    /**
     * @notice Request async decryption of allowance
     */
    function requestAllowanceDecrypt(address spender) external {
        FHE.decrypt(_encryptedAllowances[msg.sender][spender]);
    }
    
    // ============ Premium Features ============
    
    /**
     * @notice Purchase super likes with encrypted token payment
     * @param count Number of super likes to purchase
     */
    function purchaseSuperLikes(uint256 count) external {
        uint256 cost = count * superLikeCost;
        euint128 encCost = FHE.asEuint128(uint128(cost));
        
        // Check balance
        ebool hasEnough = FHE.gte(_encryptedBalances[msg.sender], encCost);
        euint128 burnAmount = FHE.select(hasEnough, encCost, FHE.asEuint128(0));
        
        // Burn tokens
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], burnAmount);
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        
        // Grant super likes (this happens regardless, relying on FHE for correctness)
        superLikesRemaining[msg.sender] += count;
        totalSupply -= cost;
        
        emit SuperLikePurchased(msg.sender, count);
        emit TokensBurned(msg.sender, cost);
    }
    
    /**
     * @notice Boost profile visibility for configured duration
     */
    function purchaseProfileBoost() external {
        euint128 encCost = FHE.asEuint128(uint128(profileBoostCost));
        
        ebool hasEnough = FHE.gte(_encryptedBalances[msg.sender], encCost);
        euint128 burnAmount = FHE.select(hasEnough, encCost, FHE.asEuint128(0));
        
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], burnAmount);
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        
        profileBoostExpiry[msg.sender] = block.timestamp + boostDuration;
        totalSupply -= profileBoostCost;
        
        emit ProfileBoosted(msg.sender, profileBoostExpiry[msg.sender]);
        emit TokensBurned(msg.sender, profileBoostCost);
    }
    
    /**
     * @notice Activate premium subscription for configured duration
     */
    function activatePremium() external {
        euint128 encCost = FHE.asEuint128(uint128(premiumMonthCost));
        
        ebool hasEnough = FHE.gte(_encryptedBalances[msg.sender], encCost);
        euint128 burnAmount = FHE.select(hasEnough, encCost, FHE.asEuint128(0));
        
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], burnAmount);
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        
        uint256 newExpiry = block.timestamp + premiumDuration;
        if (premiumExpiry[msg.sender] > block.timestamp) {
            newExpiry = premiumExpiry[msg.sender] + premiumDuration;
        }
        premiumExpiry[msg.sender] = newExpiry;
        totalSupply -= premiumMonthCost;
        
        emit PremiumActivated(msg.sender, newExpiry);
        emit TokensBurned(msg.sender, premiumMonthCost);
    }
    
    /**
     * @notice Check if user has premium
     */
    function isPremium(address user) external view returns (bool) {
        return premiumExpiry[user] > block.timestamp;
    }
    
    /**
     * @notice Check if user has boosted profile
     */
    function isBoosted(address user) external view returns (bool) {
        return profileBoostExpiry[user] > block.timestamp;
    }
    
    /**
     * @notice Use a super like
     */
    function useSuperLike(address user) external {
        require(msg.sender == datingContract, "Only dating contract");
        require(superLikesRemaining[user] > 0, "No super likes remaining");
        superLikesRemaining[user]--;
    }
    
    /**
     * @notice Update dating contract address
     */
    function setDatingContract(address _datingContract) external onlyOwner {
        datingContract = _datingContract;
    }
}
