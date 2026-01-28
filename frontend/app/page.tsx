'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('match'); // match, profile, chat

  // Mock connecting
  const connectWallet = async () => {
    setLoading(true);
    // Simulate delay
    setTimeout(() => {
      setIsConnected(true);
      setLoading(false);
    }, 1000);
  };

  // Mock registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsRegistered(true);
      setLoading(false);
    }, 1500);
  };

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-12 rounded-3xl max-w-lg w-full flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Decorative background blobs */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-pink-500/20 to-purple-500/20 animate-spin-slow pointer-events-none" />

          <h1 className="text-5xl font-bold tracking-tighter relative z-10">
            <span className="text-gradient">Fhenix</span>Date
          </h1>
          <p className="text-gray-300 text-lg relative z-10">
            Find your perfect match with <span className="text-pink-400 font-semibold">encrypted</span> privacy.
            Your preferences remain confidential, always.
          </p>

          <button
            onClick={connectWallet}
            className="tinder-gradient mt-8 px-8 py-4 rounded-full text-white font-bold text-xl shadow-lg hover:shadow-pink-500/50 transition-all transform hover:scale-105 active:scale-95 relative z-10"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>

          <p className="text-xs text-gray-500 mt-4 relative z-10">
            Powered by Fhenix FHE
          </p>
        </div>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl w-full max-w-md animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-2 text-center text-white">Create Profile</h2>
          <p className="text-center text-gray-400 mb-8">Set your encrypted preferences.</p>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:border-pink-500 focus:outline-none transition-colors" placeholder="Your Name" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">I am</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="p-3 rounded-lg border border-gray-700 hover:bg-pink-500/20 hover:border-pink-500 transition-all text-left">👨 Male</button>
                <button type="button" className="p-3 rounded-lg border border-gray-700 hover:bg-purple-500/20 hover:border-purple-500 transition-all text-left">👩 Female</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Looking for</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="p-3 rounded-lg border border-gray-700 hover:bg-pink-500/20 hover:border-pink-500 transition-all text-center">👨</button>
                <button type="button" className="p-3 rounded-lg border border-gray-700 hover:bg-purple-500/20 hover:border-purple-500 transition-all text-center">👩</button>
                <button type="button" className="p-3 rounded-lg border border-gray-700 hover:bg-yellow-500/20 hover:border-yellow-500 transition-all text-center">Both</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">ⓘ This information is encrypted on-chain.</p>
            </div>

            <button
              type="submit"
              className="tinder-gradient mt-4 py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-pink-500/20 transition-all transform hover:translate-y-[-2px]"
            >
              {loading ? 'Encrypting & Registering...' : 'Create Confidential Profile'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Dashboard (Matching)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center glass-card border-b border-white/10 sticky top-0 z-50">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">FhenixDate</h1>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center text-xs">
            YOU
          </div>
        </div>
      </header>

      {/* Main Swipe Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Card Stack */}
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {/* Background Card */}
          <div className="absolute inset-0 top-4 scale-95 opacity-50 bg-gray-800 rounded-3xl border border-white/10" />

          {/* Active Card */}
          <div className="absolute inset-0 bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-900/20">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 z-10" />
            <div className="h-full w-full bg-gray-900 flex items-center justify-center text-gray-700 font-bold text-6xl">
              ?
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
              <h3 className="text-3xl font-bold text-white mb-1">Potential Match</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 px-2 py-1 rounded text-xs backdrop-blur-md">85% Compatibility (Encrypted)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute -bottom-24 left-0 right-0 flex justify-center gap-6 z-30">
            <button className="w-14 h-14 rounded-full bg-gray-900 border border-red-500/50 text-red-500 flex items-center justify-center text-2xl hover:scale-110 hover:bg-red-950 transition-all shadow-lg shadow-red-900/20">✕</button>
            <button className="w-14 h-14 rounded-full bg-gray-900 border border-blue-500/50 text-blue-500 flex items-center justify-center text-2xl hover:scale-110 hover:bg-blue-950 transition-all shadow-lg shadow-blue-900/20">★</button>
            <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-red-500 text-white flex items-center justify-center text-2xl hover:scale-110 transition-all shadow-lg shadow-pink-500/30">♥</button>
          </div>
        </div>
      </main>

      {/* Nav Bar */}
      <nav className="glass-card flex justify-around p-4 pb-8 border-t border-white/5">
        <button className={`text-pink-500`}>Explore</button>
        <button className={`text-gray-500`}>Likes</button>
        <button className={`text-gray-500`}>Chat</button>
      </nav>
    </div>
  );
}
