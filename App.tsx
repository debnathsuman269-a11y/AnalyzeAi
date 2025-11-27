import React, { useState, useEffect } from 'react';
import SearchInput from './components/SearchInput.tsx';
import AnalysisCard from './components/AnalysisCard.tsx';
import TradeLevelCard from './components/TradeLevelCard.tsx';
import SourceList from './components/SourceList.tsx';
import Watchlist from './components/Watchlist.tsx';
import EarningsTicker from './components/EarningsTicker.tsx';
import MarketDashboard from './components/MarketDashboard.tsx';
import { analyzeStock, getUpcomingEarnings, getMarketOverview } from './services/geminiService.ts';
import { StockAnalysisData, AnalysisStatus, EarningsResult, MarketData } from './types.ts';

// Icons
const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);
const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const NewsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

// Tab Types
type Tab = 'home' | 'watchlist' | 'market';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [data, setData] = useState<StockAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [earnings, setEarnings] = useState<EarningsResult[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
      try {
          return (localStorage.getItem('tradeMind_theme') as 'dark' | 'light') || 'dark';
      } catch {
          return 'dark';
      }
  });

  // Toggle Theme
  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('tradeMind_theme', newTheme);
  };

  // Apply Theme
  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      // Update meta theme-color
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
          metaThemeColor.setAttribute("content", theme === 'dark' ? "#0f172a" : "#f8fafc");
      }
  }, [theme]);

  // Watchlist State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tradeMind_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse favorites", e);
      return [];
    }
  });

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Fetch earnings and market data on mount
  useEffect(() => {
    const fetchData = async () => {
        setLoadingMarket(true);
        
        // Parallel fetch for faster load
        const [earningsRes, marketRes] = await Promise.all([
          getUpcomingEarnings(),
          getMarketOverview()
        ]);
        
        setEarnings(earningsRes);
        setMarketData(marketRes);
        setLoadingMarket(false);
    };
    fetchData();
  }, []);

  // Persist Watchlist
  useEffect(() => {
    localStorage.setItem('tradeMind_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleSearch = async (term: string, image?: string) => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    setData(null);
    // Ensure we are on home tab when searching
    setActiveTab('home');

    try {
      const result = await analyzeStock(term, image);
      setData(result);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const toggleFavorite = (stockName: string) => {
    if (favorites.includes(stockName)) {
      setFavorites(favorites.filter(f => f !== stockName));
    } else {
      setFavorites([...favorites, stockName]);
    }
  };

  const removeFavorite = (stockName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(favorites.filter(f => f !== stockName));
  };

  const isFavorite = data ? favorites.includes(data.stockName) : false;

  // Render Logic based on Tab
  const renderTabContent = () => {
    // If analysis is active (loading, error, success), we always show that on Home tab
    if (activeTab === 'home' && status !== AnalysisStatus.IDLE) {
       return null; // The main switch below handles this
    }

    switch (activeTab) {
      case 'home':
        return (
          <>
            <div className="text-center mb-10 mt-6 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-extrabold text-textMain mb-4 tracking-tight">
                  Trade with Ajay
              </h2>
              <p className="text-textMuted text-base md:text-lg max-w-2xl mx-auto px-4">
                  AI-Powered Technicals, Fundamentals & Trade Signals.
              </p>
            </div>
            <SearchInput onSearch={handleSearch} isLoading={status === AnalysisStatus.LOADING} />
            
            {/* Quick Watchlist Preview (First 3) */}
            {favorites.length > 0 && (
                <div className="mb-6 flex flex-col items-center">
                   <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Quick Watchlist</h3>
                   <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                       {favorites.slice(0, 5).map(stock => (
                           <div key={stock} onClick={() => handleSearch(stock)} className="cursor-pointer hover:bg-surfaceHighlight transition-colors flex-shrink-0 bg-surface border border-border rounded px-4 py-2 text-sm text-textMain whitespace-nowrap shadow-sm">
                               {stock}
                           </div>
                       ))}
                       {favorites.length > 5 && (
                           <button onClick={() => setActiveTab('watchlist')} className="flex-shrink-0 bg-surface/50 border border-border rounded px-3 py-2 text-sm text-blue-400 whitespace-nowrap hover:text-blue-300">
                               + {favorites.length - 5} more
                           </button>
                       )}
                   </div>
                </div>
            )}
            
            {/* Market Overview */}
            <div className="mt-8">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h3 className="text-lg font-bold text-textMain">Market Overview</h3>
                 <span className="text-xs text-textMuted flex items-center">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                   Live
                 </span>
               </div>
               <MarketDashboard data={marketData} loading={loadingMarket} onSelect={handleSearch} />
            </div>

          </>
        );
      case 'watchlist':
        return (
          <div className="mt-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-textMain mb-6">Your Watchlist</h2>
             {favorites.length === 0 ? (
                 <div className="text-center py-10 text-textMuted">
                     <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                     </svg>
                     <p className="text-lg">No favorites yet.</p>
                     <button onClick={() => setActiveTab('home')} className="text-accent mt-2 hover:underline">Search to add stocks</button>
                 </div>
             ) : (
                <Watchlist favorites={favorites} onSelect={handleSearch} onRemove={removeFavorite} />
             )}
          </div>
        );
      case 'market':
        return (
          <div className="mt-4 animate-fade-in">
             <h2 className="text-2xl font-bold text-textMain mb-6">Market Events</h2>
             <EarningsTicker earnings={earnings} loading={loadingMarket} onSelect={handleSearch} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-accent selection:text-white pb-24 md:pb-10 transition-colors duration-300">
      {/* Header - Optimized for PC */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => {setActiveTab('home'); setStatus(AnalysisStatus.IDLE);}}>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-white text-lg">T</span>
            </div>
            <h1 className="text-lg font-bold text-textMain tracking-wide">
              Trade<span className="text-blue-500">Ajay</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => {setActiveTab('home'); setStatus(AnalysisStatus.IDLE);}}
              className={`text-sm font-medium transition-colors hover:text-textMain ${activeTab === 'home' ? 'text-blue-400' : 'text-textMuted'}`}
            >
              Analysis
            </button>
            <button 
              onClick={() => {setActiveTab('watchlist'); setStatus(AnalysisStatus.IDLE);}}
              className={`text-sm font-medium transition-colors hover:text-textMain ${activeTab === 'watchlist' ? 'text-blue-400' : 'text-textMuted'}`}
            >
              Watchlist
            </button>
            <button 
              onClick={() => {setActiveTab('market'); setStatus(AnalysisStatus.IDLE);}}
              className={`text-sm font-medium transition-colors hover:text-textMain ${activeTab === 'market' ? 'text-blue-400' : 'text-textMuted'}`}
            >
              Market Events
            </button>
          </div>
          
          <div className="flex items-center space-x-3 w-auto justify-end">
            {/* Theme Toggle Button */}
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-surfaceHighlight text-textMuted hover:text-textMain transition-colors"
                title={theme === 'dark' ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
                {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>

            {/* Install Button (Desktop) */}
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="hidden md:flex text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-full transition-colors items-center animate-pulse"
              >
                Install
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pt-6 max-w-6xl">
        
        {/* Render Tab Content only when IDLE */}
        {status === AnalysisStatus.IDLE && renderTabContent()}

        {/* Loading State */}
        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
             <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
             <p className="text-blue-400 animate-pulse font-medium">Analyzing Market Data...</p>
          </div>
        )}

        {/* Error State */}
        {status === AnalysisStatus.ERROR && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl text-center max-w-lg mx-auto mt-8 shadow-lg animate-fade-in">
            <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <p className="font-bold mb-1 text-lg">Analysis Failed</p>
            <p className="text-sm mb-4 text-red-300/80">{error}</p>
            <button 
                onClick={() => setStatus(AnalysisStatus.IDLE)}
                className="bg-surface hover:bg-surfaceHighlight px-6 py-2 rounded-full text-sm font-semibold transition-colors border border-border text-textMain"
            >
                Try Again
            </button>
          </div>
        )}

        {/* Success View (Overrides Tabs) */}
        {status === AnalysisStatus.SUCCESS && data && (
          <div className="space-y-6 animate-fade-in pb-10">
            {/* Stock Header */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-3xl md:text-4xl font-bold text-textMain tracking-tight">
                            {data.stockName}
                        </h2>
                        <button 
                            onClick={() => toggleFavorite(data.stockName)}
                            className={`p-2 rounded-full transition-all hover:bg-surfaceHighlight ${isFavorite ? 'text-yellow-400' : 'text-textMuted'}`}
                            title={isFavorite ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                            <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-4xl font-mono font-bold text-blue-400">{data.currentPrice}</p>
                 </div>
                 <button 
                    onClick={() => {setStatus(AnalysisStatus.IDLE); setActiveTab('home');}}
                    className="bg-surface p-2 rounded-lg text-textMuted hover:text-textMain hover:bg-surfaceHighlight transition-colors border border-border"
                    title="Close Analysis"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
              </div>
            </div>

            {/* Trade Levels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.tradeLevels.map((level, idx) => (
                    <TradeLevelCard key={idx} level={level} />
                ))}
            </div>

            {/* Deep Dive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AnalysisCard 
                title="Technicals" 
                content={data.technicals} 
                icon={<ChartIcon />}
                delay={100}
              />
              <AnalysisCard 
                title="Fundamentals" 
                content={data.fundamentals} 
                icon={<BookIcon />}
                delay={200}
              />
              <AnalysisCard 
                title="Market News" 
                content={data.news} 
                icon={<NewsIcon />}
                delay={300}
              />
            </div>

            <SourceList sources={data.sources} />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border pb-safe md:hidden z-50 transition-colors duration-300">
         <div className="flex justify-around items-center h-16">
            <button 
                onClick={() => {
                    if (status !== AnalysisStatus.IDLE) {
                        setStatus(AnalysisStatus.IDLE);
                    }
                    setActiveTab('home');
                }}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' && status === AnalysisStatus.IDLE ? 'text-accent' : 'text-textMuted'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[10px] font-medium">Search</span>
            </button>
            
            <button 
                onClick={() => {setStatus(AnalysisStatus.IDLE); setActiveTab('watchlist');}}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'watchlist' ? 'text-accent' : 'text-textMuted'}`}
            >
                <svg className="w-6 h-6" fill={activeTab === 'watchlist' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-[10px] font-medium">Watchlist</span>
            </button>

            <button 
                onClick={() => {setStatus(AnalysisStatus.IDLE); setActiveTab('market');}}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'market' ? 'text-accent' : 'text-textMuted'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[10px] font-medium">Market</span>
            </button>
            
            {/* Mobile Install Button if available */}
            {deferredPrompt && (
                <button 
                    onClick={handleInstallClick}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-green-500 animate-pulse"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-[10px] font-bold">Install</span>
                </button>
            )}
         </div>
      </nav>
    </div>
  );
};

export default App;