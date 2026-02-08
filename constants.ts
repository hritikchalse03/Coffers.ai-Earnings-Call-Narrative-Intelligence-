import { CompanyProfile, MarketEvent } from './types';

export const MOCK_COMPANIES: CompanyProfile[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', marketCap: '3.1T', lastQuarterMomentum: 85 },
  { ticker: 'MSFT', name: 'Microsoft Corp', sector: 'Technology', marketCap: '3.2T', lastQuarterMomentum: 60 },
  { ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology', marketCap: '3.4T', lastQuarterMomentum: 45 },
  { ticker: 'AMZN', name: 'Amazon.com', sector: 'Consumer Cyclical', marketCap: '2.0T', lastQuarterMomentum: 55 },
  { ticker: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication', marketCap: '2.1T', lastQuarterMomentum: 40 },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Communication', marketCap: '1.2T', lastQuarterMomentum: 70 },
  { ticker: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Cyclical', marketCap: '750B', lastQuarterMomentum: -20 },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', marketCap: '580B', lastQuarterMomentum: 30 },
  { ticker: 'V', name: 'Visa Inc', sector: 'Financials', marketCap: '550B', lastQuarterMomentum: 15 },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: '360B', lastQuarterMomentum: -5 },
];

// SIMULATION CONTEXT: What happened between last quarter (Q2) and now (Q3)
export const MOCK_MARKET_EVENTS: MarketEvent[] = [
  { id: '1', date: '2024-09-15', type: 'Sector', headline: 'US Dept of Commerce tightens AI chip export controls', impactLevel: 'High' },
  { id: '2', date: '2024-10-02', type: 'Company', headline: 'Report: TSMC CoWoS packaging capacity delayed by 3 months', impactLevel: 'Medium' },
  { id: '3', date: '2024-10-10', type: 'Macro', headline: '10-Year Treasury Yield spikes to 4.5%', impactLevel: 'Low' },
  { id: '4', date: '2024-11-01', type: 'Sector', headline: 'Competitor AMD announces margin compression in data center', impactLevel: 'Medium' }
];

// SIMULATION CONTEXT: What they promised in Q2 (to detect discrepancies)
export const MOCK_Q2_CONTEXT = {
  margins: "We expect gross margins to remain stable at 75% throughout the fiscal year as supply chain costs have normalized.",
  china: "Demand in China remains robust despite existing restrictions; we see no immediate impact on our guidance.",
  supply: "Our supply capacity for the H100 is fully unlocked and we are meeting all backlog orders.",
  guidance: "We are confident in sustaining 50% YoY growth through 2025."
};

// DEMO TRANSCRIPT SCRIPT (Q3)
export const MOCK_TRANSCRIPT_FEED = []; // (Unused, logic moved to StreamService for timing control)
