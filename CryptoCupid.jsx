import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Shield, Zap, Users, MessageCircle, Star, ChevronRight, Lock, Sparkles, TrendingUp, Wallet, ArrowRight, Check, X, Send, Crown, Flame, Diamond, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getSDK, connectWallet, disconnectWallet } from './sdk.js';
import { SUPPORTED_CHAINS, APP_CONFIG, FEATURES } from './config.js';

// ============ Constants ============
const INVESTMENT_STYLES = { 1: 'HODL', 2: 'Swing Trade', 3: 'Day Trade', 4: 'DeFi Degen' };
const CHAIN_PREFERENCES = { 1: 'ETH', 2: 'SOL', 3: 'BTC', 4: 'Multi-chain' };
const PORTFOLIO_RANGES = { 1: '<1K', 2: '1K-10K', 3: '10K-100K', 4: '100K-1M', 5: '>1M' };
const AVATARS = ['🦊', '🐋', '🦄', '🎨', '⚡', '🚀', '💎', '🔮', '🌙', '🐉'];

// ============ Utility Hooks ============
function useSDK() {
  const [sdk, setSDK] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    getSDK().then(s => { setSDK(s); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, []);
  return { sdk, loading, error };
}

function useWallet() {
  const [state, setState] = useState({ connected: false, address: null, chainId: null, networkName: null, connecting: false, error: null });
  const connect = useCallback(async () => {
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const result = await connectWallet();
      setState({ connected: true, address: result.address, chainId: result.chainId, networkName: result.networkName, connecting: false, error: null });
    } catch (e) {
      setState(s => ({ ...s, connecting: false, error: e.message }));
    }
  }, []);
  const disconnect = useCallback(() => { disconnectWallet(); setState({ connected: false, address: null, chainId: null, networkName: null, connecting: false, error: null }); }, []);
  return { ...state, connect, disconnect };
}

// ============ Sub Components ============
function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <Loader2 className={`animate-spin ${sizes[size]}`} />;
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm">{message}</span>
      {onRetry && <button onClick={onRetry} className="ml-auto p-2 hover:bg-white/10 rounded-lg"><RefreshCw className="w-4 h-4" /></button>}
    </div>
  );
}

