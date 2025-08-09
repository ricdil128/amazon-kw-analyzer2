import { calculateKDPMetrics } from './kdpCalculations';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }

  // Headers
  const headers = [
    'Titolo',
    'Autore', 
    'BSR',
    'Prezzo (€)',
    'Costo Stampa (€)',
    'Royalty Reale (€)',
    'Pagine',
    'Rating',
    'Recensioni',
    'Vendite/Mese',
    'Ricavi/Mese (€)',
    'Keyword',
    'Angolo di Attacco',
    'Potenziale'
  ];

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(book => {
      const kdp = calculateKDPMetrics(
        book.price || 0,
        book.bsr || 999999,
        book.pages || 200,
        book.format || 'Paperback'
      );
      
      // Usa ricavi reali dal CSV se disponibili, altrimenti calcola
      const monthlyRevenue = book.salesRevenue !== undefined && book.salesRevenue !== null 
        ? book.salesRevenue 
        : (() => {
            const actualSales = parseFloat(book.estSales) || kdp.monthlySales;
            return kdp.royalty * actualSales;
          })();
      
      return [
      `"${book.title || 'N/A'}"`,
      `"${book.author || 'N/A'}"`,
      book.bsr || 0,
      book.price || 0,
      kdp.printingCost.toFixed(2),
      kdp.royalty.toFixed(2),
      book.pages || 0,
      book.rating || 0,
      book.reviews || 0,
      book.estSales || kdp.monthlySales,
      monthlyRevenue.toFixed(2),
      `"${book.keyword || 'N/A'}"`,
      `"${book.angle || 'N/A'}"`,
      `"${getPotential(book.bsr || 999999)}"`
      ].join(',');
    })
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getSalesEstimate = (bsr: number): string => {
  if (bsr < 1000) return '500+ vendite/mese';
  if (bsr < 5000) return '100-500 vendite/mese';
  if (bsr < 20000) return '20-100 vendite/mese';
  if (bsr < 100000) return '5-20 vendite/mese';
  return '<5 vendite/mese';
};

const getPotential = (bsr: number): string => {
  if (bsr < 20000) return 'Alto';
  if (bsr < 100000) return 'Medio';
  return 'Basso';
};