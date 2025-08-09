import React from 'react';
import { BarChart3, TrendingUp, Target, BookOpen, DollarSign, Users } from 'lucide-react';

interface DashboardProps {
  analysisData: any;
  knowledgeBase: any[];
}

function Dashboard({ analysisData, knowledgeBase }: DashboardProps) {
  const getOverallStats = () => {
    if (!analysisData || !analysisData.books) {
      return {
        totalBooks: 0,
        avgBSR: 0,
        avgPrice: 0,
        opportunities: 0,
        competitiveLevel: 'N/A'
      };
    }

    const books = analysisData.books;
    const totalBooks = books.length;
    const avgBSR = Math.round(books.reduce((acc: number, book: any) => acc + (book.bsr || 0), 0) / totalBooks);
    const avgPrice = books.reduce((acc: number, book: any) => acc + (book.price || 0), 0) / totalBooks;
    const opportunities = books.filter((book: any) => (book.bsr || 999999) < 20000).length;
    
    let competitiveLevel = 'Basso';
    if (avgBSR < 10000) competitiveLevel = 'Alto';
    else if (avgBSR < 50000) competitiveLevel = 'Medio';

    return { totalBooks, avgBSR, avgPrice, opportunities, competitiveLevel };
  };

  const stats = getOverallStats();

  const getRecommendations = () => {
    const books = analysisData?.books || [];
    const recommendations = [];

    // BSR Analysis
    const lowBSRBooks = books.filter((book: any) => (book.bsr || 999999) < 20000).length;
    const totalBooks = books.length;
    
    if (totalBooks > 0) {
      const lowBSRPercentage = (lowBSRBooks / totalBooks) * 100;
      
      if (lowBSRPercentage > 60) {
        recommendations.push({
          type: 'warning',
          title: 'Mercato Molto Competitivo',
          description: `Oltre il ${Math.round(lowBSRPercentage)}% dei libri ha BSR sotto 20k. Considera nicchie più specifiche.`
        });
      } else if (lowBSRPercentage > 30) {
        recommendations.push({
          type: 'info',
          title: 'Concorrenza Moderata',
          description: `${Math.round(lowBSRPercentage)}% dei libri è ben posizionato. Opportunità con angolo di attacco unico.`
        });
      } else {
        recommendations.push({
          type: 'success',
          title: 'Buone Opportunità',
          description: `Solo ${Math.round(lowBSRPercentage)}% dei libri è molto competitivo. Nicchia promettente!`
        });
      }
    }

    // Price Analysis
    if (stats.avgPrice > 15) {
      recommendations.push({
        type: 'success',
        title: 'Fascia di Prezzo Interessante',
        description: `Prezzo medio €${stats.avgPrice.toFixed(2)} indica buon potenziale di guadagno.`
      });
    } else if (stats.avgPrice < 8) {
      recommendations.push({
        type: 'warning',
        title: 'Prezzi Bassi',
        description: 'Considera di puntare su formati premium o contenuti più specializzati.'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Dashboard Analisi
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Overview completa delle tue analisi e performance del sistema
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Libri Analizzati</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalBooks}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">BSR Medio</p>
              <p className="text-2xl font-bold text-slate-900">{stats.avgBSR.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Prezzo Medio</p>
              <p className="text-2xl font-bold text-slate-900">€{stats.avgPrice.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Opportunità</p>
              <p className="text-2xl font-bold text-slate-900">{stats.opportunities}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Competitività</p>
              <p className="text-2xl font-bold text-slate-900">{stats.competitiveLevel}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Documenti KB</p>
              <p className="text-2xl font-bold text-slate-900">{knowledgeBase.length}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">Raccomandazioni</h3>
          <div className="grid gap-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border ${
                  rec.type === 'success' ? 'bg-green-50 border-green-200' :
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <h4 className={`font-semibold mb-2 ${
                  rec.type === 'success' ? 'text-green-800' :
                  rec.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {rec.title}
                </h4>
                <p className={`${
                  rec.type === 'success' ? 'text-green-700' :
                  rec.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Stato Sistema</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Knowledge Base</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Documenti caricati:</span>
                <span className="font-medium">{knowledgeBase.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Contenuto totale:</span>
                <span className="font-medium">
                  {Math.round(knowledgeBase.reduce((acc, doc) => acc + doc.content.length, 0) / 1000)}k caratteri
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Stato:</span>
                <span className={`font-medium ${knowledgeBase.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {knowledgeBase.length > 0 ? 'Attivo' : 'Inattivo'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Analisi</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Ultima analisi:</span>
                <span className="font-medium">
                  {analysisData ? new Date().toLocaleDateString('it-IT') : 'Mai'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Keyword attuale:</span>
                <span className="font-medium">{analysisData?.keyword || 'Nessuna'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Stato:</span>
                <span className={`font-medium ${analysisData ? 'text-green-600' : 'text-slate-500'}`}>
                  {analysisData ? 'Dati disponibili' : 'Nessun dato'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;