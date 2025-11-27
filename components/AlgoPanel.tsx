import React, { useState, useEffect, useRef } from 'react';
import { StockAnalysisData, TradeLevel } from '../types.ts';

interface AlgoPanelProps {
  stockData: StockAnalysisData | null;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const AlgoPanel: React.FC<AlgoPanelProps> = ({ stockData }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp: time, message, type }]);
  };

  const handleConnect = () => {
    if (!apiKey || !apiSecret) {
      addLog('API Key and Secret are required.', 'error');
      return;
    }
    
    setIsTrading(true);
    addLog('Initiating handshake with Broker API...', 'info');
    
    setTimeout(() => {
      addLog('Authenticating credentials...', 'info');
      setTimeout(() => {
        setIsConnected(true);
        setIsTrading(false);
        addLog('Successfully connected to Exchange Gateway via API.', 'success');
        addLog(`Ready to trade ${stockData?.stockName || 'stocks'}.`, 'info');
      }, 1500);
    }, 1000);
  };

  const executeTrade = (level: TradeLevel) => {
    if (!isConnected) {
      addLog('Error: Broker API not connected. Please connect first.', 'error');
      return;
    }
    if (!stockData) return;

    const action = level.action;
    if (action === 'HOLD' || action === 'WAIT') {
      addLog(`Skipping execution: Signal is ${action}.`, 'warning');
      return;
    }

    setIsTrading(true);
    addLog(`Algo Triggered: ${level.type} Strategy detected.`, 'info');
    addLog(`Preparing ${action} order for ${stockData.stockName}...`, 'info');

    // Simulation sequence
    setTimeout(() => {
        addLog(`Validating Risk Management checks (Qty: ${quantity})...`, 'info');
        
        setTimeout(() => {
            const price = action === 'BUY' ? level.entry : level.target; // Mock logic
            addLog(`Order Placed: ${action} ${quantity} Qty @ ${price} (MKT)`, 'success');
            
            setTimeout(() => {
                addLog(`Order FILLED with Exchange Order ID: #${Math.floor(Math.random() * 1000000)}`, 'success');
                addLog(`Stop Loss set at ${level.stopLoss}`, 'warning');
                addLog(`Target set at ${level.target}`, 'info');
                setIsTrading(false);
            }, 1200);

        }, 800);
    }, 800);
  };

  return (
    <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <h3 className="text-white font-mono font-bold tracking-wider">ALGO TRADING TERMINAL v1.0</h3>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {isConnected ? 'STATUS: ONLINE' : 'STATUS: DISCONNECTED'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Controls Section */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-6 bg-slate-900">
            
            {/* API Config */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Broker Configuration</h4>
                <div>
                    <input 
                        type="password" 
                        placeholder="API Key" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={isConnected}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-accent outline-none font-mono placeholder-slate-600 mb-2"
                    />
                    <input 
                        type="password" 
                        placeholder="API Secret" 
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        disabled={isConnected}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-accent outline-none font-mono placeholder-slate-600"
                    />
                </div>
                {!isConnected ? (
                    <button 
                        onClick={handleConnect}
                        disabled={isTrading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded transition-colors"
                    >
                        {isTrading ? 'Connecting...' : 'Connect Broker API'}
                    </button>
                ) : (
                    <button 
                        onClick={() => { setIsConnected(false); addLog('Disconnected from Broker.', 'warning'); }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 text-sm font-bold py-2 rounded transition-colors"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {/* Trade Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trade Settings</h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Quantity</span>
                    <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center text-white font-mono"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-Stop Loss</span>
                    <div className="w-10 h-5 bg-green-500/20 rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Execution & Logs */}
        <div className="col-span-2 flex flex-col h-[400px]">
            {/* Available Signals */}
            <div className="p-4 bg-slate-900 border-b border-slate-800">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Available Signals</h4>
                 <div className="flex gap-3 overflow-x-auto pb-2">
                    {stockData && stockData.tradeLevels.length > 0 ? (
                        stockData.tradeLevels.map((level, idx) => (
                            <button
                                key={idx}
                                onClick={() => executeTrade(level)}
                                disabled={!isConnected || isTrading}
                                className={`flex-shrink-0 px-4 py-2 rounded border transition-all flex flex-col items-start min-w-[120px] ${
                                    !isConnected ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-800' :
                                    level.action === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20' :
                                    level.action === 'SELL' ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20' :
                                    'bg-yellow-500/10 border-yellow-500/50 cursor-default'
                                }`}
                            >
                                <span className="text-xs font-bold text-white uppercase">{level.type}</span>
                                <span className={`text-sm font-bold ${
                                    level.action === 'BUY' ? 'text-emerald-400' : 
                                    level.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                    {level.action}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="text-sm text-slate-500 italic">No signals available. Analyze a stock first.</div>
                    )}
                 </div>
            </div>

            {/* Terminal Console */}
            <div className="flex-grow bg-black p-4 font-mono text-xs md:text-sm overflow-y-auto custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-slate-600 mt-10 text-center">
                        <p>_ System Ready.</p>
                        <p>_ Waiting for broker connection...</p>
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="mb-1.5 break-all">
                        <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                        <span className={`
                            ${log.type === 'error' ? 'text-red-500' : ''}
                            ${log.type === 'success' ? 'text-green-400' : ''}
                            ${log.type === 'warning' ? 'text-yellow-400' : ''}
                            ${log.type === 'info' ? 'text-blue-300' : ''}
                        `}>
                            {i === logs.length - 1 && isTrading ? (
                                <span className="animate-pulse">_ </span> 
                            ) : (
                                <span>{'>'} </span>
                            )}
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlgoPanel;