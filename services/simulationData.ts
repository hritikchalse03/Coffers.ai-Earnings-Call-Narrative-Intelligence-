// Data pools for the Simulation Engine
import { SpeakerType } from '../types';

export interface SimCompany {
  ticker: string;
  name: string;
  sector: string;
  ceo: string;
  cfo: string;
  products: string[];
}

export const COMPANIES: SimCompany[] = [
  // TECH GIANTS
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Tech', ceo: 'Jensen Huang', cfo: 'Colette Kress', products: ['H100 GPUs', 'Blackwell Platform', 'Data Center Revenue', 'Gaming Segment', 'Sovereign AI'] },
  { ticker: 'AAPL', name: 'Apple', sector: 'Tech', ceo: 'Tim Cook', cfo: 'Luca Maestri', products: ['iPhone 16 Pro', 'Services Ecosystem', 'Vision Pro', 'MacBook Air', 'iPad Pro'] },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Tech', ceo: 'Satya Nadella', cfo: 'Amy Hood', products: ['Azure AI', 'Microsoft 365 Copilot', 'Intelligent Cloud', 'Windows OEM', 'GitHub Copilot'] },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Tech', ceo: 'Sundar Pichai', cfo: 'Ruth Porat', products: ['Google Cloud', 'Search Ads', 'YouTube Premium', 'Gemini Ultra', 'Pixel 9'] },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Consumer', ceo: 'Andy Jassy', cfo: 'Brian Olsavsky', products: ['AWS Compute', 'Prime Memberships', 'Advertising Services', 'North America Retail', 'Kuiper'] },
  { ticker: 'META', name: 'Meta', sector: 'Tech', ceo: 'Mark Zuckerberg', cfo: 'Susan Li', products: ['Family of Apps', 'Reels Monetization', 'Llama 3', 'Reality Labs', 'Advantage+ Ads'] },
  
  // SEMIS & HARDWARE
  { ticker: 'AMD', name: 'AMD', sector: 'Tech', ceo: 'Lisa Su', cfo: 'Jean Hu', products: ['MI300X Accelerator', 'Ryzen AI', 'Data Center EPYC', 'Client Computing'] },
  { ticker: 'AVGO', name: 'Broadcom', sector: 'Tech', ceo: 'Hock Tan', cfo: 'Kirsten Spears', products: ['AI Networking', 'VMware Integration', 'Custom Silicon', 'Broadband'] },
  { ticker: 'TSLA', name: 'Tesla', sector: 'Auto', ceo: 'Elon Musk', cfo: 'Vaibhav Taneja', products: ['Model Y', 'Cybertruck Production', 'FSD Beta', 'Energy Storage', 'Optimus'] },
  { ticker: 'INTC', name: 'Intel', sector: 'Tech', ceo: 'Pat Gelsinger', cfo: 'David Zinsner', products: ['Gaudi 3', 'Intel Foundry', 'Core Ultra', 'Process Nodes'] },

  // FINANCE
  { ticker: 'JPM', name: 'JPMorgan', sector: 'Finance', ceo: 'Jamie Dimon', cfo: 'Jeremy Barnum', products: ['Net Interest Income', 'Investment Banking Fees', 'Consumer Spending', 'Markets Revenue', 'Credit Costs'] },
  { ticker: 'GS', name: 'Goldman Sachs', sector: 'Finance', ceo: 'David Solomon', cfo: 'Denis Coleman', products: ['Global Banking', 'Asset & Wealth Management', 'FICC Execution', 'Equities Financing'] },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Finance', ceo: 'Ted Pick', cfo: 'Sharon Yeshaya', products: ['Wealth Management Net New Assets', 'Institutional Securities', 'Investment Management', 'Advisory Fees'] },
  { ticker: 'V', name: 'Visa', sector: 'Finance', ceo: 'Ryan McInerney', cfo: 'Chris Suh', products: ['Cross-Border Volume', 'Payments Volume', 'Value-Added Services', 'New Flows'] },

  // TRADITIONAL / RETAIL / HEALTH
  { ticker: 'COST', name: 'Costco', sector: 'Retail', ceo: 'Ron Vachris', cfo: 'Gary Millerchip', products: ['Membership Fee Income', 'Comparable Sales', 'E-commerce', 'Fresh Foods', 'Gasoline'] },
  { ticker: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', ceo: 'Andrew Witty', cfo: 'John Rex', products: ['Optum Health', 'Medicare Advantage', 'Value-Based Care', 'Medical Care Ratio'] },
  { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', ceo: 'Darren Woods', cfo: 'Kathy Mikells', products: ['Upstream Production', 'Low Carbon Solutions', 'Refining Margins', 'Permian Basin', 'Chemical Products'] },
  { ticker: 'WMT', name: 'Walmart', sector: 'Retail', ceo: 'Doug McMillon', cfo: 'John David Rainey', products: ['US Comp Sales', 'Walmart Connect', 'Global eCommerce', 'Sam\'s Club'] }
];

export const ANALYSTS = [
  "Toshiya Hari (Goldman Sachs)", "Stacy Rasgon (Bernstein)", "Ross Seymore (Deutsche Bank)", 
  "Vivek Arya (BofA)", "Joe Moore (Morgan Stanley)", "Timothy Arcuri (UBS)", 
  "Atif Malik (Citi)", "Matt Ramsay (Cowen)", "Harlan Sur (JPMorgan)",
  "Ben Reitzes (Melius)", "Srini Pajjuri (Raymond James)", "Pierre Ferragu (New Street)",
  "C.J. Muse (Cantor Fitzgerald)", "Blayne Curtis (Jefferies)", "Aaron Rakers (Wells Fargo)"
];

// Richer templates to avoid repetition. 
// Categories: GROWTH, PROFITABILITY, GUIDANCE, MACRO, STRATEGY, RISK
export const TEMPLATES = {
  POSITIVE: [
    // Growth
    "We are seeing unprecedented demand for {product}, which drove revenue significantly above the high end of our guidance.",
    "Momentum in {product} accelerated throughout the quarter, and we are exiting with a record backlog.",
    "Our {product} business delivered its strongest performance to date, growing {number}% year-over-year.",
    "Customer adoption of {product} is inflecting faster than we anticipated.",
    // Profitability
    "We achieved record gross margins this quarter, expanding by {number} basis points thanks to operational discipline.",
    "Our focus on efficiency is paying off, with operating income growing {number}% faster than revenue.",
    "We are seeing significant leverage in the model as {product} scales.",
    "Free cash flow generation was robust at ${number} billion, allowing us to return capital to shareholders.",
    // Guidance/Future
    "Based on the visibility we have into {product} demand, we are raising our full-year outlook.",
    "We remain incredibly confident in our long-term strategy for {product} and the broader portfolio.",
    "The pipeline for {product} has never been stronger entering a new fiscal year."
  ],
  NEGATIVE: [
    // Demand/Macro
    "We observed a sudden deceleration in {product} demand towards the end of the quarter.",
    "Macroeconomic uncertainty is causing customers to scrutinize spend, impacting our {product} segment.",
    "The recovery in {product} is taking longer than we initially expected.",
    "We are seeing some softness in the {product} market, particularly in specific geographies.",
    // Costs/Margins
    "Gross margins were impacted by {number} basis points due to higher component costs and mix shift.",
    "Supply chain constraints for {product} limited our ability to fully capture demand this period.",
    "We are facing FX headwinds that negatively impacted revenue by approximately {number}%.",
    "Pricing pressure in the {product} space remains a challenge we are actively navigating.",
    // Guidance
    "Given the volatility, we are widening our guidance range for the upcoming quarter.",
    "We are taking a prudent approach to the second half guide, assuming no improvement in the macro environment."
  ],
  NEUTRAL: [
    "Revenue of ${number} billion was in line with our expectations for the quarter.",
    "We continue to execute on our roadmap for {product} despite a mixed environment.",
    "Our inventory levels for {product} are now normalized and healthy.",
    "We are maintaining our capital expenditure forecast to support long-term growth in {product}.",
    "The {product} business performed consistently with seasonal norms.",
    "We are monitoring the regulatory landscape closely but see no immediate material impact.",
    "Our balance sheet remains a fortress, with ${number} billion in cash and marketable securities.",
    "We made progress on our strategic priorities for {product} during the period."
  ],
  QA_QUESTION: [
    "Can you provide more color on the linearity of {product} bookings during the quarter?",
    "How should we think about the exit exit rate for {product} margins going into next year?",
    "Are you seeing any competitive changes in pricing for {product}?",
    "Could you parse out how much of the growth in {product} was volume versus price?",
    "What are you assuming for the macro environment in your {product} guidance?",
    "Is the strength in {product} coming from new logos or expansion at existing customers?",
    "Can you update us on the supply chain lead times for {product}?",
    "How is the initial feedback for the new {product} launch tracking relative to internal expectations?",
    "Are there any one-time items we should be aware of in the {product} opex line?"
  ]
};

export const ADJECTIVES = {
  POSITIVE: ['robust', 'insatiable', 'extraordinary', 'accelerating', 'durable', 'broad-based', 'secular', 'record-breaking'],
  NEGATIVE: ['muted', 'transient', 'persistent', 'challenging', 'uneven', 'subdued', 'volatile', 'headwind-driven']
};

export const TOPICS = ['Generative AI', 'Cloud Optimization', 'Supply Chain Resilience', 'Capital Allocation', 'Consumer Wallet Share', 'Regulatory Compliance', 'Margin Expansion', 'Geopolitical Risk'];
