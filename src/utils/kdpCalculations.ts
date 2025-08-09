// Calcoli reali Amazon KDP basati sulle formule Excel fornite

export interface KDPCalculation {
  printingCost: number;
  royalty: number;
  monthlySales: number;
  monthlyRevenue: number;
  status: string;
}

// Tabella vendite USA basata su BSR (dati reali forniti)
const BSR_SALES_TABLE = [
  { bsr: 1, sales: 2250 },
  { bsr: 5, sales: 1350 },
  { bsr: 10, sales: 1073 },
  { bsr: 15, sales: 897 },
  { bsr: 20, sales: 720 },
  { bsr: 25, sales: 645 },
  { bsr: 50, sales: 477 },
  { bsr: 75, sales: 388 },
  { bsr: 100, sales: 300 },
  { bsr: 125, sales: 275 },
  { bsr: 150, sales: 250 },
  { bsr: 175, sales: 220 },
  { bsr: 200, sales: 200 },
  { bsr: 225, sales: 190 },
  { bsr: 250, sales: 180 },
  { bsr: 275, sales: 170 },
  { bsr: 300, sales: 160 },
  { bsr: 350, sales: 140 },
  { bsr: 400, sales: 129 },
  { bsr: 450, sales: 119 },
  { bsr: 500, sales: 110 },
  { bsr: 600, sales: 98 },
  { bsr: 700, sales: 89 },
  { bsr: 800, sales: 81 },
  { bsr: 1000, sales: 75 },
  { bsr: 1250, sales: 72 },
  { bsr: 1500, sales: 68 },
  { bsr: 1750, sales: 66 },
  { bsr: 2000, sales: 65 },
  { bsr: 2250, sales: 56 },
  { bsr: 2500, sales: 47 },
  { bsr: 2750, sales: 39 },
  { bsr: 3000, sales: 30 },
  { bsr: 3250, sales: 29 },
  { bsr: 3500, sales: 28 },
  { bsr: 3750, sales: 27 },
  { bsr: 4000, sales: 26 },
  { bsr: 4500, sales: 24 },
  { bsr: 5000, sales: 22 },
  { bsr: 5500, sales: 20 },
  { bsr: 6000, sales: 19 },
  { bsr: 6500, sales: 18 },
  { bsr: 7000, sales: 17 },
  { bsr: 7500, sales: 16 },
  { bsr: 8000, sales: 16 },
  { bsr: 8500, sales: 15 },
  { bsr: 9000, sales: 14 },
  { bsr: 9500, sales: 13 },
  { bsr: 10000, sales: 12 },
  { bsr: 11000, sales: 12 },
  { bsr: 12000, sales: 12 },
  { bsr: 13000, sales: 11 },
  { bsr: 14000, sales: 11 },
  { bsr: 15000, sales: 11 },
  { bsr: 17500, sales: 10 },
  { bsr: 20000, sales: 10 },
  { bsr: 22500, sales: 9 },
  { bsr: 25000, sales: 9 },
  { bsr: 27500, sales: 8 },
  { bsr: 30000, sales: 8 },
  { bsr: 35000, sales: 6 },
  { bsr: 40000, sales: 5 },
  { bsr: 45000, sales: 4 },
  { bsr: 50000, sales: 3 },
  { bsr: 60000, sales: 3 },
  { bsr: 75000, sales: 2 },
  { bsr: 88000, sales: 1 },
  { bsr: 100000, sales: 1 },
  { bsr: 105000, sales: 1 }
];

export function calculatePrintingCost(
  pages: number, 
  format: string = 'Paperback', 
  size: string = 'Fino a 6x9', 
  color: string = 'B/N'
): number {
  if (!pages || pages <= 0) return 0;

  // Arrotonda per eccesso (Math.ceil)
  const roundUp = (value: number, decimals: number = 2) => {
    return Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Solo per paperback
  if (format !== 'Paperback') return 0;

  let cost = 0;

  if (color === 'B/N' && size === 'Fino a 6x9') {
    if (pages < 110) {
      cost = 2.3;
    } else {
      cost = ((pages - 109) * 0.012) + 2.3;
    }
  } else if (color === 'B/N' && size === 'Oltre 6x9') {
    if (pages < 110) {
      cost = 2.84;
    } else {
      cost = ((pages - 109) * 0.017) + 2.84;
    }
  } else if (color === 'Colore' && size === 'Fino a 6x9') {
    if (pages < 72) {
      return 0; // "Minimo 72 Pagine"
    } else {
      cost = (pages * 0.027) + 1;
    }
  } else if (color === 'Colore' && size === 'Oltre 6x9') {
    if (pages < 72) {
      return 0; // "Minimo 72 Pagine"
    } else {
      cost = (pages * 0.042) + 1;
    }
  }

  return roundUp(cost, 2);
}

export function calculateRoyalty(
  price: number, 
  pages: number, 
  format: string = 'Paperback',
  size: string = 'Fino a 6x9',
  color: string = 'B/N'
): number {
  if (!price || price <= 0) return 0;

  // Per Kindle (formato digitale) - 70% se prezzo tra €2.99-€9.99, altrimenti 35%
  if (format === 'Kindle' || format === 'Ebook') {
    if (price >= 2.99 && price <= 9.99) {
      return price * 0.7;
    } else {
      return price * 0.35;
    }
  }

  // Per Paperback - formula Excel: (B2*0,6)-G2
  if (format === 'Paperback') {
    const printingCost = calculatePrintingCost(pages, format, size, color);
    const royalty = (price * 0.6) - printingCost;
    
    // Se royalty < 0.15, prezzo troppo basso
    if (royalty < 0.15) {
      return 0;
    }
    
    return Math.max(0, royalty);
  }

  // Fallback per altri formati
  return price * 0.35;
}

export function getSalesFromBSR(bsr: number): number {
  if (!bsr || bsr <= 0) return 0;

  // Trova il range più vicino nella tabella
  let closestEntry = BSR_SALES_TABLE[BSR_SALES_TABLE.length - 1]; // Default: ultimo valore
  
  for (let i = 0; i < BSR_SALES_TABLE.length; i++) {
    if (bsr <= BSR_SALES_TABLE[i].bsr) {
      closestEntry = BSR_SALES_TABLE[i];
      break;
    }
  }

  // Se BSR è molto alto, interpola verso il basso
  if (bsr > 105000) {
    return Math.max(0, Math.round(1 * (105000 / bsr)));
  }

  return closestEntry.sales;
}

export function calculateKDPMetrics(
  price: number,
  bsr: number,
  pages: number,
  format: string = 'Paperback',
  size: string = 'Fino a 6x9',
  color: string = 'B/N'
): KDPCalculation {
  const printingCost = calculatePrintingCost(pages, format, size, color);
  const royalty = calculateRoyalty(price, pages, format, size, color);
  const monthlySales = getSalesFromBSR(bsr);
  const monthlyRevenue = royalty * monthlySales;

  let status = 'OK';
  if (royalty < 0.15) {
    status = 'Prezzo troppo basso';
  } else if (pages < 72 && color === 'Colore') {
    status = 'Minimo 72 pagine per colore';
  } else if (monthlyRevenue < 50) {
    status = 'Ricavi bassi';
  } else if (monthlyRevenue > 1000) {
    status = 'Ottima opportunità';
  }

  return {
    printingCost: Math.round(printingCost * 100) / 100,
    royalty: Math.round(royalty * 100) / 100,
    monthlySales,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    status
  };
}