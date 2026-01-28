// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, euint8, euint16, euint32, euint64, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint8, InEuint16, InEuint32} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

/**
 * @title CryptoCupid - Privacy-Preserving Dating for Crypto Folks
 * @notice A dating app using Fhenix FHE for encrypted matching
 * @dev All sensitive user data is stored encrypted and matching happens on encrypted data
 */
contract CryptoCupid {
    
    // ============ Structs ============
    
    struct EncryptedProfile {
        euint8 age;                    // Encrypted age (18-99)
        euint8 cryptoExperience;       // Years in crypto (0-20)
        euint8 riskTolerance;          // 1-10 scale
        euint8 investmentStyle;        // 1=HODL, 2=Swing, 3=DayTrade, 4=DeFi Degen
        euint8 preferredChain;         // 1=ETH, 2=SOL, 3=BTC, 4=Multi-chain
        euint8 tradingFrequency;       // 1=Rarely, 2=Weekly, 3=Daily, 4=Multiple/day
        euint8 portfolioRange;         // 1=<1k, 2=1k-10k, 3=10k-100k, 4=100k-1M, 5=>1M
        euint8 socialActivity;         // 1=Lurker, 2=Occasional, 3=Active, 4=Influencer
        bool isActive;
        uint256 createdAt;
        string publicHandle;           // ENS or public identifier (optional)
    }
    
    struct EncryptedPreferences {
        euint8 minAge;
        euint8 maxAge;
        euint8 minCryptoExperience;
        euint8 minRiskTolerance;
        euint8 maxRiskTolerance;
        euint8 preferredInvestmentStyle;  // 0 = any
        euint8 preferredChain;            // 0 = any
        euint8 minPortfolioRange;
    }
    
    struct Match {
        address user1;
        address user2;
        euint16 compatibilityScore;    // Encrypted compatibility score
        uint256 matchedAt;
        bool user1Accepted;
        bool user2Accepted;
        bool isRevealed;               // Both parties agreed to reveal
    }
    
    struct Message {
        address sender;
        bytes encryptedContent;        // Off-chain encrypted message hash
        uint256 timestamp;
        uint256 stakedAmount;          // Anti-spam stake
    }
    
    // ============ State Variables ============
    
    mapping(address => EncryptedProfile) public profiles;
    mapping(address => EncryptedPreferences) public preferences;
    mapping(address => bool) public hasProfile;
    mapping(bytes32 => Match) public matches;           // matchId => Match
    mapping(address => bytes32[]) public userMatches;   // user => matchIds
    mapping(address => mapping(address => bool)) public hasLiked;
    mapping(address => address[]) public likes;         // who liked this user
    mapping(bytes32 => Message[]) public matchMessages; // matchId => messages
    mapping(address => euint16) public reputationScores;
    mapping(address => bool) public isVerifiedHuman;    // Worldcoin/Gitcoin integration
    mapping(address => uint256) public stakingBalance;
    
    address[] public activeUsers;
    uint256 public totalMatches;
    
    // ============ Configurable Parameters ============
    
    address public owner;
    address public verificationOracle;  // Worldcoin/Gitcoin oracle address
    uint256 public minStake;
    uint256 public messageStake;
    uint256 public initialReputation;
    uint256 public verificationBonus;
    
    // ============ Constants ============
    
    uint256 public constant MAX_REPUTATION = 1000;
    
    // ============ Events ============
    
    event ProfileCreated(address indexed user, string handle, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event LikeSent(address indexed from, address indexed to, uint256 timestamp);
    event MatchCreated(bytes32 indexed matchId, address indexed user1, address indexed user2, uint256 timestamp);
    event MatchAccepted(bytes32 indexed matchId, address indexed user, uint256 timestamp);
    event MatchRevealed(bytes32 indexed matchId, uint256 timestamp);
    event MessageSent(bytes32 indexed matchId, address indexed sender, uint256 timestamp);
    event ReputationUpdated(address indexed user, uint256 timestamp);
    event UserVerified(address indexed user, uint256 timestamp);
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event ParametersUpdated(uint256 minStake, uint256 messageStake);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event VerificationOracleUpdated(address indexed previousOracle, address indexed newOracle);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyVerificationOracle() {
        require(msg.sender == verificationOracle, "Not verification oracle");
        _;
    }
    
    modifier hasActiveProfile() {
        require(hasProfile[msg.sender] && profiles[msg.sender].isActive, "No active profile");
        _;
    }
    
    modifier validMatch(bytes32 matchId) {
        require(matches[matchId].user1 != address(0), "Match does not exist");
        require(
            matches[matchId].user1 == msg.sender || matches[matchId].user2 == msg.sender,
            "Not part of this match"
        );
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Deploy CryptoCupid with configurable parameters
     * @param _minStake Minimum stake required to create a profile
     * @param _messageStake Stake required per message (anti-spam)
     * @param _verificationOracle Address authorized to verify users (Worldcoin/Gitcoin)
     */
    constructor(
        uint256 _minStake,
        uint256 _messageStake,
        address _verificationOracle
    ) {
        owner = msg.sender;
        minStake = _minStake;
        messageStake = _messageStake;
        verificationOracle = _verificationOracle;
        initialReputation = 500;
        verificationBonus = 100;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Transfer ownership to a new address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice Update the verification oracle address
     */
    function setVerificationOracle(address _verificationOracle) external onlyOwner {
        emit VerificationOracleUpdated(verificationOracle, _verificationOracle);
        verificationOracle = _verificationOracle;
    }
    
    /**
     * @notice Update stake parameters
     */
    function updateStakeParameters(uint256 _minStake, uint256 _messageStake) external onlyOwner {
        minStake = _minStake;
        messageStake = _messageStake;
        emit ParametersUpdated(_minStake, _messageStake);
    }
    
    /**
     * @notice Update reputation parameters
     */
    function updateReputationParameters(uint256 _initialReputation, uint256 _verificationBonus) external onlyOwner {
        require(_initialReputation <= MAX_REPUTATION, "Initial reputation too high");
        require(_initialReputation + _verificationBonus <= MAX_REPUTATION, "Bonus would exceed max");
        initialReputation = _initialReputation;
        verificationBonus = _verificationBonus;
    }
    
    // ============ Profile Management ============
    
    /**
     * @notice Create a new encrypted dating profile
     * @param _age Encrypted age value
     * @param _cryptoExperience Encrypted years in crypto
     * @param _riskTolerance Encrypted risk tolerance (1-10)
     * @param _investmentStyle Encrypted investment style
     * @param _preferredChain Encrypted preferred blockchain
     * @param _tradingFrequency Encrypted trading frequency
     * @param _portfolioRange Encrypted portfolio size range
     * @param _socialActivity Encrypted social activity level
     * @param _handle Public ENS or handle (can be empty)
     */
    function createProfile(
        InEuint8 memory _age,
        InEuint8 memory _cryptoExperience,
        InEuint8 memory _riskTolerance,
        InEuint8 memory _investmentStyle,
        InEuint8 memory _preferredChain,
        InEuint8 memory _tradingFrequency,
        InEuint8 memory _portfolioRange,
        InEuint8 memory _socialActivity,
        string calldata _handle
    ) external payable {
        require(!hasProfile[msg.sender], "Profile already exists");
        require(msg.value >= minStake, "Insufficient stake");
        
        profiles[msg.sender] = EncryptedProfile({
            age: FHE.asEuint8(_age),
            cryptoExperience: FHE.asEuint8(_cryptoExperience),
            riskTolerance: FHE.asEuint8(_riskTolerance),
            investmentStyle: FHE.asEuint8(_investmentStyle),
            preferredChain: FHE.asEuint8(_preferredChain),
            tradingFrequency: FHE.asEuint8(_tradingFrequency),
            portfolioRange: FHE.asEuint8(_portfolioRange),
            socialActivity: FHE.asEuint8(_socialActivity),
            isActive: true,
            createdAt: block.timestamp,
            publicHandle: _handle
        });
        
        // Initialize reputation
        reputationScores[msg.sender] = FHE.asEuint16(uint16(initialReputation));
        
        // Set permissions for FHE values
        _setProfilePermissions(msg.sender);
        
        hasProfile[msg.sender] = true;
        activeUsers.push(msg.sender);
        stakingBalance[msg.sender] = msg.value;
        
        emit ProfileCreated(msg.sender, _handle, block.timestamp);
    }
    
    /**
     * @notice Set dating preferences (all encrypted)
     */
    function setPreferences(
        InEuint8 memory _minAge,
        InEuint8 memory _maxAge,
        InEuint8 memory _minCryptoExperience,
        InEuint8 memory _minRiskTolerance,
        InEuint8 memory _maxRiskTolerance,
        InEuint8 memory _preferredInvestmentStyle,
        InEuint8 memory _preferredChain,
        InEuint8 memory _minPortfolioRange
    ) external hasActiveProfile {
        preferences[msg.sender] = EncryptedPreferences({
            minAge: FHE.asEuint8(_minAge),
            maxAge: FHE.asEuint8(_maxAge),
            minCryptoExperience: FHE.asEuint8(_minCryptoExperience),
            minRiskTolerance: FHE.asEuint8(_minRiskTolerance),
            maxRiskTolerance: FHE.asEuint8(_maxRiskTolerance),
            preferredInvestmentStyle: FHE.asEuint8(_preferredInvestmentStyle),
            preferredChain: FHE.asEuint8(_preferredChain),
            minPortfolioRange: FHE.asEuint8(_minPortfolioRange)
        });
        
        // Set permissions
        FHE.allowThis(preferences[msg.sender].minAge);
        FHE.allowThis(preferences[msg.sender].maxAge);
        FHE.allowThis(preferences[msg.sender].minCryptoExperience);
        FHE.allowSender(preferences[msg.sender].minAge);
        
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
    
    // ============ Matching Logic ============
    
    /**
     * @notice Like another user - matching happens on encrypted data
     * @param target The address of the user to like
     */
    function likeUser(address target) external hasActiveProfile {
        require(target != msg.sender, "Cannot like yourself");
        require(hasProfile[target] && profiles[target].isActive, "Target has no active profile");
        require(!hasLiked[msg.sender][target], "Already liked this user");
        
        hasLiked[msg.sender][target] = true;
        likes[target].push(msg.sender);
        
        emit LikeSent(msg.sender, target, block.timestamp);
        
        // Check for mutual like (creates match)
        if (hasLiked[target][msg.sender]) {
            _createMatch(msg.sender, target);
        }
    }
    
    /**
     * @notice Internal function to create a match and compute compatibility
     */
    function _createMatch(address user1, address user2) internal {
        bytes32 matchId = keccak256(abi.encodePacked(user1, user2, block.timestamp));
        
        // Compute encrypted compatibility score
        euint16 score = _computeCompatibility(user1, user2);
        
        matches[matchId] = Match({
            user1: user1,
            user2: user2,
            compatibilityScore: score,
            matchedAt: block.timestamp,
            user1Accepted: false,
            user2Accepted: false,
            isRevealed: false
        });
        
        // Set permissions for the score
        FHE.allowThis(score);
        FHE.allow(score, user1);
        FHE.allow(score, user2);
        
        userMatches[user1].push(matchId);
        userMatches[user2].push(matchId);
        totalMatches++;
        
        emit MatchCreated(matchId, user1, user2, block.timestamp);
    }
    
    /**
     * @notice Compute compatibility score on encrypted data
     * @dev Uses FHE operations to compare encrypted attributes
     */
    function _computeCompatibility(address user1, address user2) internal returns (euint16) {
        EncryptedProfile storage p1 = profiles[user1];
        EncryptedProfile storage p2 = profiles[user2];
        
        // Start with base score
        euint16 score = FHE.asEuint16(0);
        
        // Risk tolerance similarity (closer = better, max 200 points)
        euint8 riskDiff = FHE.sub(
            FHE.max(p1.riskTolerance, p2.riskTolerance),
            FHE.min(p1.riskTolerance, p2.riskTolerance)
        );
        euint16 riskScore = FHE.sub(FHE.asEuint16(200), FHE.asEuint16(FHE.mul(riskDiff, FHE.asEuint8(20))));
        score = FHE.add(score, riskScore);
        
        // Investment style match (exact match = 200 points)
        ebool styleMatch = FHE.eq(p1.investmentStyle, p2.investmentStyle);
        score = FHE.add(score, FHE.select(styleMatch, FHE.asEuint16(200), FHE.asEuint16(50)));
        
        // Chain preference match (exact match = 150 points)
        ebool chainMatch = FHE.eq(p1.preferredChain, p2.preferredChain);
        score = FHE.add(score, FHE.select(chainMatch, FHE.asEuint16(150), FHE.asEuint16(30)));
        
        // Trading frequency similarity (max 150 points)
        euint8 freqDiff = FHE.sub(
            FHE.max(p1.tradingFrequency, p2.tradingFrequency),
            FHE.min(p1.tradingFrequency, p2.tradingFrequency)
        );
        euint16 freqScore = FHE.sub(FHE.asEuint16(150), FHE.asEuint16(FHE.mul(freqDiff, FHE.asEuint8(35))));
        score = FHE.add(score, freqScore);
        
        // Crypto experience bonus (combined experience, max 150 points)
        euint16 combinedExp = FHE.add(FHE.asEuint16(p1.cryptoExperience), FHE.asEuint16(p2.cryptoExperience));
        euint16 expBonus = FHE.min(combinedExp, FHE.asEuint16(150));
        score = FHE.add(score, expBonus);
        
        // Social activity compatibility (max 100 points)
        euint8 socialDiff = FHE.sub(
            FHE.max(p1.socialActivity, p2.socialActivity),
            FHE.min(p1.socialActivity, p2.socialActivity)
        );
        euint16 socialScore = FHE.sub(FHE.asEuint16(100), FHE.asEuint16(FHE.mul(socialDiff, FHE.asEuint8(25))));
        score = FHE.add(score, socialScore);
        
        // Cap at 1000
        return FHE.min(score, FHE.asEuint16(1000));
    }
    
    /**
     * @notice Accept a match to enable messaging
     */
    function acceptMatch(bytes32 matchId) external validMatch(matchId) {
        Match storage m = matches[matchId];
        
        if (msg.sender == m.user1) {
            require(!m.user1Accepted, "Already accepted");
            m.user1Accepted = true;
        } else {
            require(!m.user2Accepted, "Already accepted");
            m.user2Accepted = true;
        }
        
        emit MatchAccepted(matchId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Request to reveal match details (requires both parties)
     */
    function requestReveal(bytes32 matchId) external validMatch(matchId) {
        Match storage m = matches[matchId];
        require(m.user1Accepted && m.user2Accepted, "Both must accept first");
        require(!m.isRevealed, "Already revealed");
        
        m.isRevealed = true;
        emit MatchRevealed(matchId, block.timestamp);
    }
    
    // ============ Messaging ============
    
    /**
     * @notice Send an encrypted message to a match
     * @param matchId The match ID
     * @param encryptedContent The encrypted message content (encrypted off-chain)
     */
    function sendMessage(bytes32 matchId, bytes calldata encryptedContent) external payable validMatch(matchId) {
        Match storage m = matches[matchId];
        require(m.user1Accepted && m.user2Accepted, "Match not accepted by both");
        require(msg.value >= messageStake, "Insufficient message stake");
        
        matchMessages[matchId].push(Message({
            sender: msg.sender,
            encryptedContent: encryptedContent,
            timestamp: block.timestamp,
            stakedAmount: msg.value
        }));
        
        stakingBalance[msg.sender] += msg.value;
        
        emit MessageSent(matchId, msg.sender, block.timestamp);
    }
    
    // ============ Reputation ============
    
    /**
     * @notice Rate a match partner (encrypted rating)
     * @param matchId The match to rate
     * @param rating Encrypted rating (1-5)
     */
    function rateMatch(bytes32 matchId, InEuint8 memory rating) external validMatch(matchId) {
        Match storage m = matches[matchId];
        require(m.user1Accepted && m.user2Accepted, "Match not fully accepted");
        
        address target = msg.sender == m.user1 ? m.user2 : m.user1;
        
        // Update reputation based on encrypted rating
        euint8 encRating = FHE.asEuint8(rating);
        euint16 ratingImpact = FHE.mul(FHE.asEuint16(encRating), FHE.asEuint16(10));
        
        // Adjust reputation (simplified - real implementation would be more nuanced)
        reputationScores[target] = FHE.add(reputationScores[target], ratingImpact);
        
        // Cap at 1000
        reputationScores[target] = FHE.min(reputationScores[target], FHE.asEuint16(1000));
        
        FHE.allowThis(reputationScores[target]);
        FHE.allow(reputationScores[target], target);
        
        emit ReputationUpdated(target, block.timestamp);
    }
    
    // ============ Verification ============
    
    /**
     * @notice Mark user as verified (called by Worldcoin/Gitcoin oracle)
     * @dev Only the designated verification oracle can call this
     * @param user Address of the user to verify
     */
    function verifyUser(address user) external onlyVerificationOracle {
        require(hasProfile[user], "User has no profile");
        require(!isVerifiedHuman[user], "Already verified");
        
        isVerifiedHuman[user] = true;
        
        // Boost reputation for verified users
        reputationScores[user] = FHE.add(reputationScores[user], FHE.asEuint16(uint16(verificationBonus)));
        reputationScores[user] = FHE.min(reputationScores[user], FHE.asEuint16(uint16(MAX_REPUTATION)));
        
        FHE.allowThis(reputationScores[user]);
        FHE.allow(reputationScores[user], user);
        
        emit UserVerified(user, block.timestamp);
    }
    
    // ============ Staking ============
    
    /**
     * @notice Deposit additional stake (shows genuine interest)
     */
    function depositStake() external payable hasActiveProfile {
        require(msg.value > 0, "Must deposit something");
        stakingBalance[msg.sender] += msg.value;
        emit StakeDeposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw stake (with cooldown in production)
     */
    function withdrawStake(uint256 amount) external hasActiveProfile {
        require(stakingBalance[msg.sender] >= amount, "Insufficient balance");
        require(stakingBalance[msg.sender] - amount >= minStake, "Must maintain minimum stake");
        
        stakingBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit StakeWithdrawn(msg.sender, amount);
    }
    
    // ============ View Functions ============
    
    function getActiveUserCount() external view returns (uint256) {
        return activeUsers.length;
    }
    
    function getUserMatches(address user) external view returns (bytes32[] memory) {
        return userMatches[user];
    }
    
    function getMatchMessages(bytes32 matchId) external view returns (Message[] memory) {
        return matchMessages[matchId];
    }
    
    function getLikes(address user) external view returns (address[] memory) {
        return likes[user];
    }
    
    function getMatch(bytes32 matchId) external view returns (
        address user1,
        address user2,
        uint256 matchedAt,
        bool user1Accepted,
        bool user2Accepted,
        bool isRevealed
    ) {
        Match storage m = matches[matchId];
        return (m.user1, m.user2, m.matchedAt, m.user1Accepted, m.user2Accepted, m.isRevealed);
    }
    
    /**
     * @notice Get compatibility score hash (only for match participants)
     * @dev In production, use async decrypt to reveal the actual score
     */
    function getCompatibilityScoreHash(bytes32 matchId) external view validMatch(matchId) returns (uint256) {
        return euint16.unwrap(matches[matchId].compatibilityScore);
    }

    /**
     * @notice Request async decryption of compatibility score
     */
    function requestCompatibilityScoreDecrypt(bytes32 matchId) external validMatch(matchId) {
        FHE.decrypt(matches[matchId].compatibilityScore);
    }

    /**
     * @notice Get reputation score hash
     */
    function getReputationScoreHash(address user) external view returns (uint256) {
        require(msg.sender == user, "Can only view own reputation");
        return euint16.unwrap(reputationScores[user]);
    }

    /**
     * @notice Request async decryption of reputation score
     */
    function requestReputationScoreDecrypt() external hasActiveProfile {
        FHE.decrypt(reputationScores[msg.sender]);
    }
    
    // ============ Internal Helpers ============
    
    function _setProfilePermissions(address user) internal {
        EncryptedProfile storage p = profiles[user];
        
        // Allow contract to compute on values
        FHE.allowThis(p.age);
        FHE.allowThis(p.cryptoExperience);
        FHE.allowThis(p.riskTolerance);
        FHE.allowThis(p.investmentStyle);
        FHE.allowThis(p.preferredChain);
        FHE.allowThis(p.tradingFrequency);
        FHE.allowThis(p.portfolioRange);
        FHE.allowThis(p.socialActivity);
        
        // Allow user to decrypt their own data
        FHE.allow(p.age, user);
        FHE.allow(p.cryptoExperience, user);
        FHE.allow(p.riskTolerance, user);
        FHE.allow(p.investmentStyle, user);
        FHE.allow(p.preferredChain, user);
        FHE.allow(p.tradingFrequency, user);
        FHE.allow(p.portfolioRange, user);
        FHE.allow(p.socialActivity, user);
    }
    
    /**
     * @notice Deactivate profile
     */
    function deactivateProfile() external hasActiveProfile {
        profiles[msg.sender].isActive = false;
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Reactivate profile
     */
    function reactivateProfile() external {
        require(hasProfile[msg.sender], "No profile exists");
        require(!profiles[msg.sender].isActive, "Profile already active");
        profiles[msg.sender].isActive = true;
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
}
