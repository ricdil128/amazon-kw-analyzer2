import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Info } from 'lucide-react';

interface ParametersConfigProps {
  parameters: AnalysisParameters;
  setParameters: (params: AnalysisParameters) => void;
}

export interface AnalysisParameters {
  bsr: {
    veryCompetitive: number;
    competitive: number;
    moderate: number;
    accessible: number;
  };
  price: {
    low: number;
    medium: number;
    high: number;
  };
  reviews: {
    few: number;
    moderate: number;
    many: number;
  };
  rating: {
    minimum: number;
    good: number;
    excellent: number;
  };
  opportunities: {
    minBSR: number;
    maxBSR: number;
    minPrice: number;
    maxReviews: number;
  };
}

export const DEFAULT_PARAMETERS: AnalysisParameters = {
  bsr: {
    veryCompetitive: 5000,
    competitive: 20000,
    moderate: 100000,
    accessible: 500000
  },
  price: {
    low: 10,
    medium: 20,
    high: 30
  },
  reviews: {
    few: 50,
    moderate: 200,
    many: 500
  },
  rating: {
    minimum: 3.5,
    good: 4.0,
    excellent: 4.5
  },
  opportunities: {
    minBSR: 20000,
    maxBSR: 100000,
    minPrice: 12,
    maxReviews: 100
  }
};

