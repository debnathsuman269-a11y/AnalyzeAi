import React, { useState, useRef, useEffect } from 'react';

interface SearchInputProps {
  onSearch: (term: string, image?: string) => void;
  isLoading: boolean;
}

// Comprehensive list of popular Indian and US stocks for suggestions
const POPULAR_STOCKS = [
  // Indian Stocks (Nifty 50 / Popular)
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'LICI', name: 'LIC India' },
  { symbol: 'LT', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK', name: 'Axis Bank' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma' },
  { symbol: 'TITAN', name: 'Titan Company' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra' },
  { symbol: 'NTPC', name: 'NTPC' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp' },
  { symbol: 'TATASTEEL', name: 'Tata Steel' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports' },
  { symbol: 'COALINDIA', name: 'Coal India' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'ZOMATO', name: 'Zomato' },
  { symbol: 'PAYTM', name: 'One97 Communications (Paytm)' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services' },
  { symbol: 'IRFC', name: 'IRFC' },
  { symbol: 'RVNL', name: 'RVNL' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics' },
  { symbol: 'BEL', name: 'Bharat Electronics' },
  
  // US Stocks (Mag 7 + Popular)
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)' },
  { symbol: 'AMZN', name: 'Amazon.com' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corp' },
  { symbol: 'COIN', name: 'Coinbase' },
  { symbol: 'PLTR', name: 'Palantir' },
];

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Click outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTerm(value);

    if (value.length > 1) {
      const filtered = POPULAR_STOCKS.filter(stock => 
        stock.name.toLowerCase().includes(value.toLowerCase()) || 
        stock.symbol.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6); // Limit to top 6 results
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (stockName: string) => {
    setTerm(stockName);
    setShowSuggestions(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Please upload an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 content
        const base64Data = result.split(',')[1];
        setSelectedImage(base64Data);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim() || selectedImage) {
      setShowSuggestions(false);
      onSearch(term, selectedImage || undefined);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-50" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col bg-surface rounded-lg p-1 transition-transform group-hover:scale-[1.01] shadow-lg border border-border">
          <div className="flex items-center">
            <input
              type="text"
              className="w-full bg-transparent text-textMain px-4 py-4 outline-none placeholder-textMuted text-lg"
              placeholder={selectedImage ? "Add context about this screenshot..." : "Search Stock or Upload Screenshot..."}
              value={term}
              onChange={handleInputChange}
              onFocus={() => term.length > 1 && setSuggestions(suggestions.length > 0 ? suggestions : [])}
              disabled={isLoading}
              autoComplete="off"
            />
            
            {/* Image Upload Button */}
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 mr-2 text-textMuted hover:text-textMain transition-colors ${selectedImage ? 'text-accent' : ''}`}
                title="Upload Screenshot"
                disabled={isLoading}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <button
              type="submit"
              disabled={isLoading || (!term.trim() && !selectedImage)}
              className={`bg-accent hover:bg-blue-600 text-white px-8 py-3 rounded-md font-semibold transition-all ${
                isLoading || (!term.trim() && !selectedImage) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wait
                </span>
              ) : (
                'Analyze'
              )}
            </button>
          </div>

          {/* Image Preview Pill */}
          {selectedImage && (
              <div className="px-4 pb-2 flex">
                  <div className="bg-surfaceHighlight text-xs text-blue-400 px-3 py-1 rounded-full flex items-center shadow-sm border border-border">
                      <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="max-w-[150px] truncate mr-2 text-textMain">{imageName || 'Screenshot'}</span>
                      <button onClick={clearImage} className="hover:text-textMain text-textMuted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
              </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
          <ul>
            {suggestions.map((stock, index) => (
              <li 
                key={index}
                onClick={() => handleSuggestionClick(stock.name)}
                className="px-4 py-3 hover:bg-surfaceHighlight cursor-pointer border-b border-border last:border-0 flex justify-between items-center group transition-colors"
              >
                <div className="flex flex-col">
                    <span className="text-textMain font-medium group-hover:text-blue-500 transition-colors">{stock.name}</span>
                    <span className="text-xs text-textMuted">{stock.symbol}</span>
                </div>
                <svg className="w-4 h-4 text-textMuted group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchInput;