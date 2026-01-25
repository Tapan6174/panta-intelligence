
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, Target, Zap, Info, ShieldCheck, Sparkles, Send, BrainCircuit, X, ChevronLeft, Sun, Moon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import * as api from './services/coinGecko';
import { DashboardData, TokenSummary } from './types';
import IntelligenceCard from './components/IntelligenceCard';
import { 
  CirculatingSupplyChart, SupplyCompositionChart, 
  ValuationComparisonChart, FDVGapChart, PriceChart, CorrelationChart, ATHDistanceChart,
  MarketCapChart
} from './components/IntelligenceGraphs';

const DEFAULT_TOKEN_ID = 'bitcoin';

const AIFormatter = ({ text, isDark }: { text: string, isDark: boolean }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('**Subject:')) {
          return <h2 key={i} className={`text-xl font-bold ${isDark ? 'text-cyan-400 border-cyan-950' : 'text-cyan-600 border-cyan-100'} tracking-tight mt-6 mb-2 border-b pb-2`}>{line.replace('## ', '').replace(/\*\*/g, '')}</h2>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h3 key={i} className={`text-sm font-mono ${isDark ? 'text-cyan-200' : 'text-cyan-700'} uppercase tracking-widest mt-4`}>{line.replace(/\*\*/g, '')}</h3>;
        }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().substring(2).split('**').map((part, index) => 
            index % 2 === 1 ? <strong key={index} className={isDark ? "text-cyan-400 font-bold" : "text-cyan-600 font-bold"}>{part}</strong> : part
          );
          return <li key={i} className={`ml-4 ${isDark ? 'text-slate-300' : 'text-slate-600'} list-none flex gap-2`}><span className="text-cyan-600">•</span> <span>{content}</span></li>;
        }
        const formattedLine = line.split('**').map((part, index) => 
          index % 2 === 1 ? <strong key={index} className={isDark ? "text-cyan-400 font-bold" : "text-cyan-600 font-bold"}>{part}</strong> : part
        );
        return <p key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm`}>{formattedLine}</p>;
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenSummary[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiViewActive, setIsAiViewActive] = useState(false);

  // Advanced Full-Root Synchronization Fix
  useEffect(() => {
    const color = isDark ? '#020617' : '#f8fafc';
    
    // 1. Set background for both html and body to eliminate white corners
    document.body.style.backgroundColor = color;
    document.documentElement.style.backgroundColor = color;

    // 2. Dynamically update meta theme-color for mobile browser status/address bars
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);
  }, [isDark]);

  const fetchDashboard = useCallback(async (id: string, days: number) => {
    try {
      setLoading(true);
      setError(null);
      const [market, history] = await Promise.all([
        api.getMarketData(id),
        api.getHistoryData(id, days)
      ]);
      const maxSup = market.max_supply || market.total_supply || market.circulating_supply;
      const fdv = market.fully_diluted_valuation || (market.current_price * maxSup);
      const fdvGap = fdv - market.market_cap;
      const supplyUtilization = (market.circulating_supply / maxSup) * 100;
      const athDistance = Math.abs(market.ath_change_percentage);

      setDashboardData({
        summary: market,
        history,
        derived: { fdvGap, supplyUtilization, athDistance }
      });
    } catch (err: any) {
      setError(err.message || "An error occurred fetching token data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(DEFAULT_TOKEN_ID, selectedDays);
    const interval = setInterval(() => {
        if (dashboardData) fetchDashboard(dashboardData.summary.id, selectedDays);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 1) {
      try {
        const results = await api.searchTokens(q);
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed", e);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectToken = (id: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsAiViewActive(false);
    setAiResponse(null);
    fetchDashboard(id, selectedDays);
  };

  const handleAISynthesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setIsAiViewActive(true); 
    setAiResponse(""); 
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: `You are the PANTA Intelligence Layer AI, a highly advanced crypto-economic analyst. Provide a concise, professional, and data-driven response to the following query. Focus on supply dynamics, market sentiment, and institutional narrative where applicable. Query: ${aiQuery}`,
        config: { temperature: 0.7, topP: 0.95, topK: 64 }
      });
      let fullText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setAiResponse(fullText);
        }
      }
    } catch (err) {
      setAiResponse("AI Connection Interrupted.");
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiView = () => {
    setIsAiViewActive(false);
    setAiResponse(null);
    setAiQuery('');
  };

  const getPriceColor = (val: number) => val >= 0 ? 'text-green-400' : 'text-rose-400';

  if (!dashboardData && loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
        <Loader2 className="animate-spin w-12 h-12 text-cyan-500" />
        <p className="font-mono tracking-widest text-sm animate-pulse">INITIALIZING...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark-mode bg-slate-950 text-slate-100' : 'light-mode bg-slate-50 text-slate-900'} font-sans selection:bg-cyan-500/30 relative`}>
      
      {/* World-Class Sticky Intelligence Bar */}
      <div className={`sticky top-0 z-[100] w-full backdrop-blur-md border-b transition-all duration-300 ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-white/80 border-black/10 shadow-sm'}`}>
        <header className="max-w-7xl mx-auto py-4 px-4 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Branding */}
              <div className="flex items-center gap-4 cursor-pointer" onClick={closeAiView}>
                <div className="w-9 h-9 rounded-none glass flex items-center justify-center neon-glow-green">
                  <Zap className="text-green-400 w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tighter flex items-center gap-2">
                    PANTA <span className="text-cyan-500 font-light">INTELLIGENCE</span>
                  </h1>
                  <div className={`flex items-center gap-1.5 text-[8px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>
                    <span className="w-1 h-1 rounded-none bg-green-500 animate-pulse" />
                    Real-time Analysis Active
                  </div>
                </div>
              </div>

              {/* Theme Toggle Button (Aligned as requested) */}
              <button 
                onClick={() => setIsDark(!isDark)}
                className={`w-9 h-9 flex items-center justify-center rounded-none glass border transition-all hover:scale-105 active:scale-95 ${isDark ? 'text-yellow-400 border-white/10 hover:bg-white/5' : 'text-slate-600 border-black/10 hover:bg-black/5'}`}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            {/* Token Scanner (integrated into sticky bar) */}
            {!isAiViewActive && (
              <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="text"
                  className={`w-full rounded-none py-2 pl-10 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-[10px] placeholder:text-slate-700 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  placeholder="SCAN TOKEN SYMBOL..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                {searchResults.length > 0 && (
                  <div className={`absolute top-full mt-2 w-full glass rounded-none z-50 overflow-hidden border shadow-2xl ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    {searchResults.map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => selectToken(coin.id)}
                        className={`w-full px-4 py-2 flex items-center gap-3 transition-colors border-b last:border-none ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5'}`}
                      >
                        <img src={coin.image} alt="" className="w-4 h-4 rounded-none" />
                        <div className="text-left">
                          <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{coin.name}</p>
                          <p className="text-[8px] text-slate-500 uppercase font-mono">{coin.symbol}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
      </div>

      <div className="p-4 lg:p-8">
        {error && (
          <div className="max-w-7xl mx-auto mb-6 p-3 rounded-none bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs flex items-center gap-3">
            <Info className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Main Dashboard Content */}
        {!isAiViewActive && dashboardData && (
          <main className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className={`glass rounded-none p-4 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-t-2 border-t-cyan-500/30 shadow-lg`}>
              <div className="flex items-center gap-5">
                <img src={dashboardData.summary.image} alt={dashboardData.summary.name} className="w-12 h-12 rounded-none shadow-xl" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">{dashboardData.summary.name}</h2>
                    <span className={`${isDark ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-200 text-slate-500'} font-mono uppercase text-[10px] px-1.5 py-0.5 rounded-none`}>{dashboardData.summary.symbol}</span>
                  </div>
                  <p className="text-3xl font-mono tracking-tight font-bold">
                    ${dashboardData.summary.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
                <div className="space-y-0.5">
                  <p className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>24H PERFORMANCE</p>
                  <p className={`text-lg font-bold flex items-center gap-1 ${getPriceColor(dashboardData.summary.price_change_percentage_24h)}`}>
                    {dashboardData.summary.price_change_percentage_24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {dashboardData.summary.price_change_percentage_24h.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>MARKET RANK</p>
                  <p className="text-lg font-bold font-mono">#{dashboardData.summary.market_cap_rank || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>ATH DISTANCE</p>
                  <p className="text-lg font-bold text-rose-400 font-mono">-{dashboardData.derived.athDistance.toFixed(1)}%</p>
                </div>
                <div className="flex items-center pt-2 md:pt-0">
                  <div className="flex gap-1">
                    {[7, 30, 365].map(d => (
                      <button key={d} onClick={() => { setSelectedDays(d); fetchDashboard(dashboardData.summary.id, d); }} className={`px-2 py-1 rounded-none text-[9px] font-mono transition-colors ${selectedDays === d ? 'bg-cyan-500 text-slate-900' : (isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300')}`}>
                        {d === 365 ? '1Y' : d+'D'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>AI Intelligence Terminal</h3>
              </div>
              <form onSubmit={handleAISynthesis} className="relative flex items-center group">
                <input 
                  type="text"
                  placeholder="EXECUTE DEEP ANALYSIS: 'Explain ETH supply dynamics' or 'Future of RWA tokens'..."
                  className={`w-full border-b py-6 pl-6 pr-20 font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700 shadow-sm ${isDark ? 'bg-slate-900/40 border-slate-800 group-hover:bg-slate-900/60 text-white' : 'bg-white border-slate-200 group-hover:bg-slate-50 text-slate-900'}`}
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <button type="submit" disabled={aiLoading} className="absolute right-6 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-none transition-all disabled:opacity-50">
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </section>

            {/* Grid 1: Primary Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntelligenceCard title={`Price Momentum (${selectedDays}D)`} insight={dashboardData.summary.price_change_percentage_24h > 0 ? "Bullish structural break on intraday scan." : "Searching for support at historical volume nodes."} insightColor={dashboardData.summary.price_change_percentage_24h > 0 ? "green" : "red"} isDark={isDark}><PriceChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
              <IntelligenceCard title="Circulating Supply (Time)" insight="Supply absorption correlating with price growth." insightColor="cyan" isDark={isDark}><CirculatingSupplyChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
              <IntelligenceCard title={`Market Capitalization (${selectedDays}D)`} insight="Aggregate network valuation tracking." insightColor="cyan" isDark={isDark}><MarketCapChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
              <IntelligenceCard title="Supply Distribution" insight={dashboardData.summary.max_supply ? "Maximum supply hard-capped." : "Unlimited supply cap."} insightColor={dashboardData.summary.max_supply ? "green" : "red"} isDark={isDark}><SupplyCompositionChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
            </div>

            {/* Grid 2: Advanced Valuation Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IntelligenceCard title="Market Cap vs FDV Comparison" insight={`The current FDV is ${((dashboardData.summary.fully_diluted_valuation || 1) / dashboardData.summary.market_cap).toFixed(1)}x the current Market Cap.`} insightColor={(dashboardData.summary.fully_diluted_valuation || 0) > dashboardData.summary.market_cap * 2 ? "red" : "cyan"} isDark={isDark}><ValuationComparisonChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
              <IntelligenceCard title="FDV Valuation Gap (Time)" insight="Tracking the monetary distance between current and fully realized value over time." insightColor="cyan" isDark={isDark}><FDVGapChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
            </div>

            {/* Grid 3: Correlation and ATH Distance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IntelligenceCard title="Price / Cap Correlation" insight="Analyzing synchronization between price action and network capitalization." insightColor="cyan" isDark={isDark}><CorrelationChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
              <IntelligenceCard title="ATH Verticality Index" insight={dashboardData.derived.athDistance < 15 ? "High vertical tension near all-time peaks." : "Significant distance from historical value ceiling."} insightColor={dashboardData.derived.athDistance < 20 ? "green" : "gray"} isDark={isDark}><ATHDistanceChart data={dashboardData} isDark={isDark} /></IntelligenceCard>
            </div>
          </main>
        )}

        {/* AI Synthesis View */}
        {isAiViewActive && (
          <main className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 fade-in duration-500">
            <button onClick={closeAiView} className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] mb-12 transition-colors group ${isDark ? 'text-slate-500 hover:text-cyan-400' : 'text-slate-400 hover:text-cyan-600'}`}>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            <div className="space-y-8">
              <header className="border-l-4 border-l-cyan-500 pl-8 space-y-2">
                <div className="flex items-center gap-3 text-cyan-400">
                  <BrainCircuit className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">panta intelligence active</span>
                </div>
                <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{aiQuery}</h2>
              </header>
              <div className={`glass p-8 md:p-12 relative overflow-hidden border min-h-[500px] shadow-2xl ${isDark ? 'border-cyan-500/20' : 'border-cyan-500/10'}`}>
                {aiLoading && !aiResponse ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-6 text-slate-500">
                    <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
                    <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Global Market Vectors...</p>
                  </div>
                ) : (aiResponse || aiResponse === "") ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className={`flex items-center gap-3 mb-8 pb-4 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20 uppercase tracking-widest">Synthesis Finalized</div>
                    </div>
                    <AIFormatter text={aiResponse} isDark={isDark} />
                  </div>
                ) : null}
              </div>
            </div>
          </main>
        )}

        <footer className={`max-w-7xl mx-auto pt-12 pb-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 mt-8 ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
          <div className={`flex items-center gap-3 text-xs font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <ShieldCheck className="w-4 h-4 text-green-500" /> Intelligence Layer Secured
          </div>
          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            COINGECKO API • CACHE SYNC: 60S • © 2024 PANTA
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
