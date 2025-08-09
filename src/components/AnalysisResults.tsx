import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BookOpen, Star, Download, FileText } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { calculatePrintingCost } from '../utils/printingCost';
import type { AnalysisParameters } from './ParametersConfig';

interface AnalysisResultsProps {
  data: any;
  knowledgeBase: any[];
  parameters: AnalysisParameters;
}

function AnalysisResults({ data, knowledgeBase, parameters }: AnalysisResultsProps) {
  const [sortBy, setSortBy] = useState('original');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!data) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          Nessuna analisi disponibile
        </h3>
        <p className="text-slate-500">
          Carica un file CSV per iniziare l'analisi
        </p>
      </div>
    );
  }

  const books = data.books || [];
  const analysis = data.analysis || {};

  const getSalesEstimate = (bsr: number) => {
    if (bsr < 1000) return '500+ vendite/mese';
    if (bsr < 5000) return '100-500 vendite/mese';
    if (bsr < 20000) return '20-100 vendite/mese';
    if (bsr < 100000) return '5-20 vendite/mese';
    return '<5 vendite/mese';
  };

  const getBSRColor = (bsr: number) => {
    if (bsr < 5000) return 'text-green-600 bg-green-50';
    if (bsr < 20000) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === 'original') {
      return (a.originalOrder || 0) - (b.originalOrder || 0);
    }
    
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const handleExport = () => {
    exportToCSV(books, `amazon-keyword-analysis-${Date.now()}`);
  };

  // Calcolo opportunità semplificato
  const realOpportunities = books.filter((book: any) => {
    const bsr = book.bsr || 999999;
    const price = book.price || 0;
    return bsr < 60000 && price > 18;
  }).length;

  // Calcolo opportunità premium
  const premiumOpportunities = books.filter((book: any) => {
    const bsr = book.bsr || 999999;
    const price = book.price || 0;
    const pages = book.pages || 200;
    const isLarge = pages > 150;
    const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
    const royalty = (price * 0.60) - printingCost;
    
    return bsr < 60000 && price > 18 && royalty >= 8;
  }).length;

  return (
    <div className="space-y-8">
      {/* File Info Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">File Analizzato</p>
                <p className="text-lg font-bold text-slate-900">{data.fileName || 'CSV'}</p>
                <p className="text-xs text-slate-500">{data.uploadDate || 'Data non disponibile'}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Libri Totali</p>
                <p className="text-2xl font-bold text-slate-900">{books.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">BSR Medio</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analysis.averageBSR ? analysis.averageBSR.toLocaleString() : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Prezzo Medio</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${analysis.averagePrice ? analysis.averagePrice.toFixed(2) : '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Royalty Media</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0;
                    });
                    
                    if (profitableBooks.length === 0) return '0.00';
                    
                    const avgRoyalty = profitableBooks.reduce((acc: number, book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return acc + royalty;
                    }, 0) / profitableBooks.length;
                    
                    return avgRoyalty.toFixed(2);
                  })()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pagine Medie</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0 && book.pages;
                    });
                    
                    if (profitableBooks.length === 0) return '0';
                    
                    const avgPages = profitableBooks.reduce((acc: number, book: any) => acc + (book.pages || 0), 0) / profitableBooks.length;
                    return Math.round(avgPages);
                  })()}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rating Medio</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0 && book.rating;
                    });
                    
                    if (profitableBooks.length === 0) return '0.0';
                    
                    const avgRating = profitableBooks.reduce((acc: number, book: any) => acc + (book.rating || 0), 0) / profitableBooks.length;
                    return avgRating.toFixed(1);
                  })()}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ricavi Medi/Mese</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0;
                    });
                    
                    if (profitableBooks.length === 0) return '0';
                    
                    const avgRevenue = profitableBooks.reduce((acc: number, book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      let royalty = ((book.price || 0) * 0.60) - printingCost;
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) royalty += 2;
                      const monthlyRevenue = royalty * monthlySales;
                      return acc + monthlyRevenue;
                    }, 0) / profitableBooks.length;
                    
                    return Math.round(avgRevenue);
                  })()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">% Potenziale Alto</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0;
                    });
                    
                    if (profitableBooks.length === 0) return '0%';
                    
                    const highPotential = profitableBooks.filter((book: any) => (book.bsr || 999999) < 20000).length;
                    const percentage = (highPotential / profitableBooks.length) * 100;
                    return Math.round(percentage) + '%';
                  })()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Score Nicchia</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0;
                    });
                    
                    if (profitableBooks.length === 0) return '0/100';
                    
                    // Calcola score ottimizzato: premia le opportunità migliori
                    const bookScores = profitableBooks.map((book: any) => {
                      const bsr = book.bsr || 999999;
                      const price = book.price || 0;
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      let royalty = (price * 0.60) - printingCost;
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) royalty += 2;
                      const reviews = book.reviews || 0;
                      
                      let score = 0;
                      
                      // BSR Score (40 punti max)
                      if (bsr < 10000) score += 40;
                      else if (bsr < 30000) score += 30;
                      else if (bsr < 60000) score += 20;
                      else if (bsr < 100000) score += 10;
                      
                      // Price Score (25 punti max)
                      if (price > 25) score += 25;
                      else if (price > 18) score += 20;
                      else if (price > 12) score += 10;
                      else if (price > 8) score += 5;
                      
                      // Royalty Score (20 punti max)
                      if (royalty > 10) score += 20;
                      else if (royalty > 5) score += 15;
                      else if (royalty > 2) score += 10;
                      else if (royalty > 0) score += 5;
                      
                      // Reviews Score (15 punti max) - meno recensioni = meglio
                      if (reviews < 50) score += 15;
                      else if (reviews < 100) score += 10;
                      else if (reviews < 200) score += 5;
                     // Penalizza pesantemente libri con troppe recensioni (mercato saturo)
                     else if (reviews > 500) score -= 10; // Penalità per mercato saturo
                     else if (reviews > 1000) score -= 20; // Penalità maggiore
                      
                      return score;
                    });
                    
                    // Logica ottimizzata: se hai almeno 1 libro eccellente, la nicchia è buona
                    const excellentBooks = bookScores.filter(score => score >= 80).length;
                    const goodBooks = bookScores.filter(score => score >= 60).length;
                    const decentBooks = bookScores.filter(score => score >= 40).length;
                    
                    let nicheScore = 0;
                    
                    // Se hai libri eccellenti, score alto
                    if (excellentBooks > 0) {
                      nicheScore = Math.min(95, 75 + (excellentBooks * 5)); // 80-95
                    }
                    // Se hai libri buoni, score medio-alto
                    else if (goodBooks > 0) {
                      nicheScore = Math.min(75, 55 + (goodBooks * 4)); // 59-75
                    }
                    // Se hai libri decenti, score medio
                    else if (decentBooks > 0) {
                      nicheScore = Math.min(55, 35 + (decentBooks * 3)); // 38-55
                    }
                    // Altrimenti score basso ma non zero
                    else {
                      const avgScore = Math.round(bookScores.reduce((a, b) => a + b, 0) / bookScores.length);
                      nicheScore = Math.max(15, avgScore); // Minimo 15
                    }
                    
                    const avgScore = Math.round(nicheScore);
                    return `${avgScore}/100`;
                  })()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(() => {
                    const profitableBooks = books.filter((book: any) => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      const royalty = ((book.price || 0) * 0.60) - printingCost;
                      return royalty > 0;
                    });
                    
                    if (profitableBooks.length === 0) return 'Nessun libro profittevole';
                    
                    const bookScores = profitableBooks.map((book: any) => {
                      const bsr = book.bsr || 999999;
                      const price = book.price || 0;
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                      let royalty = (price * 0.60) - printingCost;
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) royalty += 2;
                      const reviews = book.reviews || 0;
                      
                      let score = 0;
                      if (bsr < 10000) score += 40;
                      else if (bsr < 30000) score += 30;
                      else if (bsr < 60000) score += 20;
                      else if (bsr < 100000) score += 10;
                      
                      if (price > 25) score += 25;
                      else if (price > 18) score += 20;
                      else if (price > 12) score += 10;
                      else if (price > 8) score += 5;
                      
                      if (royalty > 10) score += 20;
                      else if (royalty > 5) score += 15;
                      else if (royalty > 2) score += 10;
                      else if (royalty > 0) score += 5;
                      
                      if (reviews < 50) score += 15;
                      else if (reviews < 100) score += 10;
                      else if (reviews < 200) score += 5;
                     // Penalizza pesantemente libri con troppe recensioni (mercato saturo)
                     else if (reviews > 500) score -= 10; // Penalità per mercato saturo
                     else if (reviews > 1000) score -= 20; // Penalità maggiore
                      
                      return score;
                    });
                    
                    const excellentBooks = bookScores.filter(score => score >= 80).length;
                    const goodBooks = bookScores.filter(score => score >= 60).length;
                    const decentBooks = bookScores.filter(score => score >= 40).length;
                    
                    let nicheScore = 0;
                    
                    if (excellentBooks > 0) {
                      nicheScore = Math.min(95, 75 + (excellentBooks * 5));
                    }
                    else if (goodBooks > 0) {
                      nicheScore = Math.min(75, 55 + (goodBooks * 4));
                    }
                    else if (decentBooks > 0) {
                      nicheScore = Math.min(55, 35 + (decentBooks * 3));
                    }
                    else {
                      const avgScore = Math.round(bookScores.reduce((a, b) => a + b, 0) / bookScores.length);
                      nicheScore = Math.max(15, avgScore);
                    }
                    
                    const avgScore = Math.round(nicheScore);
                    
                    if (avgScore >= 80) return '🚀 FALLA!';
                    if (avgScore >= 60) return '✅ Buona Nicchia';
                    if (avgScore >= 40) return '⚠️ Rischio Medio';
                    if (avgScore >= 20) return '❌ Sconsigliata';
                    return '🚫 Evita';
                  })()}
                </p>
                <div className="text-sm text-slate-600 mt-2">
                  Libri validi analizzati: {data.books.filter(book => (book.reviews || 0) <= 300).length}/{data.books.length}
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                (() => {
                  const profitableBooks = books.filter((book: any) => {
                    const pages = book.pages || 200;
                    const isLarge = pages > 150;
                    const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                    const royalty = ((book.price || 0) * 0.60) - printingCost;
                    return royalty > 0;
                  });
                  
                  if (profitableBooks.length === 0) return 'bg-gray-500';
                  
                  const bookScores = profitableBooks.map((book: any) => {
                    const bsr = book.bsr || 999999;
                    const price = book.price || 0;
                    const pages = book.pages || 200;
                    const isLarge = pages > 150;
                    const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                    let royalty = (price * 0.60) - printingCost;
                    const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                    if (monthlySales > 1000) royalty += 2;
                    const reviews = book.reviews || 0;
                    
                    let score = 0;
                    if (bsr < 10000) score += 40;
                    else if (bsr < 30000) score += 30;
                    else if (bsr < 60000) score += 20;
                    else if (bsr < 100000) score += 10;
                    
                    if (price > 25) score += 25;
                    else if (price > 18) score += 20;
                    else if (price > 12) score += 10;
                    else if (price > 8) score += 5;
                    
                    if (royalty > 10) score += 20;
                    else if (royalty > 5) score += 15;
                    else if (royalty > 2) score += 10;
                    else if (royalty > 0) score += 5;
                    
                    if (reviews < 50) score += 15;
                    else if (reviews < 100) score += 10;
                    else if (reviews < 200) score += 5;
                    
                    return score;
                  });
                  
                  const excellentBooks = bookScores.filter(score => score >= 80).length;
                  const goodBooks = bookScores.filter(score => score >= 60).length;
                  const decentBooks = bookScores.filter(score => score >= 40).length;
                  
                  let nicheScore = 0;
                  
                  if (excellentBooks > 0) {
                    nicheScore = Math.min(95, 75 + (excellentBooks * 5));
                  }
                  else if (goodBooks > 0) {
                    nicheScore = Math.min(75, 55 + (goodBooks * 4));
                  }
                  else if (decentBooks > 0) {
                    nicheScore = Math.min(55, 35 + (decentBooks * 3));
                  }
                  else {
                    const avgScore = Math.round(bookScores.reduce((a, b) => a + b, 0) / bookScores.length);
                    nicheScore = Math.max(15, avgScore);
                  }
                  
                  const avgScore = Math.round(nicheScore);
                  
                  if (avgScore >= 80) return 'bg-green-500';
                  if (avgScore >= 60) return 'bg-blue-500';
                  if (avgScore >= 40) return 'bg-yellow-500';
                  if (avgScore >= 20) return 'bg-red-500';
                  return 'bg-gray-500';
                })()
              }`}>
                {(() => {
                  const profitableBooks = books.filter((book: any) => {
                    const pages = book.pages || 200;
                    const isLarge = pages > 150;
                    const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                    const royalty = ((book.price || 0) * 0.60) - printingCost;
                    return royalty > 0;
                  });
                  
                  if (profitableBooks.length === 0) return '?';
                  
                  const bookScores = profitableBooks.map((book: any) => {
                    const bsr = book.bsr || 999999;
                    const price = book.price || 0;
                    const pages = book.pages || 200;
                    const isLarge = pages > 150;
                    const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
                    let royalty = (price * 0.60) - printingCost;
                    const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                    if (monthlySales > 1000) royalty += 2;
                    const reviews = book.reviews || 0;
                    
                    let score = 0;
                    if (bsr < 10000) score += 40;
                    else if (bsr < 30000) score += 30;
                    else if (bsr < 60000) score += 20;
                    else if (bsr < 100000) score += 10;
                    
                    if (price > 25) score += 25;
                    else if (price > 18) score += 20;
                    else if (price > 12) score += 10;
                    else if (price > 8) score += 5;
                    
                    if (royalty > 10) score += 20;
                    else if (royalty > 5) score += 15;
                    else if (royalty > 2) score += 10;
                    else if (royalty > 0) score += 5;
                    
                    if (reviews < 50) score += 15;
                    else if (reviews < 100) score += 10;
                    else if (reviews < 200) score += 5;
                    
                    return score;
                  });
                  
                  const excellentBooks = bookScores.filter(score => score >= 80).length;
                  const goodBooks = bookScores.filter(score => score >= 60).length;
                  const decentBooks = bookScores.filter(score => score >= 40).length;
                  
                  let nicheScore = 0;
                  
                  if (excellentBooks > 0) {
                    nicheScore = Math.min(95, 75 + (excellentBooks * 5));
                  }
                  else if (goodBooks > 0) {
                    nicheScore = Math.min(75, 55 + (goodBooks * 4));
                  }
                  else if (decentBooks > 0) {
                    nicheScore = Math.min(55, 35 + (decentBooks * 3));
                  }
                  else {
                    const avgScore = Math.round(bookScores.reduce((a, b) => a + b, 0) / bookScores.length);
                    nicheScore = Math.max(15, avgScore);
                  }
                  
                  const avgScore = Math.round(nicheScore);
                  return avgScore;
                })()}
              </div>
            </div>
          </div>

        {/* Opportunities Section */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🎯 Analisi Opportunità</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {realOpportunities}
              </div>
              <p className="text-sm text-slate-600 mt-1">Opportunità Reali</p>
              <p className="text-xs text-slate-500">BSR sotto 60.000, Prezzo sopra $18</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {premiumOpportunities}
              </div>
              <p className="text-sm text-slate-600 mt-1">Opportunità Premium</p>
              <p className="text-xs text-slate-500">BSR sotto 60.000, Prezzo sopra $18, Royalty minimo $8</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {books.filter((book: any) => (book.bsr || 999999) < 30000).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Alta Profittabilità</p>
              <p className="text-xs text-slate-500">BSR sotto 30.000</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {books.filter((book: any) => (book.price || 0) > 25).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Fascia Premium</p>
              <p className="text-xs text-slate-500">Prezzo sopra $25</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Insights */}
      {analysis.insights && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              💡 Insights dall'Analisi
            </h3>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
              {analysis.insights}
            </div>
          </div>
          
          {/* OCR Quality Indicator */}
          {analysis.ocrConfidence !== undefined && (
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Qualità Estrazione OCR</span>
                <span className={`text-sm font-semibold ${
                  analysis.ocrConfidence >= 80 ? 'text-green-600' :
                  analysis.ocrConfidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.ocrConfidence}% - {analysis.extractedDataQuality}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    analysis.ocrConfidence >= 80 ? 'bg-green-500' :
                    analysis.ocrConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.ocrConfidence}%` }}
                ></div>
              </div>
              {analysis.ocrConfidence < 80 && (
                <p className="text-xs text-slate-500 mt-2">
                  💡 Per risultati migliori, usa screenshot più nitidi con testo ben visibile
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Risultati Dettagliati
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSortBy('original');
                setSortOrder('asc');
              }}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'original' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ordine CSV
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Esporta CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Titolo
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'bsr') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('bsr');
                      setSortOrder('asc');
                    }
                  }}
                >
                  BSR {sortBy === 'bsr' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'price') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('price');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Prezzo {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Costo Stampa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Royalty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pagine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vendite/Mese
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ricavi/Mese
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Potenziale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Angolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Data Pubblicazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Giudizio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedBooks.map((book: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      {book.bookUrl ? (
                        <a 
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline block cursor-pointer text-sm"
                          title="Clicca per aprire su Amazon"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Tentativo apertura URL:', book.bookUrl);
                            const url = book.bookUrl;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {(book.title || 'Titolo non disponibile').length > 60 
                            ? (book.title || 'Titolo non disponibile').substring(0, 60) + '...' 
                            : (book.title || 'Titolo non disponibile')}
                        </a>
                      ) : (
                        <p className="font-medium text-slate-900 text-sm">
                          {(book.title || 'Titolo non disponibile').length > 60 
                            ? (book.title || 'Titolo non disponibile').substring(0, 60) + '...' 
                            : (book.title || 'Titolo non disponibile')}
                        </p>
                      )}
                      <p className="text-slate-500 mt-1 text-xs">
                        {(book.author || 'Autore non disponibile').length > 30 
                          ? (book.author || 'Autore non disponibile').substring(0, 30) + '...' 
                          : (book.author || 'Autore non disponibile')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${getBSRColor(book.bsr || 999999)}`}>
                      #{(book.bsr || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    €{(book.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const costResult = calculatePrintingCost(pages, book.price || 0, isLarge);
                      
                      let royalty = ((book.price || 0) * 0.60) - costResult.printingCost;
                      
                      const monthlySales = parseInt(book.estSales) || 0;
                      if (monthlySales > 1000) {
                        royalty += 2;
                      }
                      
                      return (
                        <div>
                          <div className="text-slate-600">${costResult.printingCost.toFixed(2)}</div>
                          <div className="text-slate-400 text-xs">Min: ${costResult.minimumPrice.toFixed(2)}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const costResult = calculatePrintingCost(pages, book.price || 0, isLarge);
                      
                      let royalty = ((book.price || 0) * 0.60) - costResult.printingCost;
                      
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) {
                        royalty += 2;
                      }
                      
                      return (
                        <div className="text-center">
                          <div className={`font-medium ${
                            royalty > 2 ? 'text-green-600' :
                            royalty > 0.5 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            ${royalty.toFixed(2)}
                            {monthlySales > 1000 && <span className="text-green-500 text-xs ml-1">+$2</span>}
                          </div>
                          <div className={`text-xs ${
                            royalty > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {royalty > 0 ? '✓ Profittevole' : '✗ In perdita'}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {book.pages || 'N/A'} pp
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-600">
                        {book.rating || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {book.estSales || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {(() => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const costResult = calculatePrintingCost(pages, book.price || 0, isLarge);
                      
                      let royalty = ((book.price || 0) * 0.60) - costResult.printingCost;
                      
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) {
                        royalty += 2;
                      }
                      
                      const monthlyRevenue = royalty * monthlySales;
                      
                      return (
                        <span className={`font-medium ${
                          monthlyRevenue > 1000 ? 'text-green-600' :
                          monthlyRevenue > 200 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          ${monthlyRevenue.toFixed(0)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
                      (book.bsr || 999999) < 20000 ? 'bg-green-100 text-green-800' : 
                      (book.bsr || 999999) < 100000 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {book.potential || ((book.bsr || 999999) < 20000 ? 'Alto' : 
                       (book.bsr || 999999) < 100000 ? 'Medio' : 'Basso')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="truncate block">
                      {book.angle || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {book.published ? (
                      <div className="text-sm">
                        {(() => {
                          try {
                            // Prova a parsare la data in vari formati
                            let date;
                            if (book.published.includes('/')) {
                              // Formato MM/DD/YYYY o DD/MM/YYYY
                              const parts = book.published.split('/');
                              if (parts.length === 3) {
                                // Assumiamo MM/DD/YYYY (formato US)
                                date = new Date(parts[2], parts[0] - 1, parts[1]);
                              }
                            } else if (book.published.includes('-')) {
                              // Formato YYYY-MM-DD
                              date = new Date(book.published);
                            } else {
                              // Prova parsing diretto
                              date = new Date(book.published);
                            }
                            
                            if (date && !isNaN(date.getTime())) {
                              const now = new Date();
                              const diffTime = Math.abs(now.getTime() - date.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              const diffMonths = Math.floor(diffDays / 30);
                              const diffYears = Math.floor(diffDays / 365);
                              
                              let timeAgo = '';
                              if (diffYears > 0) {
                                timeAgo = `${diffYears} anni fa`;
                              } else if (diffMonths > 0) {
                                timeAgo = `${diffMonths} mesi fa`;
                              } else {
                                timeAgo = `${diffDays} giorni fa`;
                              }
                              
                              return (
                                <div>
                                  <div className="font-medium">
                                    {date.toLocaleDateString('it-IT')}
                                  </div>
                                  <div className={`text-xs ${
                                    diffYears < 1 ? 'text-green-600' :
                                    diffYears < 3 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {timeAgo}
                                  </div>
                                </div>
                              );
                            }
                          } catch (error) {
                            // Fallback se parsing fallisce
                          }
                          
                          return (
                            <div className="text-slate-500">
                              {book.published}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const pages = book.pages || 200;
                      const isLarge = pages > 150;
                      const costResult = calculatePrintingCost(pages, book.price || 0, isLarge);
                      
                      let royalty = ((book.price || 0) * 0.60) - costResult.printingCost;
                      const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
                      if (monthlySales > 1000) royalty += 2;
                      const monthlyRevenue = royalty * monthlySales;
                      
                      const bsr = book.bsr || 999999;
                      const price = book.price || 0;
                      const reviews = book.reviews || 0;
                      
                      // Calcolo score (0-100)
                      let score = 0;
                      
                      // BSR Score (40 punti max)
                      if (bsr < 10000) score += 40;
                      else if (bsr < 30000) score += 30;
                      else if (bsr < 60000) score += 20;
                      else if (bsr < 100000) score += 10;
                      
                      // Price Score (25 punti max)
                      if (price > 25) score += 25;
                      else if (price > 18) score += 20;
                      else if (price > 12) score += 10;
                      else if (price > 8) score += 5;
                      
                      // Royalty Score (20 punti max)
                      if (royalty > 10) score += 20;
                      else if (royalty > 5) score += 15;
                      else if (royalty > 2) score += 10;
                      else if (royalty > 0) score += 5;
                      
                      // Reviews Score (15 punti max) - meno recensioni = meglio
                      if (reviews < 50) score += 15;
                      else if (reviews < 100) score += 10;
                      else if (reviews < 200) score += 5;
                      
                      // Giudizio basato su score
                      let judgment = '';
                      let color = '';
                      
                      if (score >= 80) {
                        judgment = '🚀 FALLO!';
                        color = 'bg-green-100 text-green-800';
                      } else if (score >= 60) {
                        judgment = '✅ Buona Idea';
                        color = 'bg-blue-100 text-blue-800';
                      } else if (score >= 40) {
                        judgment = '⚠️ Rischio Medio';
                        color = 'bg-yellow-100 text-yellow-800';
                      } else if (score >= 20) {
                        judgment = '❌ Sconsigliato';
                        color = 'bg-red-100 text-red-800';
                      } else {
                        judgment = '🚫 Evita';
                        color = 'bg-gray-100 text-gray-800';
                      }
                      
                      return (
                        <div className="text-center">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                            {judgment}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Score: {score}/100
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResults;