import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, BookOpen, CheckCircle } from 'lucide-react';
import { parseWordDocument } from '../utils/documentParser';

interface KnowledgeBaseProps {
  knowledgeBase: any[];
  setKnowledgeBase: (kb: any[]) => void;
}

function KnowledgeBase({ knowledgeBase, setKnowledgeBase }: KnowledgeBaseProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Limiti configurabili
  const MAX_DOCUMENTS = 50;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB totali

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Controllo numero massimo documenti
    if (knowledgeBase.length + files.length > MAX_DOCUMENTS) {
      setUploadError(`Puoi caricare massimo ${MAX_DOCUMENTS} documenti. Attualmente ne hai ${knowledgeBase.length}.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of files) {
        // Controllo dimensione singolo file
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Il file "${file.name}" è troppo grande. Massimo ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB per file.`);
        }

        // Controllo dimensione totale
        const currentTotalSize = knowledgeBase.reduce((acc, doc) => acc + doc.size, 0);
        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
          throw new Error(`Spazio insufficiente. Massimo ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB totali.`);
        }

        if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
          throw new Error('Supportati solo file Word (.doc, .docx)');
        }

        const content = await parseWordDocument(file);
        const newDocument = {
          id: Date.now() + Math.random(),
          name: file.name,
          content: content,
          uploadDate: new Date().toISOString(),
          size: file.size
        };

        setKnowledgeBase([...knowledgeBase, newDocument]);
      }
    } catch (error) {
      console.error('Errore nell\'upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Errore nell\'upload del file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (id: number) => {
    setKnowledgeBase(knowledgeBase.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Knowledge Base del Coach
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Carica i documenti Word del tuo coach per migliorare l'analisi delle keyword. 
          L'AI userà queste informazioni per dare consigli più accurati.
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer bg-white"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            Carica Documenti Word
          </h3>
          <p className="text-sm text-slate-500">
            Supportati: .doc, .docx • Multipli file consentiti
          </p>
          
          {isUploading && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Caricamento...</span>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Documenti Caricati ({knowledgeBase.length}/{MAX_DOCUMENTS})
          </h3>
          <div className="text-sm text-slate-500">
            Spazio: {Math.round(knowledgeBase.reduce((acc, doc) => acc + doc.size, 0) / 1024 / 1024)}MB / {Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB
          </div>
        </div>

        {knowledgeBase.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-600 mb-2">
              Nessun documento caricato
            </h4>
            <p className="text-slate-500">
              Carica i documenti del tuo coach per iniziare
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeBase.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-medium text-slate-900 truncate">
                        {doc.name}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString('it-IT')}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Processato</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {doc.content.substring(0, 150)}...
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Consigli per la Knowledge Base
          </h4>
          <ul className="space-y-2 text-blue-800">
            <li>• Carica guide, strategie e best practices del tuo coach</li>
            <li>• Includi documenti su analisi competitor, nicchie profittevoli, e criteri di valutazione</li>
            <li>• Limite: {MAX_DOCUMENTS} documenti, {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB per file, {Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB totali</li>
            <li>• Più contenuto specifico carichi, migliori saranno i consigli dell'AI</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBase;