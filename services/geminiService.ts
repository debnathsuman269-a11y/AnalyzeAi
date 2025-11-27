import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StockAnalysisData, TradeLevel, GroundingSource, EarningsResult, MarketData } from '../types.ts';

// Lazy initialization to prevent crashes if process.env is not ready immediately
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Safely access API KEY, fallback to empty string if environment is malformed
    const key = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    if (!key) {
      console.warn("API Key not found in process.env");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

// Retry helper for robustness
const withRetry = async <T>(operation: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      
      // Check for retryable errors (Network, 5xx, 429)
      const isRetryable = 
        msg.includes('503') || 
        msg.includes('500') || 
        msg.includes('429') || 
        msg.includes('network') || 
        msg.includes('fetch') || 
        msg.includes('xhr') ||
        msg.includes('Load failed') ||
        error.status === 500 ||
        error.status === 503;

      if (!isRetryable || i === retries - 1) throw error;

      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Gemini API attempt ${i + 1} failed. Retrying in ${delay}ms...`, msg);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Helper to parse the AI's markdown response into structured data
const parseAIResponse = (text: string, stockName: string, sources: GroundingSource[]): StockAnalysisData => {
  const sections = text.split(/## /g);
  
  let fundamentals = "Data not available.";
  let technicals = "Data not available.";
  let news = "No recent news found.";
  let currentPrice = "N/A";
  
  // Try to find the stock name if the AI detected it from an image
  let detectedName = stockName;
  const nameMatch = text.match(/Stock Identified:\s*(.*?)(\n|$)/i);
  if (nameMatch && (!stockName || stockName === 'Unknown Stock')) {
      detectedName = nameMatch[1].trim();
  }

  const tradeLevels: TradeLevel[] = [];

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].toLowerCase();
    const content = lines.slice(1).join('\n').trim();

    if (title.includes('fundamental')) {
      fundamentals = content;
    } else if (title.includes('technical')) {
      technicals = content;
    } else if (title.includes('news')) {
      news = content;
    } else if (title.includes('price')) {
        currentPrice = content.replace(/\*\*/g, '').trim();
    }
  });

  // Extract trade levels more specifically from the full text using Regex for robustness
  const extractLevel = (type: 'Intraday' | 'Swing' | 'Delivery') => {
    const regex = new RegExp(`\\*\\*${type}\\*\\*[\\s\\S]*?Action:\\s*(.*?)\\n[\\s\\S]*?Entry:\\s*(.*?)\\n[\\s\\S]*?Target:\\s*(.*?)\\n[\\s\\S]*?Stop Loss:\\s*(.*?)\\n[\\s\\S]*?Win Probability:\\s*(.*?)\\n[\\s\\S]*?Reasoning:\\s*(.*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      tradeLevels.push({
        type,
        action: match[1].trim().toUpperCase() as any,
        entry: match[2].trim(),
        target: match[3].trim(),
        stopLoss: match[4].trim(),
        winProbability: match[5].trim(),
        reasoning: match[6].trim()
      });
    }
  };

  extractLevel('Intraday');
  extractLevel('Swing');
  extractLevel('Delivery');

  return {
    stockName: detectedName,
    currentPrice,
    fundamentals,
    technicals,
    news,
    tradeLevels,
    sources,
    rawText: text
  };
};

