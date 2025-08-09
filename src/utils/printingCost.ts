// Calcolo costo di stampa Amazon KDP per libri B/N (formule ufficiali)
export interface PrintingCostResult {
  printingCost: number;
  minimumPrice: number;
  isViable: boolean;
  profitMargin: number;
}

export function calculatePrintingCost(
  pages: number, 
  actualPrice: number = 0, 
  isLargeTrimSize: boolean = true // Default large perché più comune per libri lunghi
): PrintingCostResult {
  // Formule ufficiali Amazon KDP per libri B/N paperback
  // Regolare (fino a 6"x9"): $1.00 + ($0.012 × pagine)
  // Large (oltre 6"x9"): $1.00 + ($0.017 × pagine)
  
  const fixedCost = 1.00; // USD
  const costPerPage = isLargeTrimSize ? 0.017 : 0.012; // USD
  
  const printingCost = fixedCost + (pages * costPerPage);
  
  // Prezzo minimo per coprire i costi (Amazon prende 40%, noi teniamo 60%)
  const minimumPrice = printingCost / 0.60;
  
  // Verifica se il prezzo attuale è sostenibile
  const isViable = actualPrice >= minimumPrice;
  
  // Calcola margine di profitto effettivo
  const profitMargin = actualPrice > 0 ? ((actualPrice * 0.60) - printingCost) : 0;
  
  return {
    printingCost: Math.round(printingCost * 100) / 100,
    minimumPrice: Math.round(minimumPrice * 100) / 100,
    isViable,
    profitMargin: Math.round(profitMargin * 100) / 100
  };
}