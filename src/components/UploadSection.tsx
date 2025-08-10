import React, { useState, useRef } from 'react';
import { Upload, Loader, AlertCircle, FileText } from 'lucide-react';
import type { AnalysisParameters } from './ParametersConfig';

interface UploadSectionProps {
  onAnalysisComplete: (data: any) => void;
  knowledgeBase: any[];
  parameters: AnalysisParameters;
}

function UploadSection({ onAnalysisComplete, knowledgeBase, parameters }: UploadSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selezionato:', file.name);
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    // Simula processing per vedere se lo stato funziona
    setTimeout(() => {
      processCSVFile(file);
    }, 100);
  };

  // Funzione per parsare date di pubblicazione
  const parsePublicationDate = (value: string): Date | undefined => {
    if (!value || typeof value !== 'string') return undefined;
    
    const cleaned = value.trim();
    
    // Filtra contenuti che non sono date
    if (cleaned.length > 50 || 
        cleaned.includes('Kindle') || 
        cleaned.includes('Fire') || 
        cleaned.includes('Tablet') ||
        cleaned.includes('Generation') ||
        cleaned.includes('E-reader')) {
      return undefined;
    }
    
    // Pattern per diversi formati di data
    const datePatterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY o DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let year, month, day;
        
        if (pattern.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else if (pattern.source.includes('(\\d{4})$')) {
          // MM/DD/YYYY o DD/MM/YYYY o DD-MM-YYYY
          const [, first, second, yearStr] = match;
          year = yearStr;
          
          // Auto-detect: se il primo numero > 12, è DD/MM
          if (parseInt(first) > 12) {
            day = first;
            month = second;
          } else {
            month = first;
            day = second;
          }
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Validazione: data ragionevole (tra 2000 e oggi + 1 anno)
        const now = new Date();
        const minDate = new Date(2000, 0, 1);
        const maxDate = new Date(now.getFullYear() + 1, 11, 31);
        
        if (date >= minDate && date <= maxDate) {
          return date;
        }
      }
    }
    
    // Fallback: prova Date.parse
    try {
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        const now = new Date();
        if (parsed.getFullYear() >= 2000 && parsed <= new Date(now.getFullYear() + 1, 11, 31)) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignora errori di parsing
    }
    
    return undefined;
  };

  const processCSVFile = async (file: File) => {
    try {
      console.log('Inizio lettura CSV...');
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Per favore carica solo file CSV');
      }

      const text = await file.text();
      console.log('Testo CSV letto:', text.substring(0, 200) + '...');
      
      const lines = text.split('\n').filter(line => line.trim());
      console.log('Righe trovate:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('Il file CSV deve contenere almeno un header e una riga di dati');
      }

      // Analizza l'header per trovare le colonne
      const header = lines[0].toLowerCase();
      const headerColumns = header.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      console.log('Header trovato:', headerColumns);
      
      // Trova gli indici delle colonne
      const getColumnIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const index = headerColumns.findIndex(col => {
            const colLower = col.toLowerCase().trim();
            return colLower === name.toLowerCase() || colLower.includes(name.toLowerCase());
          });
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const columnIndices = {
        title: getColumnIndex(['title', 'book title', 'titolo']),
        author: getColumnIndex(['author', 'autore']),
        price: getColumnIndex(['price', 'prezzo']),
        salesRank: getColumnIndex(['sales rank', 'bsr', 'ranking']),
        rating: getColumnIndex(['reviews', 'rating', 'valutazione', 'stelle']),
        reviews: getColumnIndex(['rev.', 'recensioni', 'review count']),
        estSales: getColumnIndex(['est. sales', 'estimated sales', 'stima vendite']),
        salesRev: getColumnIndex(['sales rev.', 'sales rev', 'sales revenue', 'ricavi', 'incassi', 'revenue']),
        pages: getColumnIndex(['pages', 'pagine', 'length']),
        format: getColumnIndex(['format', 'formato']),
        published: getColumnIndex(['date of publication', 'publication date', 'published date', 'published', 'date published']),
        asin: getColumnIndex(['asin', 'isbn']),
        bookUrl: getColumnIndex(['book url', 'url', 'link', 'amazon url', 'product url'])
      };
      
      console.log('Indici colonne trovati:', columnIndices);
      const books = [];
      
      // Salta l'header e processa le righe
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split CSV più robusto (gestisce virgole dentro le virgolette)
        const values = parseCSVLine(line);
        console.log(`Riga ${i}:`, values);
        
        if (values.length >= Math.max(columnIndices.title, columnIndices.author, columnIndices.price) + 1) {
          const book = {
            title: columnIndices.title >= 0 ? (values[columnIndices.title] || `Libro ${i}`) : `Libro ${i}`,
            author: columnIndices.author >= 0 ? (values[columnIndices.author] || 'Autore sconosciuto') : 'Autore sconosciuto',
            price: columnIndices.price >= 0 ? parsePrice(values[columnIndices.price]) : 0,
            bsr: columnIndices.salesRank >= 0 ? parseInteger(values[columnIndices.salesRank]) : undefined,
            rating: columnIndices.rating >= 0 ? parseInteger(values[columnIndices.rating]) : undefined,
            reviews: columnIndices.reviews >= 0 ? parseInteger(values[columnIndices.reviews]) : undefined,
            estSales: columnIndices.estSales >= 0 ? values[columnIndices.estSales] : undefined,
            salesRevenue: columnIndices.salesRev >= 0 ? parsePrice(values[columnIndices.salesRev]) : null,
            pages: columnIndices.pages >= 0 ? parseInteger(values[columnIndices.pages]) : undefined,
            format: columnIndices.format >= 0 ? values[columnIndices.format] : undefined,
            published: columnIndices.published >= 0 ? (() => {
              const date = parsePublicationDate(values[columnIndices.published]);
              return date instanceof Date ? date.toLocaleDateString('it-IT') : undefined;
            })() : undefined,
            asin: columnIndices.asin >= 0 ? values[columnIndices.asin] : undefined,
            bookUrl: columnIndices.bookUrl >= 0 ? extractURLFromHyperlink(values[columnIndices.bookUrl]) : undefined,
            angle: extractAngleFromTitle(values[columnIndices.title] || ''),
            originalOrder: i // Mantieni l'ordine originale del CSV
          };
          
          // Aggiungi campi calcolati
          book.salesEstimate = book.estSales || 'N/A';
          book.potential = getPotential(book.bsr || 999999);
          
          books.push(book);
          console.log('Libro aggiunto:', book.title);
        }
      }

      if (books.length === 0) {
        throw new Error('Nessun libro valido trovato nel CSV');
      }

      console.log(`Totale libri processati: ${books.length}`);

      // Calcola statistiche
      const bsrBooks = books.filter(b => b.bsr);
      const priceBooks = books.filter(b => b.price > 0);
      
      const avgBSR = bsrBooks.length > 0 ? 
        Math.round(bsrBooks.reduce((acc, b) => acc + (b.bsr || 0), 0) / bsrBooks.length) : 0;
      
      const avgPrice = priceBooks.length > 0 ? 
        priceBooks.reduce((acc, b) => acc + b.price, 0) / priceBooks.length : 0;
      
      const opportunities = books.filter(b => b.bsr && b.bsr < 20000).length;

      const analysisResults = {
        keyword: `CSV: ${file.name}`,
        uploadDate: new Date().toLocaleString('it-IT'),
        fileName: file.name,
        books,
        analysis: {
          totalBooks: books.length,
          averageBSR: avgBSR,
          averagePrice: avgPrice,
          opportunities: books.filter(b => {
            // Criteri realistici per opportunità profittevoli
            const bsr = b.bsr || 999999;
            const price = b.price || 0; // Assumiamo che sia già in dollari o convertibile
            const reviews = b.reviews || 0;
            
            // Debug completo
            console.log('=== LIBRO DEBUG ===');
            console.log('Titolo:', b.title?.substring(0, 30));
            console.log('BSR:', bsr);
            console.log('Prezzo:', price);
            console.log('Recensioni:', reviews);
            console.log('EstSales raw:', b.estSales);
            console.log('Pages:', b.pages);
            console.log('Tutti i campi libro:', Object.keys(b));
            
            // Debug: logga i valori per capire cosa sta succedendo
            if (bsr < 60000 && price > 15) { // Abbasso temporaneamente a €15 per test
              console.log('Libro candidato:', {
                title: b.title?.substring(0, 30),
                bsr,
                price,
                reviews,
                estSales: b.estSales
              });
            }
            
            // Calcola incasso netto mensile
            const pages = b.pages || 200;
            const isLarge = pages > 150;
            const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
            
            // Prova diversi modi per estrarre le vendite mensili
            let monthlySales = 0;
            if (b.estSales) {
              if (typeof b.estSales === 'string') {
                monthlySales = parseFloat(b.estSales.replace(/[^\d.-]/g, '')) || 0;
              } else if (typeof b.estSales === 'number') {
                monthlySales = b.estSales;
              }
            }
            
            // Se non abbiamo vendite stimate, stimale dal BSR
            if (monthlySales === 0 && bsr < 999999) {
              if (bsr < 1000) monthlySales = 500;
              else if (bsr < 5000) monthlySales = 200;
              else if (bsr < 20000) monthlySales = 50;
              else if (bsr < 60000) monthlySales = 20;
              else monthlySales = 5;
            }
            
            console.log('Vendite mensili calcolate:', monthlySales);
            
            let royalty = (price * 0.60) - printingCost;
            if (monthlySales > 1000) royalty += 2;
            const monthlyRevenue = royalty * monthlySales;
            
            console.log('Calcoli finali:', {
              printingCost,
              royalty,
              monthlyRevenue
            });
            
            // Debug: logga il calcolo
            if (bsr < 60000 && price > 15) {
              console.log('Calcolo profitto:', {
                printingCost,
                monthlySales,
                royalty,
                monthlyRevenue
              });
            }
            
            const isOpportunity = bsr < 60000 && 
                   price > 15 && // Abbasso temporaneamente per test
                   reviews < 150 && 
                   monthlyRevenue > 200; // Abbasso temporaneamente per test
                   
            console.log('È opportunità?', isOpportunity);
            console.log('==================');
            
            return isOpportunity;
          }).length,
          insights: generateCSVInsights(books, avgBSR, avgPrice, opportunities, parameters),
          ocrConfidence: 100,
          extractedDataQuality: 'Eccellente (CSV)'
        }
      };

      console.log('Risultati analisi:', analysisResults);
      
      onAnalysisComplete(analysisResults);
      setSuccess(`✅ CSV caricato con successo! ${books.length} libri analizzati.`);
      
    } catch (error) {
      console.error('Errore CSV:', error);
      setError(error instanceof Error ? error.message : 'Errore durante l\'analisi del CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  // Funzione per parsare una riga CSV gestendo virgolette
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Funzione per estrarre URL da formule Excel HYPERLINK
  const extractURLFromHyperlink = (value: string): string => {
    if (!value) return '';
    
    // Rimuovi virgolette esterne se presenti
    let cleaned = value.replace(/^"|"$/g, '');
    
    // Se è una formula HYPERLINK di Excel - pattern più flessibile
    if (cleaned.includes('=HYPERLINK(')) {
      // Cerca pattern =HYPERLINK("URL") o =HYPERLINK(URL) 
      const patterns = [
        /=HYPERLINK\("([^"]+)"/,  // Con virgolette
        /=HYPERLINK\(([^)]+)\)/   // Senza virgolette
      ];
      
      for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
          cleaned = match[1];
          console.log('URL estratto da HYPERLINK:', cleaned);
          break;
        }
      }
    }
    
    // Pulisci e valida l'URL
    cleaned = cleaned.trim();
    
    // Se non inizia con http, aggiungilo
    if (cleaned && !cleaned.startsWith('http')) {
      cleaned = 'https://' + cleaned;
    }
    
    // Verifica che sia un URL Amazon valido
    if (cleaned && (cleaned.includes('amazon.com') || cleaned.includes('amazon.it') || cleaned.includes('amazon.co.uk'))) {
      return cleaned;
    }
    
    return '';
  };
  
  // Funzione per parsare numeri interi (gestisce migliaia con virgole)
  const parseInteger = (value: string): number | undefined => {
    if (!value) return undefined;
    
    // Rimuovi tutto tranne numeri, virgole e punti
    const cleaned = value.toString().replace(/[^\d.,]/g, '');
    if (!cleaned) return undefined;
    
    // Se contiene virgola seguita da 3 cifre, è un separatore delle migliaia
    // Esempi: "4,487" = 4487, "1,234.56" = 1234 (parte intera)
    let numberStr = cleaned;
    
    // Pattern per migliaia: numero,XXX (dove XXX sono esattamente 3 cifre)
    if (/\d+,\d{3}(\.\d+)?$/.test(cleaned)) {
      // È un separatore delle migliaia, rimuovi la virgola
      numberStr = cleaned.replace(',', '');
    } else if (/\d+\.\d{3}(\,\d+)?$/.test(cleaned)) {
      // Formato europeo: 1.234,56 - rimuovi il punto delle migliaia
      numberStr = cleaned.replace('.', '');
    }
    
    // Prendi solo la parte intera (prima del punto decimale)
    const integerPart = numberStr.split(/[.,]/)[0];
    const number = parseInt(integerPart);
    return isNaN(number) ? undefined : number;
  };
  
  // Funzione per parsare prezzi (gestisce decimali)
  const parsePrice = (value: string): number => {
    if (!value) return 0;
    
    const cleaned = value.toString().replace(/[^\d.,]/g, '');
    if (!cleaned) return 0;
    
    // Converti virgola in punto per decimali
    const normalized = cleaned.replace(',', '.');
    const price = parseFloat(normalized);
    return isNaN(price) ? 0 : price;
  };
  
  // Estrai angolo dal titolo
  const extractAngleFromTitle = (title: string): string => {
    if (!title) return 'N/A';
    
    const angles = [
      'Complete Guide', 'Beginner', 'Advanced', 'Ultimate', 'Definitive',
      'Step by Step', 'Practical', 'Essential', 'Comprehensive', 'Mastery'
    ];
    
    const titleLower = title.toLowerCase();
    for (const angle of angles) {
      if (titleLower.includes(angle.toLowerCase())) {
        return angle;
      }
    }
    
    // Fallback: prime 3 parole
    const words = title.split(' ').slice(0, 3).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const getSalesEstimate = (bsr: number): string => {
    if (bsr < 1000) return '500+ vendite/mese';
    if (bsr < 5000) return '100-500 vendite/mese';
    if (bsr < 20000) return '20-100 vendite/mese';
    if (bsr < 100000) return '5-20 vendite/mese';
    return '<5 vendite/mese';
  };

  const getPotential = (bsr: number): string => {
    if (bsr < 5000) return 'Molto Alto';
    if (bsr < 20000) return 'Alto';
    if (bsr < 100000) return 'Medio';
    return 'Basso';
  };

  const generateCSVInsights = (books: any[], avgBSR: number, avgPrice: number, opportunities: number, params: AnalysisParameters): string => {
    // Usa la knowledge base per consigli specifici
    const kbInsights = generateKnowledgeBaseInsights(books, knowledgeBase, params);
    
    let insights = `📊 ANALISI DETTAGLIATA MERCATO:\n\n`;
    
    // Analisi competitività dettagliata
    const veryCompetitive = books.filter(b => b.bsr && b.bsr < params.bsr.veryCompetitive).length;
    const competitive = books.filter(b => b.bsr && b.bsr >= params.bsr.veryCompetitive && b.bsr < params.bsr.competitive).length;
    const moderate = books.filter(b => b.bsr && b.bsr >= params.bsr.competitive && b.bsr < params.bsr.moderate).length;
    const lowCompetition = books.filter(b => b.bsr && b.bsr >= params.bsr.moderate).length;
    
    // Usa i nuovi range fissi richiesti
    const veryProfitable = books.filter(b => b.bsr && b.bsr < 30000).length;
    const goodSales = books.filter(b => b.bsr && b.bsr >= 30000 && b.bsr < 60000).length;
    const moderateSales = books.filter(b => b.bsr && b.bsr >= 60000 && b.bsr < 120000).length;
    const poorSales = books.filter(b => b.bsr && b.bsr >= 120000).length;
    
    insights += `🎯 DISTRIBUZIONE PERFORMANCE VENDITE:\n`;
    insights += `• Molto profittevoli (BSR < 30.000): ${veryProfitable} libri\n`;
    insights += `• Buone vendite (BSR 30.000-60.000): ${goodSales} libri\n`;
    insights += `• Vendite moderate (BSR 60.000-120.000): ${moderateSales} libri\n`;
    insights += `• Vendite scarse (BSR > 120.000): ${poorSales} libri\n\n`;
    
    // Analisi fascia prezzo con range fissi
    const lowPriceFixed = books.filter(b => b.price > 0 && b.price < 15).length;
    const midPriceFixed = books.filter(b => b.price >= 15 && b.price <= 22).length;
    const highPriceFixed = books.filter(b => b.price > 22).length;
    
    insights += `💰 DISTRIBUZIONE PREZZI:\n`;
    insights += `• Fascia bassa (< $15): ${lowPriceFixed} libri\n`;
    insights += `• Fascia media ($15-22): ${midPriceFixed} libri\n`;
    insights += `• Fascia alta (> $22): ${highPriceFixed} libri\n\n`;
    
    // Raccomandazioni strategiche basate sui dati
    insights += `🎯 RACCOMANDAZIONI STRATEGICHE:\n\n`;
    
    // Analisi profittabilità
    const profitablePercentage = ((veryProfitable + goodSales) / books.length) * 100;
    if (profitablePercentage > 60) {
      insights += `🔥 MERCATO MOLTO PROFITTEVOLE (${Math.round(profitablePercentage)}% libri vendono bene):\n`;
      insights += `• Mercato saturo ma con alta domanda - serve eccellenza\n`;
      insights += `• Molti libri hanno successo ma la concorrenza è feroce\n`;
      insights += `• Necessario contenuto superiore e marketing aggressivo\n`;
      insights += `• Considera sottocategorie meno competitive\n\n`;
    } else if (profitablePercentage > 30) {
      insights += `✅ MERCATO EQUILIBRATO (${Math.round(profitablePercentage)}% libri vendono bene):\n`;
      insights += `• SWEET SPOT: C'è domanda ma non troppa saturazione\n`;
      insights += `• Buone opportunità con contenuto di qualità\n`;
      insights += `• Analizza gap negli angoli di attacco dei bestseller\n`;
      insights += `• Prezzo competitivo ma non necessariamente il più basso\n\n`;
    } else if (profitablePercentage > 10) {
      insights += `⚠️ MERCATO DIFFICILE (${Math.round(profitablePercentage)}% libri vendono bene):\n`;
      insights += `• Pochi libri hanno successo - mercato molto selettivo\n`;
      insights += `• Domanda limitata o nicchia molto specifica\n`;
      insights += `• Necessario contenuto eccezionale per emergere\n`;
      insights += `• Considera se vale la pena investire tempo/risorse\n\n`;
    } else {
      insights += `🚫 MERCATO NON PROFITTEVOLE (${Math.round(profitablePercentage)}% libri vendono bene):\n`;
      insights += `• BSR medio troppo alto (${Math.round(avgBSR).toLocaleString()}) = vendite scarse\n`;
      insights += `• Praticamente nessun libro vende bene in questa nicchia\n`;
      insights += `• SCONSIGLIATO: cerca keyword con più domanda\n`;
      insights += `• Considera nicchie correlate ma più popolari\n\n`;
    }
    
    // Analisi prezzi e strategia
    const avgPriceValid = books.filter(b => b.price > 0);
    if (avgPriceValid.length > 0) {
      const realAvgPrice = avgPriceValid.reduce((acc, b) => acc + b.price, 0) / avgPriceValid.length;
      
      if (realAvgPrice > 25) {
        if (profitablePercentage > 30) {
          insights += `💎 MERCATO PREMIUM (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Pubblico disposto a investire in qualità\n`;
          insights += `• Punta su contenuto approfondito e professionale\n`;
          insights += `• Considera formato hardcover o bundle\n`;
          insights += `• Marketing verso professionisti/esperti\n\n`;
        } else {
          insights += `⚠️ PREZZI ALTI MA NESSUNO VENDE (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Prezzi alti ma BSR pessimi = nessuna domanda reale\n`;
          insights += `• Il pubblico NON è disposto a pagare questi prezzi\n`;
          insights += `• Mercato inesistente o saturato da competitor migliori\n`;
          insights += `• SCONSIGLIATO: cerca nicchie con domanda verificata\n\n`;
        }
      } else if (realAvgPrice > 15) {
        if (profitablePercentage > 20) {
          insights += `💰 FASCIA MEDIA-ALTA (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Sweet spot per la maggior parte delle nicchie\n`;
          insights += `• Equilibrio tra accessibilità e profittabilità\n`;
          insights += `• Punta su valore percepito alto\n`;
          insights += `• Possibile upselling con bonus/risorse\n\n`;
        } else {
          insights += `⚠️ FASCIA MEDIA MA NESSUNO VENDE (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Prezzi ragionevoli ma performance pessime\n`;
          insights += `• Problema di domanda, non di prezzo\n`;
          insights += `• Mercato morto o dominato da pochi player\n`;
          insights += `• Cerca nicchie con più movimento\n\n`;
        }
      } else if (realAvgPrice > 8) {
        if (profitablePercentage > 15) {
          insights += `💵 FASCIA MEDIA (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Mercato di massa, serve volume alto\n`;
          insights += `• Ottimizza per conversioni e recensioni\n`;
          insights += `• Considera serie di libri correlati\n`;
          insights += `• Focus su marketing organico\n\n`;
        } else {
          insights += `💸 FASCIA MEDIA MA MERCATO MORTO (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
          insights += `• Anche con prezzi accessibili nessuno vende\n`;
          insights += `• Zero domanda per questa keyword\n`;
          insights += `• Non è un problema di prezzo ma di mercato\n`;
          insights += `• EVITA questa nicchia completamente\n\n`;
        }
      } else {
        insights += `⚠️ FASCIA BASSA (prezzo medio €${realAvgPrice.toFixed(2)}):\n`;
        if (profitablePercentage > 10) {
          insights += `• Gara al ribasso - difficile profittabilità\n`;
          insights += `• Necessari volumi enormi per guadagni decenti\n`;
          insights += `• Considera nicchia più premium\n`;
          insights += `• Valuta formati alternativi (audiolibro, corso)\n\n`;
        } else {
          insights += `• Prezzi bassi E nessuno vende = mercato completamente morto\n`;
          insights += `• Neanche con prezzi stracciati c'è domanda\n`;
          insights += `• Keyword da evitare assolutamente\n`;
          insights += `• Cerca mercati con almeno qualche segnale di vita\n\n`;
        }
      }
    }
    
    // Analisi opportunità specifiche
    const goodOpportunities = books.filter(b => {
      // Criteri realistici per opportunità profittevoli
      const bsr = b.bsr || 999999;
      const price = b.price || 0;
      const reviews = b.reviews || 0;
      
      // Calcola incasso netto mensile
      const pages = b.pages || 200;
      const isLarge = pages > 150;
      const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
      const monthlySales = parseFloat(b.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
      let royalty = (price * 0.60) - printingCost;
      if (monthlySales > 1000) royalty += 2;
      const monthlyRevenue = royalty * monthlySales;
      
      return bsr < 60000 && 
             price > 18 && 
             reviews < 150 && 
             monthlyRevenue > 500;
    });
    
    if (goodOpportunities.length > 0) {
      insights += `🎯 VERE OPPORTUNITÀ PROFITTEVOLI (${goodOpportunities.length} libri):\n`;
      insights += `• BSR < 60.000 (vendite buone e raggiungibili)\n`;
      insights += `• Prezzo > $18 (fascia profittevole)\n`;
      insights += `• Recensioni < 150 (mercato non saturo)\n`;
      insights += `• Incasso netto > $500/mese (realmente profittevole)\n`;
      insights += `• Questi sono i libri da studiare e superare!\n\n`;
      
      // Mostra i primi 3 libri opportunità
      insights += `📋 TOP OPPORTUNITÀ DA ANALIZZARE:\n`;
      goodOpportunities.slice(0, 3).forEach((book, i) => {
        const pages = book.pages || 200;
        const isLarge = pages > 150;
        const printingCost = 1.00 + (pages * (isLarge ? 0.017 : 0.012));
        const monthlySales = parseFloat(book.estSales?.toString().replace(/[^\d.-]/g, '')) || 0;
        let royalty = (book.price * 0.60) - printingCost;
        if (monthlySales > 1000) royalty += 2;
        const monthlyRevenue = royalty * monthlySales;
        
        insights += `${i+1}. "${book.title.substring(0, 40)}..."\n`;
        insights += `   BSR: ${book.bsr?.toLocaleString()} | $${book.price} | ${book.reviews || 0} recensioni | $${Math.round(monthlyRevenue)}/mese\n`;
      });
      insights += `\n`;
    }
    
    // Consigli finali
    insights += `📋 PROSSIMI PASSI:\n`;
    insights += `1. Analizza i titoli dei libri con BSR ${params.opportunities.minBSR.toLocaleString()}-${params.opportunities.maxBSR.toLocaleString()}\n`;
    insights += `2. Identifica gap negli angoli di attacco\n`;
    insights += `3. Studia le recensioni negative per miglioramenti\n`;
    insights += `4. Valuta sottocategorie meno competitive\n`;
    insights += `5. Testa il mercato con contenuto gratuito prima\n`;
    
    // Aggiungi insights dalla knowledge base
    
    return insights;
  };

  const generateKnowledgeBaseInsights = (books: any[], knowledgeBase: any[], params: AnalysisParameters): string => {
    // Funzione rimossa - non genera più insights dalla knowledge base
    return '';
  };

  const extractBSRCriteria = (kbContent: string): string => {
    let criteria = '';
    
    // Cerca pattern per BSR nella knowledge base
    if (kbContent.includes('sotto 5.000') || kbContent.includes('sotto 5000')) {
      criteria += '• BSR sotto 5.000: Mercato molto competitivo (dalla tua KB)\n';
    }
    if (kbContent.includes('5.000-20.000') || kbContent.includes('5000-20000')) {
      criteria += '• BSR 5.000-20.000: Competitivo ma con opportunità (dalla tua KB)\n';
    }
    if (kbContent.includes('20.000-100.000') || kbContent.includes('20000-100000')) {
      criteria += '• BSR 20.000-100.000: Range ideale per principianti (dalla tua KB)\n';
    }
    if (kbContent.includes('sopra 100.000') || kbContent.includes('sopra 100000')) {
      criteria += '• BSR sopra 100.000: Mercato di nicchia (dalla tua KB)\n';
    }
    
    return criteria;
  };

  const extractPriceCriteria = (kbContent: string): string => {
    let criteria = '';
    
    // Cerca pattern per prezzi nella knowledge base
    if (kbContent.includes('€8-12') || kbContent.includes('8-12')) {
      criteria += '• Fascia €8-12: Mercato di massa, servono volumi alti (dalla tua KB)\n';
    }
    if (kbContent.includes('€12-20') || kbContent.includes('12-20')) {
      criteria += '• Fascia €12-20: Sweet spot per most niches (dalla tua KB)\n';
    }
    if (kbContent.includes('€20+') || kbContent.includes('sopra €20')) {
      criteria += '• Fascia €20+: Premium, pubblico specializzato (dalla tua KB)\n';
    }
    if (kbContent.includes('sotto €5') || kbContent.includes('prezzi sotto')) {
      criteria += '• Prezzi sotto €5: Gara al ribasso da evitare (dalla tua KB)\n';
    }
    
    return criteria;
  };

  const extractStrategies = (kbContent: string): string => {
    let strategies = '';
    
    // Cerca strategie specifiche nella KB
    if (kbContent.includes('angolo specifico') || kbContent.includes('angolo di attacco')) {
      strategies += '• Trova un angolo specifico non coperto (dalla tua metodologia)\n';
    }
    if (kbContent.includes('target demografici') || kbContent.includes('demografico')) {
      strategies += '• Considera target demografici specifici (dalla tua metodologia)\n';
    }
    if (kbContent.includes('workbook') || kbContent.includes('formato diverso')) {
      strategies += '• Valuta formati diversi (workbook, checklist, etc.) (dalla tua metodologia)\n';
    }
    if (kbContent.includes('copertine accattivanti') || kbContent.includes('copertina')) {
      strategies += '• Investi in copertine accattivanti e professionali (dalla tua metodologia)\n';
    }
    if (kbContent.includes('recensioni') && kbContent.includes('20')) {
      strategies += '• Punta su libri con meno di 20 recensioni (dalla tua metodologia)\n';
    }
    
    return strategies;
  };

  const extractRedFlags = (kbContent: string): string => {
    let redFlags = '';
    
    // Cerca red flags nella KB
    if (kbContent.includes('troppi libri') && kbContent.includes('how to')) {
      redFlags += '• Evita mercati con troppi libri "How to" generici (dalla tua KB)\n';
    }
    if (kbContent.includes('titoli identici') || kbContent.includes('titoli simili')) {
      redFlags += '• Attenzione a titoli identici o molto simili (dalla tua KB)\n';
    }
    if (kbContent.includes('bsr che fluttuano') || kbContent.includes('instabilità')) {
      redFlags += '• Evita BSR che fluttuano troppo (instabilità) (dalla tua KB)\n';
    }
    if (kbContent.includes('mercato in declino') || kbContent.includes('declino')) {
      redFlags += '• Attenzione ai mercati in declino (dalla tua KB)\n';
    }
    
    return redFlags;
  };

  const applyKnowledgeBaseCriteria = (books: any[], kbContent: string, params: AnalysisParameters): string => {
    let analysis = '';
    
    // Applica i criteri della KB ai dati attuali
    const booksWithGoodBSR = books.filter(b => {
      const bsr = b.bsr || 999999;
      // Usa i criteri dalla KB se disponibili
      if (kbContent.includes('range ideale') || kbContent.includes('moderato')) {
        return bsr >= params.opportunities.minBSR && bsr <= params.opportunities.maxBSR;
      }
      // Fallback ai criteri standard
      return bsr >= params.opportunities.minBSR && bsr <= params.opportunities.maxBSR;
    });
    
    const booksWithGoodPrice = books.filter(b => {
      const price = b.price || 0;
      // Usa i criteri dalla KB se disponibili
      if (kbContent.includes('sweet spot') || kbContent.includes('fascia media')) {
        return price >= params.opportunities.minPrice && price <= params.price.medium;
      }
      return price >= params.opportunities.minPrice && price <= params.price.medium;
    });
    
    const booksWithFewReviews = books.filter(b => {
      const reviews = b.reviews || 0;
      // Usa i criteri dalla KB se disponibili
      if (kbContent.includes('poche recensioni') || kbContent.includes('mercato non saturo')) {
        return reviews <= params.opportunities.maxReviews;
      }
      return reviews <= params.opportunities.maxReviews;
    });
    
    analysis += `• Libri nel range BSR ideale (secondo la tua metodologia): ${booksWithGoodBSR.length}/${books.length}\n`;
    analysis += `• Libri nella fascia prezzo ottimale (secondo la tua metodologia): ${booksWithGoodPrice.length}/${books.length}\n`;
    analysis += `• Libri con poche recensioni (opportunità secondo la tua metodologia): ${booksWithFewReviews.length}/${books.length}\n`;
    
    // Trova libri che soddisfano tutti i criteri della KB
    const idealBooks = books.filter(b => 
      booksWithGoodBSR.includes(b) && 
      booksWithGoodPrice.includes(b) && 
      booksWithFewReviews.includes(b)
    );
    
    if (idealBooks.length > 0) {
      analysis += `\n🎯 LIBRI IDEALI (secondo tutti i criteri della tua KB): ${idealBooks.length}\n`;
      idealBooks.slice(0, 3).forEach((book, i) => {
        analysis += `   ${i+1}. "${book.title.substring(0, 50)}..." - BSR: ${book.bsr?.toLocaleString()}, €${book.price}\n`;
      });
    }
    
    return analysis;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Carica File CSV
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Carica un file CSV con i dati dei libri per ottenere un'analisi dettagliata immediata.
        </p>
      </div>

      {/* CSV Upload Area */}
      <div className="max-w-2xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
            isProcessing 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-slate-300 bg-white hover:border-green-400 hover:bg-green-50'
          }`}
          onClick={() => !isProcessing && csvInputRef.current?.click()}
        >
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            disabled={isProcessing}
          />
          
          {isProcessing ? (
            <div className="space-y-4">
              <Loader className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
              <p className="text-lg font-medium text-blue-700">
                Processando CSV...
              </p>
              <p className="text-sm text-blue-600">
                Lettura e analisi dati in corso...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-slate-700">
                  Carica File CSV
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Clicca per selezionare il tuo file CSV
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}
        
        {/* CSV Format Example */}
        <div className="mt-6 bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-700 mb-2">📋 Formato CSV Richiesto:</h4>
          <pre className="text-xs text-slate-600 overflow-x-auto bg-white p-3 rounded border">
{`Book Title,Author,Price,Sales Rank,Rating,Reviews,Length,Format
"The Complete Guide to...","John Smith",15.99,25000,4.2,150,200,"Paperback"
"Digital Marketing Bible","Jane Doe",22.50,8500,4.5,320,350,"Kindle"
"Real Estate Investing","Bob Wilson",18.90,45000,4.1,89,180,"Hardcover"`}
          </pre>
          <div className="mt-3 text-xs text-slate-500">
            <p><strong>Colonne riconosciute:</strong> Book Title, Author, Price, Sales Rank, Rating, Reviews, Length, Format, Published, ASIN/ISBN</p>
            <p><strong>Note:</strong> Il parser riconosce automaticamente le colonne anche con nomi diversi (es. "BSR" invece di "Sales Rank")</p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
          <div><strong>Stato:</strong> {isProcessing ? 'PROCESSANDO' : 'PRONTO'}</div>
          <div><strong>Errore:</strong> {error || 'Nessuno'}</div>
          <div><strong>Successo:</strong> {success || 'Nessuno'}</div>
          <div><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}

export default UploadSection;