// ============ Landing Page ============
function LandingPage({ onConnect, connecting, error }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      <header className="relative z-10 flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
            <Lock className="w-4 h-4 text-cyan-400 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Crypto<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Cupid</span></span>
        </div>
      </header>
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm bg-white/5 border border-white/10 rounded-full">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-zinc-300">Powered by Fhenix FHE</span>
          <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">LIVE</span>
        </div>
        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">On-Chain</span> Soulmate
        </h1>
        <p className="max-w-xl text-lg text-zinc-400 mb-12 leading-relaxed">
          The first dating app built for crypto natives. Your preferences stay encrypted. Matching happens on encrypted data. Privacy by default.
        </p>
        {error && <ErrorMessage message={error} />}
        <button onClick={onConnect} disabled={connecting} className="group relative px-8 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:opacity-50">
          <span className="flex items-center gap-3">
            {connecting ? <LoadingSpinner size="sm" /> : <Wallet className="w-5 h-5" />}
            {connecting ? 'Connecting...' : 'Connect Wallet to Start'}
            {!connecting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
        <div className="grid grid-cols-3 gap-8 mt-20 text-center">
          <div><div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">FHE</div><div className="text-sm text-zinc-500 mt-1">Encrypted Data</div></div>
          <div><div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">100%</div><div className="text-sm text-zinc-500 mt-1">Privacy</div></div>
          <div><div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Web3</div><div className="text-sm text-zinc-500 mt-1">Native</div></div>
        </div>
      </main>
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Crypto Folks Love Us</h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">Built by degens, for degens. With enterprise-grade privacy.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'FHE Encrypted Matching', desc: 'Your preferences are never revealed. Matching computed on encrypted data.', color: 'from-cyan-500 to-blue-500' },
              { icon: Zap, title: 'Chain Compatibility', desc: 'Match with fellow ETH maxis, SOL believers, or multi-chain explorers.', color: 'from-purple-500 to-pink-500' },
              { icon: TrendingUp, title: 'Trading Style Match', desc: 'Diamond hands meet diamond hands. Day traders find their rhythm.', color: 'from-orange-500 to-yellow-500' },
              { icon: Lock, title: 'Private Wealth Verify', desc: 'Prove holdings without revealing amounts. Whale or shrimp—your secret.', color: 'from-green-500 to-emerald-500' },
              { icon: Users, title: 'Sybil Resistant', desc: 'Worldcoin & Gitcoin Passport verified. Real humans only.', color: 'from-pink-500 to-rose-500' },
              { icon: Sparkles, title: 'Stake to Play', desc: 'Anti-spam staking keeps the community genuine.', color: 'from-violet-500 to-indigo-500' },
            ].map((feature, i) => (
              <div key={i} className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}><feature.icon className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ Profile Setup ============
function ProfileSetup({ sdk, onComplete, chainId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [data, setData] = useState({ age: '', cryptoYears: '', riskTolerance: 5, investmentStyle: '', preferredChain: '', tradingFrequency: '2', portfolioRange: '', socialActivity: 2, handle: '' });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sdk.createProfile({
        age: parseInt(data.age),
        cryptoExperience: parseInt(data.cryptoYears),
        riskTolerance: data.riskTolerance,
        investmentStyle: parseInt(data.investmentStyle),
        preferredChain: parseInt(data.preferredChain),
        tradingFrequency: parseInt(data.tradingFrequency),
        portfolioRange: parseInt(data.portfolioRange),
        socialActivity: data.socialActivity,
        handle: data.handle,
      });
      setTxHash(result.txHash);
      setTimeout(() => onComplete(), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = data.age && data.cryptoYears && data.investmentStyle && data.preferredChain && data.portfolioRange;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Heart className="w-16 h-16 text-pink-500" fill="currentColor" />
            <Lock className="w-6 h-6 text-cyan-400 absolute -bottom-1 -right-1" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create Your Encrypted Profile</h1>
          <p className="text-zinc-400 text-sm">All data is encrypted with FHE before being stored on-chain</p>
        </div>

        {txHash ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <div className="text-lg font-semibold mb-2">Profile Created! 🎉</div>
            <p className="text-sm text-zinc-400 mb-4">Your encrypted profile is now live</p>
            <a href={`${SUPPORTED_CHAINS[chainId]?.blockExplorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">View transaction →</a>
          </div>
        ) : (
          <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10">
            {error && <ErrorMessage message={error} />}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Public Handle (ENS/Lens) <span className="text-zinc-500">optional</span></label>
              <input type="text" placeholder="yourname.eth" value={data.handle} onChange={(e) => setData({ ...data, handle: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Age <Lock className="w-3 h-3 text-cyan-400" /><span className="text-xs text-cyan-400 font-normal">encrypted</span></span></label>
              <input type="number" min="18" max="99" placeholder="18-99" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Years in Crypto <Lock className="w-3 h-3 text-cyan-400" /><span className="text-xs text-cyan-400 font-normal">encrypted</span></span></label>
              <input type="number" min="0" max="20" placeholder="0-20" value={data.cryptoYears} onChange={(e) => setData({ ...data, cryptoYears: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Investment Style <Lock className="w-3 h-3 text-cyan-400" /></span></label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(INVESTMENT_STYLES).map(([key, label]) => (
                  <button key={key} onClick={() => setData({ ...data, investmentStyle: key })} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${data.investmentStyle === key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Preferred Chain <Lock className="w-3 h-3 text-cyan-400" /></span></label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(CHAIN_PREFERENCES).map(([key, label]) => (
                  <button key={key} onClick={() => setData({ ...data, preferredChain: key })} className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${data.preferredChain === key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Risk Tolerance: {data.riskTolerance}/10 <Lock className="w-3 h-3 text-cyan-400" /></span></label>
              <input type="range" min="1" max="10" value={data.riskTolerance} onChange={(e) => setData({ ...data, riskTolerance: parseInt(e.target.value) })} className="w-full h-2 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-xs text-zinc-500 mt-1"><span>Conservative</span><span>Full Degen</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300"><span className="flex items-center gap-2">Portfolio Range <Lock className="w-3 h-3 text-cyan-400" /></span></label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(PORTFOLIO_RANGES).map(([key, label]) => (
                  <button key={key} onClick={() => setData({ ...data, portfolioRange: key })} className={`px-2 py-3 rounded-xl text-xs font-medium transition-all ${data.portfolioRange === key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>{label}</button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!isValid || loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Encrypting...</> : 'Encrypt & Create Profile'}
            </button>
            <p className="text-xs text-zinc-500 text-center">Requires 0.001 ETH stake (anti-spam, refundable)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Main App ============
function MainApp({ sdk, wallet, onDisconnect }) {
  const [activeTab, setActiveTab] = useState('discover');
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discoveryProfiles, setDiscoveryProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await sdk.getProfile();
      setProfile(p);
      const m = await sdk.getMatches();
      setMatches(m);
      // In production, you'd fetch discoverable profiles from an indexer or backend
      // For now, we show likes as potential matches
      const likes = await sdk.getLikes();
      setDiscoveryProfiles(likes.map((addr, i) => ({ address: addr, avatar: AVATARS[i % AVATARS.length] })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (discoveryProfiles.length === 0 || actionLoading) return;
    const target = discoveryProfiles[currentProfileIndex];
    setSwipeAnimation(direction);
    
    if (direction === 'right') {
      setActionLoading(true);
      try {
        const result = await sdk.likeUser(target.address);
        if (result.isMatch) {
          alert('🎉 It\'s a match!');
          loadData();
        }
      } catch (e) {
        console.error('Like failed:', e);
      } finally {
        setActionLoading(false);
      }
    }
    
    setTimeout(() => {
      setSwipeAnimation(null);
      setCurrentProfileIndex((prev) => (prev + 1) % Math.max(discoveryProfiles.length, 1));
    }, 300);
  };

  const handleAcceptMatch = async (matchId) => {
    setActionLoading(true);
    try {
      await sdk.acceptMatch(matchId);
      loadData();
    } catch (e) {
      alert('Failed to accept match: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedMatch || actionLoading) return;
    setActionLoading(true);
    try {
      await sdk.sendMessage(selectedMatch.matchId, messageInput);
      setMessageInput('');
      const msgs = await sdk.getMessages(selectedMatch.matchId);
      setMessages(msgs);
    } catch (e) {
      alert('Failed to send: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMatch) {
      sdk.getMessages(selectedMatch.matchId).then(setMessages).catch(console.error);
    }
  }, [selectedMatch]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const currentDiscoveryProfile = discoveryProfiles[currentProfileIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
          <span className="text-xl font-bold">CryptoCupid</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-300">{wallet.networkName}</span>
          </div>
          <div className="text-xs text-zinc-400 hidden sm:block">{wallet.address?.slice(0,6)}...{wallet.address?.slice(-4)}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-24">
        {error && <div className="p-4"><ErrorMessage message={error} onRetry={loadData} /></div>}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="p-4">
            {discoveryProfiles.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <h2 className="text-xl font-semibold mb-2">No profiles to discover</h2>
                <p className="text-zinc-400 text-sm">Check back later or invite friends!</p>
              </div>
            ) : (
              <div className="relative">
                <div className={`relative rounded-3xl overflow-hidden transition-transform duration-300 ${swipeAnimation === 'left' ? '-translate-x-full rotate-[-10deg] opacity-0' : swipeAnimation === 'right' ? 'translate-x-full rotate-[10deg] opacity-0' : ''}`}>
                  <div className="aspect-[3/4] bg-gradient-to-b from-zinc-800 to-zinc-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-[120px]">{currentDiscoveryProfile?.avatar || '🦊'}</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /><span className="text-xs">FHE Encrypted</span></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-lg font-bold mb-2 font-mono">{currentDiscoveryProfile?.address?.slice(0,10)}...</h2>
                      <p className="text-sm text-zinc-400">Liked your profile 💝</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button onClick={() => handleSwipe('left')} disabled={actionLoading} className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-all disabled:opacity-50"><X className="w-8 h-8 text-red-400" /></button>
                  <button onClick={() => handleSwipe('right')} disabled={actionLoading} className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50">
                    {actionLoading ? <LoadingSpinner size="sm" /> : <Heart className="w-8 h-8 text-white" fill="currentColor" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && !selectedMatch && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Your Matches ({matches.length})</h2>
            {matches.length === 0 ? (
              <div className="text-center py-16"><Users className="w-16 h-16 mx-auto mb-4 text-zinc-700" /><p className="text-zinc-400">No matches yet. Keep swiping!</p></div>
            ) : (
              <div className="space-y-3">
                {matches.map((match, i) => (
                  <button key={match.matchId} onClick={() => match.canMessage ? setSelectedMatch(match) : handleAcceptMatch(match.matchId)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-2xl shrink-0">{AVATARS[i % AVATARS.length]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{match.otherUserHandle || `${match.otherUser.slice(0,8)}...`}</span>
                        {match.otherUserVerified && <Shield className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-sm text-zinc-400">{match.canMessage ? 'Tap to chat' : match.iAccepted ? 'Waiting for them...' : 'Tap to accept'}</p>
                    </div>
                    {!match.iAccepted && <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs">Accept</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat View */}
        {activeTab === 'matches' && selectedMatch && (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center gap-4 p-4 border-b border-white/10">
              <button onClick={() => setSelectedMatch(null)} className="p-2 -ml-2 hover:bg-white/10 rounded-full"><ChevronRight className="w-6 h-6 rotate-180" /></button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-xl">💬</div>
              <div>
                <div className="font-semibold">{selectedMatch.otherUserHandle || selectedMatch.otherUser.slice(0,10)}</div>
                <div className="text-xs text-cyan-400 flex items-center gap-1"><Lock className="w-3 h-3" /> E2E Encrypted</div>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="text-center text-xs text-zinc-500 py-4">Messages are encrypted end-to-end</div>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.isFromMe ? 'rounded-br-none bg-gradient-to-r from-pink-500 to-purple-500' : 'rounded-bl-none bg-white/10'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <div className={`text-xs mt-1 ${msg.isFromMe ? 'text-white/70' : 'text-zinc-500'}`}>{msg.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:outline-none transition-all" />
                <button onClick={handleSendMessage} disabled={actionLoading || !messageInput.trim()} className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center disabled:opacity-50">
                  {actionLoading ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-5xl mx-auto mb-4">🦊</div>
              <h2 className="text-xl font-bold">{profile?.publicHandle || 'Anonymous'}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                {profile?.isVerified ? <><Shield className="w-4 h-4 text-cyan-400" /><span className="text-sm text-cyan-400">Verified Human</span></> : <span className="text-sm text-zinc-400">Not verified</span>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3"><span className="text-sm text-zinc-400">Profile Status</span></div>
                <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${profile?.isActive ? 'bg-green-500' : 'bg-red-500'}`} /><span>{profile?.isActive ? 'Active' : 'Inactive'}</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-sm text-zinc-400 mb-3">Your Encrypted Attributes</div>
                <div className="grid grid-cols-2 gap-3">
                  {['Age', 'Crypto Years', 'Risk Level', 'Portfolio', 'Style', 'Chain'].map((attr, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5"><Lock className="w-3 h-3 text-cyan-400" /><span className="text-sm">{attr}</span></div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3"><span className="text-sm text-zinc-400">Staked Balance</span></div>
                <div className="text-2xl font-bold">{profile?.stakingBalance} ETH</div>
                <p className="text-xs text-zinc-500 mt-1">Anti-spam stake (withdrawable)</p>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400 text-sm"><Lock className="w-4 h-4" /> All sensitive data encrypted with Fhenix FHE</div>
              </div>
              <button onClick={onDisconnect} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm">Disconnect Wallet</button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around p-4 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10">
        {[
          { id: 'discover', icon: Heart, label: 'Discover' },
          { id: 'matches', icon: MessageCircle, label: 'Matches' },
          { id: 'profile', icon: Users, label: 'Profile' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedMatch(null); }} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === tab.id ? 'text-pink-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <tab.icon className="w-6 h-6" fill={activeTab === tab.id ? 'currentColor' : 'none'} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============ Root Component ============
export default function CryptoCupid() {
  const { sdk, loading: sdkLoading } = useSDK();
  const wallet = useWallet();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasProfile, setHasProfile] = useState(null);

  useEffect(() => {
    if (wallet.connected && sdk) {
      sdk.hasProfile().then(has => {
        setHasProfile(has);
        if (!has) setShowProfileSetup(true);
      }).catch(console.error);
    }
  }, [wallet.connected, sdk]);

  if (sdkLoading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!wallet.connected) {
    return <LandingPage onConnect={wallet.connect} connecting={wallet.connecting} error={wallet.error} />;
  }

  if (showProfileSetup && hasProfile === false) {
    return <ProfileSetup sdk={sdk} chainId={wallet.chainId} onComplete={() => { setShowProfileSetup(false); setHasProfile(true); }} />;
  }

  if (hasProfile === null) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return <MainApp sdk={sdk} wallet={wallet} onDisconnect={wallet.disconnect} />;
}