export const analyzeStock = async (stockName: string, imageBase64?: string): Promise<StockAnalysisData> => {
  const model = "gemini-2.5-flash"; // Supports multimodal
  
  let promptText = "";
  
  if (imageBase64) {
    promptText = `
      Analyze the provided image. 
      If it is a stock chart, identify technical patterns (Support, Resistance, Trend, Candle patterns).
      If it is a financial statement, analyze the numbers.
      If it is a news clipping, analyze the sentiment.

      Then, perform a comprehensive stock analysis for "${stockName || 'the stock identified in the image'}".
      If the stock name was not explicitly provided by me, try to identify it from the image and start your response with "Stock Identified: [Name]".
      
      You MUST use Google Search to get the LATEST REAL-TIME data to supplement what is in the image.

      IMPORTANT LANGUAGE INSTRUCTION:
      The content of the analysis (Reasoning, News descriptions, Fundamentals descriptions, Technicals descriptions) MUST be in **HINGLISH** (A mix of Hindi and English).
      Use language that Indian traders commonly use.
      Example: "Market ka trend bullish lag raha hai kyunki RSI strong hai aur volume bhi increase ho raha hai."
    `;
  } else {
    promptText = `
      Analyze the stock "${stockName}" for the Indian Market (NSE/BSE) or US Market depending on the name.
      You MUST use Google Search to get the LATEST REAL-TIME data.

      IMPORTANT LANGUAGE INSTRUCTION:
      The content of the analysis (Reasoning, News descriptions, Fundamentals descriptions, Technicals descriptions) MUST be in **HINGLISH** (A mix of Hindi and English).
      Use language that Indian traders commonly use.
      Example: "Stock fundamentals strong hai par technicals thoda weak lag raha hai short term ke liye."
    `;
  }

  // Common Formatting Instructions
  promptText += `
    Format your response EXACTLY with these Markdown headers (Keep the Headers and Keywords in ENGLISH for parsing):
    
    ## Current Price
    [Just the price and currency, e.g., ₹2,450 INR]

    ## Fundamentals
    [Bullet points in HINGLISH: Market Cap, PE Ratio, Sector, Revenue Growth, Key Strengths/Weaknesses]

    ## Technicals
    [Bullet points in HINGLISH: RSI, MACD, Moving Averages (50/200 DMA), Chart Patterns, Volume analysis. Incorporate insights from the image if provided.]

    ## News
    [Summary of top 3 recent news headlines affecting the stock in HINGLISH]

    ## Trade Levels
    For each style, provide Action (BUY/SELL/WAIT), Entry, Target, Stop Loss, Win Probability, and brief Reasoning.
    
    **Intraday**
    Action: [BUY/SELL/WAIT] (Keep this keyword in ENGLISH)
    Entry: [Price] (Keep this keyword in ENGLISH)
    Target: [Price] (Keep this keyword in ENGLISH)
    Stop Loss: [Price] (Keep this keyword in ENGLISH)
    Win Probability: [Percentage, e.g. 75%] (Keep this keyword in ENGLISH)
    Reasoning: [Short explanation in HINGLISH]

    **Swing**
    Action: [BUY/SELL/WAIT]
    Entry: [Price]
    Target: [Price]
    Stop Loss: [Price]
    Win Probability: [Percentage, e.g. 75%]
    Reasoning: [Short explanation in HINGLISH]

    **Delivery**
    Action: [BUY/SELL/WAIT]
    Entry: [Price]
    Target: [Price]
    Stop Loss: [Price]
    Win Probability: [Percentage, e.g. 75%]
    Reasoning: [Short explanation in HINGLISH]
  `;

  // Construct the payload
  const contentsInput: any = { parts: [] };
  
  if (imageBase64) {
    contentsInput.parts.push({
        inlineData: {
            mimeType: 'image/jpeg', // Generic mime type, model handles it well
            data: imageBase64
        }
    });
  }
  
  contentsInput.parts.push({ text: promptText });

  try {
    const response = await withRetry<GenerateContentResponse>(() => getAI().models.generateContent({
      model: model,
      contents: contentsInput,
      config: {
        tools: [{ googleSearch: {} }],
      },
    }));

    const text = response.text || "No analysis generated.";
    
    // Extract grounding sources (URLs)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .filter((c: any) => c.web && c.web.uri && c.web.title)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri
      }));

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return parseAIResponse(text, stockName || "Unknown Stock", uniqueSources);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "Failed to analyze stock. Please try again.";
    
    const errorStr = error.message || JSON.stringify(error);
    
    if (errorStr.includes('400')) {
      errorMessage = "Invalid request. Please check your inputs.";
    } else if (errorStr.includes('403') || errorStr.includes('API key')) {
      errorMessage = "Access denied. Please check your API key configuration.";
    } else if (errorStr.includes('429')) {
      errorMessage = "Too many requests. Please wait a moment before trying again.";
    } else if (errorStr.includes('500') || errorStr.includes('503')) {
      errorMessage = "AI Service is temporarily unavailable. Please try again.";
    } else if (errorStr.includes('SAFETY') || errorStr.includes('blocked')) {
      errorMessage = "Analysis was blocked by safety filters. Please try a different image or stock.";
    }
    
    throw new Error(errorMessage);
  }
};

export const getUpcomingEarnings = async (): Promise<EarningsResult[]> => {
  const model = "gemini-2.5-flash";
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });

  const prompt = `
    Find the major companies listed on NSE/BSE (Indian Stock Market) that are scheduled to declare their quarterly results (Earnings) or board meeting outcomes TODAY, ${today}.
    
    Use Google Search to find the latest calendar or news for "India stock market results today".
    
    Return the output as a STRICT JSON array of objects. 
    Each object must have:
    - "symbol": Stock symbol or short name.
    - "name": Full company name.
    - "expectation": A very short summary (e.g. "Q3 Earnings", "Dividend", "Stock Split").
    
    If no major companies are declaring today, find upcoming ones for tomorrow and note that in the "expectation".
    
    Return ONLY valid JSON. No markdown formatting.
    Example:
    [
      {"symbol": "TCS", "name": "Tata Consultancy Services", "expectation": "Q3 Results"},
      {"symbol": "INFY", "name": "Infosys", "expectation": "Dividend"}
    ]
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => getAI().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    }));

    const text = response.text || "[]";
    try {
        // Clean markdown code blocks if present despite mimeType instruction
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as EarningsResult[];
    } catch (e) {
        console.warn("Failed to parse earnings JSON", e);
        return [];
    }
  } catch (error) {
    console.error("Failed to fetch earnings:", error);
    return [];
  }
};

export const getMarketOverview = async (): Promise<MarketData> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Use Google Search to find the real-time LIVE market data for the Indian Stock Market (NSE) for TODAY.
    Identify:
    1. Top 5 Gainers (Nifty 50 or broad market)
    2. Top 5 Losers (Nifty 50 or broad market)
    3. 5 Stocks showing 52-Week High Breakout today.

    Return the output as a STRICT JSON object with these keys: "gainers", "losers", "breakouts".
    Each value should be an array of objects with: "symbol", "price", "change".

    Example:
    {
      "gainers": [{"symbol": "RELIANCE", "price": "2450", "change": "+2.5%"}],
      "losers": [{"symbol": "TCS", "price": "3200", "change": "-1.2%"}],
      "breakouts": [{"symbol": "ZOMATO", "price": "140", "change": "+5%"}]
    }
    
    Ensure the data is for TODAY.
    Return ONLY valid JSON.
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => getAI().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    }));

    const text = response.text || "{}";
    try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        return {
          gainers: data.gainers || [],
          losers: data.losers || [],
          breakouts: data.breakouts || []
        };
    } catch (e) {
        console.warn("Failed to parse market data JSON", e);
        return { gainers: [], losers: [], breakouts: [] };
    }
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return { gainers: [], losers: [], breakouts: [] };
  }
};