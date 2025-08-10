import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Star, Users, Download, Copy, FileText, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { calculateKDPMetrics } from '../utils/kdpCalculations';
import type { AnalysisParameters } from './ParametersConfig';

interface AnalysisResultsProps {
  data: any;
  knowledgeBase: any[];
  parameters: AnalysisParameters;
}

function AnalysisResults({ data, knowledgeBase, parameters }: AnalysisResultsProps) {
  const [sortBy, setSortBy] = useState<'bsr' | 'price' | 'reviews' | 'potential'>('bsr');
  const [filterBy, setFilterBy] = useState<'all' | 'opportunities' | 'high-potential'>('all');

  // Helper function to determine if a book is an opportunity
  const isOpportunity = (book: any) => {
    const bsr = book.bsr || 999999;
    const reviews = book.reviews || 0;
    const price = book.price || 0;
    
    return (
      bsr < parameters.bsr.moderate &&
      reviews < parameters.reviews.moderate &&
      price >= parameters.price.minimum
    );
  };

  // Helper function to get top opportunities
  const getTopOpportunities = () => {
    return books.filter(isOpportunity);
  };

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-slate-600 mb-2">
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

  const filteredBooks = books.filter(book => {
    if (filterBy === 'opportunities') return isOpportunity(book);
    if (filterBy === 'high-potential') {
      const kdp = calculateKDPMetrics(book.price || 0, book.bsr || 999999, book.pages || 200);
      return kdp.monthlyRevenue > 500;
    }
    return true;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'bsr':
        return (a.bsr || 999999) - (b.bsr || 999999);
      case 'price':
        return (b.price || 0) - (a.price || 0);
      case 'reviews':
        return (a.reviews || 0) - (b.reviews || 0);
      case 'potential':
        const aKdp = calculateKDPMetrics(a.price || 0, a.bsr || 999999, a.pages || 200);
        const bKdp = calculateKDPMetrics(b.price || 0, b.bsr || 999999, b.pages || 200);
        return bKdp.monthlyRevenue - aKdp.monthlyRevenue;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Risultati Analisi
        </h2>
        <p className="text-lg text-slate-600">
          Keyword: <span className="font-semibold">{data.keyword}</span>
        </p>
        {data.uploadDate && (
          <p className="text-sm text-slate-500">
            Analizzato il: {data.uploadDate}
          </p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Libri Totali</p>
              <p className="text-2xl font-bold text-slate-900">{books.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">BSR Medio</p>
              <p className="text-2xl font-bold text-slate-900">
                {analysis.averageBSR?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Prezzo Medio</p>
              <p className="text-2xl font-bold text-slate-900">
                ${analysis.averagePrice?.toFixed(2) || 'N/A'}
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
                  const validBooks = books.filter(b => b.price > 0 && b.pages);
                  if (validBooks.length === 0) return 'N/A';
                  const avgRoyalty = validBooks.reduce((acc, book) => {
                    const kdp = calculateKDPMetrics(book.price, book.bsr || 999999, book.pages || 200);
                    return acc + kdp.royalty;
                  }, 0) / validBooks.length;
                  return avgRoyalty.toFixed(2);
                })()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Second Row of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pagine Medie</p>
              <p className="text-2xl font-bold text-slate-900">
                {(() => {
                  const validBooks = books.filter(b => b.pages && b.pages > 0);
                  if (validBooks.length === 0) return 'N/A';
                  const avgPages = Math.round(validBooks.reduce((acc, b) => acc + b.pages, 0) / validBooks.length);
                  return avgPages;
                })()}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rating Medio</p>
              <p className="text-2xl font-bold text-slate-900">
                {(() => {
                  const validBooks = books.filter(b => b.rating && b.rating > 0);
                  if (validBooks.length === 0) return 'N/A';
                  const avgRating = (validBooks.reduce((acc, b) => acc + b.rating, 0) / validBooks.length).toFixed(1);
                  return avgRating;
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
                  const validBooks = books.filter(b => b.price > 0);
                  if (validBooks.length === 0) return 'N/A';
                  const avgRevenue = validBooks.reduce((acc, book) => {
                    const kdp = calculateKDPMetrics(book.price, book.bsr || 999999, book.pages || 200);
                    // Usa SOLO le vendite stimate dal CSV
                    let monthlySales = 0;
                    if (book.estSales) {
                      const parsedSales = typeof book.estSales === 'string' 
                        ? parseFloat(book.estSales.replace(/[^\d.-]/g, '')) 
                        : book.estSales;
                      monthlySales = parsedSales > 0 ? parsedSales : 0;
                    }
                    const monthlyRevenue = kdp.royalty * monthlySales;
                    return acc + monthlyRevenue;
                  }, 0) / validBooks.length;
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
                  if (books.length === 0) return '0%';
                  const highPotentialBooks = books.filter(book => {
                    const kdp = calculateKDPMetrics(book.price || 0, book.bsr || 999999, book.pages || 200);
                    return kdp.monthlyRevenue > 500;
                  });
                  const percentage = Math.round((highPotentialBooks.length / books.length) * 100);
                  return `${percentage}%`;
                })()}
              </p>
            </div>
            <Target className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Score Nicchia */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Score Nicchia</h3>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">
                {(() => {
                  if (books.length === 0) return '0';
                  
                  let score = 0;
                  const totalBooks = books.length;
                  
                  // BSR Score (30 punti max)
                  const goodBSR = books.filter(b => (b.bsr || 999999) < 100000).length;
                  score += Math.round((goodBSR / totalBooks) * 30);
                  
                  // Price Score (25 punti max)
                  const goodPrice = books.filter(b => (b.price || 0) > 15).length;
                  score += Math.round((goodPrice / totalBooks) * 25);
                  
                  // Reviews Score (25 punti max) - meno recensioni = meglio
                  const lowReviews = books.filter(b => (b.reviews || 0) < 100).length;
                  score += Math.round((lowReviews / totalBooks) * 25);
                  
                  // Revenue Score (20 punti max)
                  const goodRevenue = books.filter(book => {
                    const kdp = calculateKDPMetrics(book.price || 0, book.bsr || 999999, book.pages || 200);
                    return kdp.monthlyRevenue > 200;
                  }).length;
                  score += Math.round((goodRevenue / totalBooks) * 20);
                  
                  return Math.min(score, 100);
                })()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900">
              {(() => {
                if (books.length === 0) return '0/100';
                
                let score = 0;
                const totalBooks = books.length;
                
                const goodBSR = books.filter(b => (b.bsr || 999999) < 100000).length;
                score += Math.round((goodBSR / totalBooks) * 30);
                
                const goodPrice = books.filter(b => (b.price || 0) > 15).length;
                score += Math.round((goodPrice / totalBooks) * 25);
                
                const lowReviews = books.filter(b => (b.reviews || 0) < 100).length;
                score += Math.round((lowReviews / totalBooks) * 25);
                
                const goodRevenue = books.filter(book => {
                  const kdp = calculateKDPMetrics(book.price || 0, book.bsr || 999999, book.pages || 200);
                  return kdp.monthlyRevenue > 200;
                }).length;
                score += Math.round((goodRevenue / totalBooks) * 20);
                
                const finalScore = Math.min(score, 100);
                return `${finalScore}/100`;
              })()}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">
                {(() => {
                  if (books.length === 0) return 'Nessun dato';
                  
                  let score = 0;
                  const totalBooks = books.length;
                  
                  const goodBSR = books.filter(b => (b.bsr || 999999) < 100000).length;
                  score += Math.round((goodBSR / totalBooks) * 30);
                  
                  const goodPrice = books.filter(b => (b.price || 0) > 15).length;
                  score += Math.round((goodPrice / totalBooks) * 25);
                  
                  const lowReviews = books.filter(b => (b.reviews || 0) < 100).length;
                  score += Math.round((lowReviews / totalBooks) * 25);
                  
                  const goodRevenue = books.filter(book => {
                    const kdp = calculateKDPMetrics(book.price || 0, book.bsr || 999999, book.pages || 200);
                    return kdp.monthlyRevenue > 200;
                  }).length;
                  score += Math.round((goodRevenue / totalBooks) * 20);
                  
                  const finalScore = Math.min(score, 100);
                  
                  if (finalScore >= 80) return 'Ottima Nicchia';
                  if (finalScore >= 60) return 'Buona Nicchia';
                  if (finalScore >= 40) return 'Nicchia Moderata';
                  return 'Nicchia Difficile';
                })()}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Libri validi analizzati: {books.filter(b => b.title && (b.bsr || b.price)).length}/{books.length}
            </p>
          </div>
        </div>
      </div>

      {/* Analisi Opportunità */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-slate-900">Analisi Opportunità</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Opportunità Reali */}
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {(() => {
                return books.filter(book => {
                  const bsr = book.bsr || 999999;
                  const price = book.price || 0;
                  return bsr < 60000 && price > 18;
                }).length;
              })()}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Opportunità Reali</h4>
            <p className="text-xs text-slate-600">BSR sotto 60.000, Prezzo sopra $18</p>
          </div>

          {/* Opportunità Premium */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {(() => {
                return books.filter(book => {
                  const bsr = book.bsr || 999999;
                  const price = book.price || 0;
                  const kdp = calculateKDPMetrics(price, bsr, book.pages || 200);
                  return bsr < 60000 && price > 18 && kdp.royalty >= 8;
                }).length;
              })()}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Opportunità Premium</h4>
            <p className="text-xs text-slate-600">BSR sotto 60.000, Prezzo sopra $18, Royalty minimo $8</p>
          </div>

          {/* Alta Profittabilità */}
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {(() => {
                return books.filter(book => {
                  const bsr = book.bsr || 999999;
                  return bsr < 30000;
                }).length;
              })()}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Alta Profittabilità</h4>
            <p className="text-xs text-slate-600">BSR sotto 30.000</p>
          </div>

          {/* Fascia Premium */}
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {(() => {
                return books.filter(book => {
                  const price = book.price || 0;
                  return price > 25;
                }).length;
              })()}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Fascia Premium</h4>
            <p className="text-xs text-slate-600">Prezzo sopra $25</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {analysis.insights && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">🧠 Insights e Raccomandazioni</h3>
          <div className="whitespace-pre-line text-blue-800 text-sm leading-relaxed">
            {analysis.insights}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportToCSV(books, `analisi-${data.keyword}-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Esporta CSV</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="bsr">Ordina per BSR</option>
            <option value="price">Ordina per Prezzo</option>
            <option value="reviews">Ordina per Recensioni</option>
            <option value="potential">Ordina per Potenziale</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti i libri ({books.length})</option>
            <option value="opportunities">Solo Opportunità ({getTopOpportunities().length})</option>
            <option value="high-potential">Alto Potenziale ({books.filter(b => {
              const kdp = calculateKDPMetrics(b.price || 0, b.bsr || 999999, b.pages || 200);
              return kdp.monthlyRevenue > 500;
            }).length})</option>
          </select>
        </div>

        <div className="text-sm text-slate-600">
          Mostrando {sortedBooks.length} di {books.length} libri
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Libro</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">BSR</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Prezzo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Rating</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Recensioni</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Ricavi/Mese</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBooks.map((book, index) => {
                const kdp = calculateKDPMetrics(
                  book.price || 0,
                  book.bsr || 999999,
                  book.pages || 200,
                  book.format || 'Paperback'
                );
                const opportunity = isOpportunity(book);

                return (
                  <tr key={index} className={`hover:bg-slate-50 ${opportunity ? 'bg-green-50' : ''}`}>
                    <td className="py-4 px-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-slate-900 truncate" title={book.title}>
                          {book.title}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {book.author}
                        </p>
                        {book.angle && (
                          <p className="text-xs text-blue-600 mt-1">
                            {book.angle}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${
                        (book.bsr || 999999) < parameters.bsr.veryCompetitive ? 'text-red-600' :
                        (book.bsr || 999999) < parameters.bsr.competitive ? 'text-yellow-600' :
                        (book.bsr || 999999) < parameters.bsr.moderate ? 'text-green-600' :
                        'text-slate-600'
                      }`}>
                        {book.bsr?.toLocaleString() || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-900">
                        €{book.price?.toFixed(2) || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {book.rating || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-medium ${
                        (book.reviews || 0) < parameters.reviews.few ? 'text-green-600' :
                        (book.reviews || 0) < parameters.reviews.moderate ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {book.reviews?.toLocaleString() || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className={`font-medium ${
                          kdp.monthlyRevenue > 1000 ? 'text-green-600' :
                          kdp.monthlyRevenue > 500 ? 'text-yellow-600' :
                          'text-slate-600'
                        }`}>
                          €{kdp.monthlyRevenue.toFixed(0)}
                        </span>
                        <p className="text-xs text-slate-500">
                          {kdp.monthlySales} vendite
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {opportunity ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-green-700">Opportunità</span>
                          </div>
                        ) : kdp.monthlyRevenue > 500 ? (
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-medium text-yellow-700">Potenziale</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">Standard</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedBooks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Nessun libro trovato
          </h3>
          <p className="text-slate-500">
            Prova a cambiare i filtri o caricare un nuovo file
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalysisResults;