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
  const [showDetailedExport, setShowDetailedExport] = useState(false);

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

  // Funzione per esportare analisi dettagliata per condivisione
  const exportDetailedAnalysis = () => {
    const detailedData = {
      metadata: {
        keyword: data.keyword,
        uploadDate: data.uploadDate,
        fileName: data.fileName,
        totalBooks: books.length,
        analysisDate: new Date().toISOString(),
        parameters: parameters
      },
      summary: {
        averageBSR: analysis.averageBSR,
        averagePrice: analysis.averagePrice,
        opportunities: analysis.opportunities,
        insights: analysis.insights
      },
      books: books.map(book => {
        const kdp = calculateKDPMetrics(
          book.price || 0,
          book.bsr || 999999,
          book.pages || 200,
          book.format || 'Paperback'
        );
        
        return {
          title: book.title,
          author: book.author,
          bsr: book.bsr,
          price: book.price,
          rating: book.rating,
          reviews: book.reviews,
          pages: book.pages,
          format: book.format,
          published: book.published,
          asin: book.asin,
          bookUrl: book.bookUrl,
          angle: book.angle,
          kdpMetrics: kdp,
          opportunity: isOpportunity(book),
          competitiveness: getCompetitiveness(book.bsr || 999999),
          priceCategory: getPriceCategory(book.price || 0),
          reviewsCategory: getReviewsCategory(book.reviews || 0)
        };
      }),
      knowledgeBase: {
        documentsCount: knowledgeBase.length,
        totalSize: knowledgeBase.reduce((acc, doc) => acc + doc.size, 0),
        documents: knowledgeBase.map(doc => ({
          name: doc.name,
          size: doc.size,
          uploadDate: doc.uploadDate
        }))
      }
    };

    const jsonString = JSON.stringify(detailedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisi-dettagliata-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyAnalysisToClipboard = async () => {
    const summary = `
ANALISI AMAZON KW: ${data.keyword}
Data: ${new Date().toLocaleDateString('it-IT')}
Libri analizzati: ${books.length}

STATISTICHE:
- BSR medio: ${analysis.averageBSR?.toLocaleString() || 'N/A'}
- Prezzo medio: €${analysis.averagePrice?.toFixed(2) || 'N/A'}
- Opportunità identificate: ${analysis.opportunities || 0}

TOP 5 OPPORTUNITÀ:
${getTopOpportunities().slice(0, 5).map((book, i) => 
  `${i+1}. "${book.title.substring(0, 50)}..." - BSR: ${book.bsr?.toLocaleString()}, €${book.price}`
).join('\n')}

INSIGHTS:
${analysis.insights || 'Nessun insight disponibile'}
    `.trim();

    try {
      await navigator.clipboard.writeText(summary);
      alert('Analisi copiata negli appunti!');
    } catch (err) {
      console.error('Errore nella copia:', err);
      alert('Errore nella copia. Prova con il download JSON.');
    }
  };

  const isOpportunity = (book: any): boolean => {
    const bsr = book.bsr || 999999;
    const price = book.price || 0;
    const reviews = book.reviews || 0;
    
    return bsr >= parameters.opportunities.minBSR && 
           bsr <= parameters.opportunities.maxBSR &&
           price >= parameters.opportunities.minPrice &&
           reviews <= parameters.opportunities.maxReviews;
  };

  const getCompetitiveness = (bsr: number): string => {
    if (bsr < parameters.bsr.veryCompetitive) return 'Molto Alta';
    if (bsr < parameters.bsr.competitive) return 'Alta';
    if (bsr < parameters.bsr.moderate) return 'Media';
    return 'Bassa';
  };

  const getPriceCategory = (price: number): string => {
    if (price < parameters.price.low) return 'Bassa';
    if (price < parameters.price.medium) return 'Media';
    if (price >= parameters.price.high) return 'Alta';
    return 'Media';
  };

  const getReviewsCategory = (reviews: number): string => {
    if (reviews < parameters.reviews.few) return 'Poche';
    if (reviews < parameters.reviews.moderate) return 'Moderate';
    return 'Molte';
  };

  const getTopOpportunities = () => {
    return books
      .filter(isOpportunity)
      .sort((a, b) => {
        const aKdp = calculateKDPMetrics(a.price || 0, a.bsr || 999999, a.pages || 200);
        const bKdp = calculateKDPMetrics(b.price || 0, b.bsr || 999999, b.pages || 200);
        return bKdp.monthlyRevenue - aKdp.monthlyRevenue;
      });
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                €{analysis.averagePrice?.toFixed(2) || 'N/A'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Opportunità</p>
              <p className="text-2xl font-bold text-slate-900">{getTopOpportunities().length}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📤 Esporta e Condividi Analisi</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportToCSV(books, `analisi-${data.keyword}-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta CSV</span>
          </button>
          
          <button
            onClick={exportDetailedAnalysis}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Esporta Analisi Completa (JSON)</span>
          </button>
          
          <button
            onClick={copyAnalysisToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copia Riassunto</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 Usa "Esporta Analisi Completa" per condividere tutti i dati con esperti per analisi approfondite
        </p>
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