function ParametersConfig({ parameters, setParameters }: ParametersConfigProps) {
  const [localParams, setLocalParams] = useState<AnalysisParameters>(parameters);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasChanged = JSON.stringify(localParams) !== JSON.stringify(parameters);
    setHasChanges(hasChanged);
  }, [localParams, parameters]);

  const handleSave = () => {
    setParameters(localParams);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalParams(DEFAULT_PARAMETERS);
  };

  const handleRevert = () => {
    setLocalParams(parameters);
    setHasChanges(false);
  };

  const updateBSR = (key: keyof typeof localParams.bsr, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      bsr: { ...prev.bsr, [key]: value }
    }));
  };

  const updatePrice = (key: keyof typeof localParams.price, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      price: { ...prev.price, [key]: value }
    }));
  };

  const updateReviews = (key: keyof typeof localParams.reviews, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      reviews: { ...prev.reviews, [key]: value }
    }));
  };

  const updateRating = (key: keyof typeof localParams.rating, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      rating: { ...prev.rating, [key]: value }
    }));
  };

  const updateOpportunities = (key: keyof typeof localParams.opportunities, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      opportunities: { ...prev.opportunities, [key]: value }
    }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Parametri di Analisi
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Configura i criteri utilizzati per analizzare i libri e identificare le opportunità di mercato.
        </p>
      </div>

      {/* Save/Reset Controls */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600">
              {hasChanges ? 'Modifiche non salvate' : 'Parametri salvati'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleRevert}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-50"
              >
                Annulla
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center space-x-1 px-4 py-2 rounded text-sm font-medium ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Salva</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8">
        {/* BSR Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">📊 Parametri BSR (Best Seller Rank)</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Definisce le soglie di competitività basate sul ranking Amazon
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {"Libri Profittevoli (BSR <)"}
              </label>
              <input
                type="number"
                value={localParams.bsr.veryCompetitive}
                onChange={(e) => updateBSR('veryCompetitive', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Libri che vendono molto bene - alta profittabilità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Buone Vendite (BSR &lt;)
              </label>
              <input
                type="number"
                value={localParams.bsr.competitive}
                onChange={(e) => updateBSR('competitive', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Vendite discrete - buona profittabilità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Opportunità (BSR &lt;)
              </label>
              <input
                type="number"
                value={localParams.bsr.moderate}
                onChange={(e) => updateBSR('moderate', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">SWEET SPOT - accessibile ma con vendite</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nicchia (BSR &lt;)
              </label>
              <input
                type="number"
                value={localParams.bsr.accessible}
                onChange={(e) => updateBSR('accessible', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Poche vendite - verifica se c'è domanda</p>
            </div>
          </div>
        </div>

        {/* Price Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">💰 Parametri Prezzo (€)</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Definisce le fasce di prezzo per l'analisi di mercato
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fascia Bassa (&lt; €)
              </label>
              <input
                type="number"
                step="0.01"
                value={localParams.price.low}
                onChange={(e) => updatePrice('low', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Mercato di massa, volumi alti</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fascia Media (&lt; €)
              </label>
              <input
                type="number"
                step="0.01"
                value={localParams.price.medium}
                onChange={(e) => updatePrice('medium', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Sweet spot per la maggior parte delle nicchie</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fascia Alta (≥ €)
              </label>
              <input
                type="number"
                step="0.01"
                value={localParams.price.high}
                onChange={(e) => updatePrice('high', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Premium, pubblico specializzato</p>
            </div>
          </div>
        </div>

        {/* Reviews Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">⭐ Parametri Recensioni</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Soglie per valutare la saturazione del mercato
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Poche Recensioni (&lt;)
              </label>
              <input
                type="number"
                value={localParams.reviews.few}
                onChange={(e) => updateReviews('few', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Opportunità di mercato</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Recensioni Moderate (&lt;)
              </label>
              <input
                type="number"
                value={localParams.reviews.moderate}
                onChange={(e) => updateReviews('moderate', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Mercato stabilizzato</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Molte Recensioni (≥)
              </label>
              <input
                type="number"
                value={localParams.reviews.many}
                onChange={(e) => updateReviews('many', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Mercato maturo/saturo</p>
            </div>
          </div>
        </div>

        {/* Rating Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">🌟 Parametri Rating</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Soglie di qualità per valutare i competitor
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rating Minimo
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={localParams.rating.minimum}
                onChange={(e) => updateRating('minimum', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Soglia minima accettabile</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rating Buono
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={localParams.rating.good}
                onChange={(e) => updateRating('good', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Standard di qualità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rating Eccellente
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={localParams.rating.excellent}
                onChange={(e) => updateRating('excellent', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Benchmark di eccellenza</p>
            </div>
          </div>
        </div>

        {/* Opportunities Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">🎯 Parametri Opportunità</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Criteri per identificare le migliori opportunità di mercato
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                BSR Minimo Opportunità
              </label>
              <input
                type="number"
                value={localParams.opportunities.minBSR}
                onChange={(e) => updateOpportunities('minBSR', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">BSR minimo per considerare un'opportunità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                BSR Massimo Opportunità
              </label>
              <input
                type="number"
                value={localParams.opportunities.maxBSR}
                onChange={(e) => updateOpportunities('maxBSR', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">BSR massimo per considerare un'opportunità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prezzo Minimo Opportunità (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={localParams.opportunities.minPrice}
                onChange={(e) => updateOpportunities('minPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Prezzo minimo per profittabilità</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Recensioni Opportunità
              </label>
              <input
                type="number"
                value={localParams.opportunities.maxReviews}
                onChange={(e) => updateOpportunities('maxReviews', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Max recensioni per considerare mercato non saturo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Anteprima Criteri Attuali
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">BSR</h5>
              <ul className="space-y-1 text-blue-700">
                <li>• Libri profittevoli: &lt; {localParams.bsr.veryCompetitive.toLocaleString()}</li>
                <li>• Buone vendite: &lt; {localParams.bsr.competitive.toLocaleString()}</li>
                <li>• Opportunità: &lt; {localParams.bsr.moderate.toLocaleString()}</li>
                <li>• Nicchia: &lt; {localParams.bsr.accessible.toLocaleString()}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Prezzi</h5>
              <ul className="space-y-1 text-blue-700">
                <li>• Fascia bassa: &lt; €{localParams.price.low}</li>
                <li>• Fascia bassa: &lt; €{localParams.price.low}</li>
                <li>• Fascia media: €{localParams.price.low} - €{localParams.price.medium}</li>
                <li>• Fascia alta: ≥ €{localParams.price.high}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Opportunità</h5>
              <ul className="space-y-1 text-blue-700">
                <li>• BSR: {localParams.opportunities.minBSR.toLocaleString()} - {localParams.opportunities.maxBSR.toLocaleString()}</li>
                <li>• Prezzo min: €{localParams.opportunities.minPrice}</li>
                <li>• Max recensioni: {localParams.opportunities.maxReviews}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Rating</h5>
              <ul className="space-y-1 text-blue-700">
                <li>• Minimo: {localParams.rating.minimum}</li>
                <li>• Buono: {localParams.rating.good}</li>
                <li>• Eccellente: {localParams.rating.excellent}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParametersConfig;