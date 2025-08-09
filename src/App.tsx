import React, { useState } from 'react';
import { Upload, FileText, Search, BarChart3, BookOpen, Sparkles, Settings } from 'lucide-react';
import UploadSection from './components/UploadSection';
import AnalysisResults from './components/AnalysisResults';
import KnowledgeBase from './components/KnowledgeBase';
import Dashboard from './components/Dashboard';
import ParametersConfig, { DEFAULT_PARAMETERS, type AnalysisParameters } from './components/ParametersConfig';

type TabType = 'upload' | 'results' | 'knowledge' | 'dashboard' | 'parameters';

// Funzioni per persistenza localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Errore nel salvare in localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Errore nel caricare da localStorage:', error);
    return defaultValue;
  }
};
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [analysisData, setAnalysisData] = useState(() => 
    loadFromLocalStorage('amazon-analyzer-analysis', null)
  );
  const [knowledgeBase, setKnowledgeBase] = useState(() => 
    loadFromLocalStorage('amazon-analyzer-knowledge', [])
  );
  const [parameters, setParameters] = useState<AnalysisParameters>(() => 
    loadFromLocalStorage('amazon-analyzer-parameters', DEFAULT_PARAMETERS)
  );

  // Salva automaticamente quando cambiano i dati
  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    saveToLocalStorage('amazon-analyzer-analysis', data);
  };

  const handleKnowledgeBaseUpdate = (kb: any[]) => {
    setKnowledgeBase(kb);
    saveToLocalStorage('amazon-analyzer-knowledge', kb);
  };

  const handleParametersUpdate = (params: AnalysisParameters) => {
    setParameters(params);
    saveToLocalStorage('amazon-analyzer-parameters', params);
  };

  const tabs = [
    { id: 'upload', label: 'Analizza Screenshot', icon: Upload },
    { id: 'results', label: 'Risultati', icon: BarChart3 },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'parameters', label: 'Parametri', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Amazon KW Analyzer</h1>
                <p className="text-sm text-slate-600">Analisi intelligente delle keyword per libri</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <UploadSection 
            onAnalysisComplete={handleAnalysisComplete}
            knowledgeBase={knowledgeBase}
            parameters={parameters}
          />
        )}
        {activeTab === 'results' && (
          <AnalysisResults 
            data={analysisData}
            knowledgeBase={knowledgeBase}
            parameters={parameters}
          />
        )}
        {activeTab === 'knowledge' && (
          <KnowledgeBase 
            knowledgeBase={knowledgeBase}
            setKnowledgeBase={handleKnowledgeBaseUpdate}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard 
            analysisData={analysisData}
            knowledgeBase={knowledgeBase}
          />
        )}
        {activeTab === 'parameters' && (
          <ParametersConfig 
            parameters={parameters}
            setParameters={handleParametersUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;