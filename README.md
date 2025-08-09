# Amazon KW Analyzer

Un'applicazione web avanzata per l'analisi delle keyword Amazon KDP, progettata per aiutare gli autori a identificare opportunità di mercato profittevoli.

## 🚀 Caratteristiche

- **Analisi CSV**: Carica file CSV con dati dei libri per analisi immediate
- **Knowledge Base**: Sistema di gestione documenti per migliorare l'analisi AI
- **Dashboard Completa**: Visualizzazione dettagliata delle metriche e opportunità
- **Parametri Configurabili**: Personalizza i criteri di analisi secondo le tue strategie
- **Calcoli KDP Reali**: Formule ufficiali Amazon per costi di stampa e royalty
- **Export Dati**: Esporta risultati in formato CSV per ulteriori analisi

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **OCR**: Tesseract.js (per analisi screenshot)

## 📦 Installazione

1. Clona il repository:
```bash
git clone https://github.com/tuousername/amazon-kw-analyzer.git
cd amazon-kw-analyzer
```

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia il server di sviluppo:
```bash
npm run dev
```

4. Apri il browser su `http://localhost:5173`

## 🎯 Come Usare

### 1. Carica File CSV
- Vai alla sezione "Analizza Screenshot"
- Carica un file CSV con i dati dei libri Amazon
- Il sistema analizzerà automaticamente i dati

### 2. Configura Knowledge Base
- Carica documenti Word del tuo coach nella sezione "Knowledge Base"
- L'AI userà questi documenti per consigli più accurati

### 3. Personalizza Parametri
- Vai alla sezione "Parametri" per configurare:
  - Soglie BSR per competitività
  - Fasce di prezzo
  - Criteri per identificare opportunità

### 4. Visualizza Dashboard
- La dashboard mostra statistiche complete
- Raccomandazioni basate sui tuoi criteri
- Stato del sistema e knowledge base

## 📊 Formato CSV Supportato

Il sistema riconosce automaticamente colonne con questi nomi:
- `Book Title`, `Title`, `Titolo`
- `Author`, `Autore`
- `Price`, `Prezzo`
- `Sales Rank`, `BSR`, `Ranking`
- `Rating`, `Reviews`, `Valutazione`
- `Pages`, `Pagine`, `Length`
- `Format`, `Formato`
- `Published Date`, `Date Published`

## 🔧 Scripts Disponibili

- `npm run dev` - Avvia server di sviluppo
- `npm run build` - Build per produzione
- `npm run preview` - Preview build di produzione
- `npm run lint` - Controlla codice con ESLint

## 📈 Funzionalità Avanzate

### Calcoli KDP Reali
- Costi di stampa basati su formule ufficiali Amazon
- Calcolo royalty accurate per Paperback e Kindle
- Stima vendite mensili basata su BSR

### Analisi Intelligente
- Identificazione automatica opportunità profittevoli
- Analisi competitività mercato
- Raccomandazioni strategiche personalizzate

### Persistenza Dati
- Salvataggio automatico in localStorage
- Mantiene analisi, knowledge base e parametri
- Ripristino automatico al riavvio

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🙏 Ringraziamenti

- Amazon KDP per le API e documentazione
- Community degli autori self-publishing
- Contributori open source

## 📞 Supporto

Per supporto o domande:
- Apri un issue su GitHub
- Contatta: [tua-email@example.com]

---

**Nota**: Questo strumento è per scopi educativi e di ricerca. Assicurati di rispettare i termini di servizio di Amazon quando usi i dati.