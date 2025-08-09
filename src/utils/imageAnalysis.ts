import Tesseract from 'tesseract.js';
import { AmazonResultsParser, type ParsedAmazonData } from './amazonParser';

export const analyzeText = async (text: string, knowledgeBase: any[]): Promise<any> => {
  try {
    console.log('Starting direct text analysis...');
    console.log('Text length:', text.length);
    
    if (!text || text.trim().length < 50) {
      throw new Error('Testo insufficiente. Assicurati di aver copiato i risultati di ricerca Amazon completi.');
    }

    // Parsa i risultati Amazon dal testo
    const parsedData: ParsedAmazonData = AmazonResultsParser.parseAmazonResults(text);
    
    if (parsedData.books.length === 0) {
      throw new Error('Nessun libro trovato nel testo. Verifica che sia copiato dalla pagina dei risultati di ricerca Amazon.');
    }

    console.log(`Successfully parsed ${parsedData.books.length} books from text`);

    // Genera insights basati sulla knowledge base
    const aiInsights = generateInsights(parsedData.books, knowledgeBase, parsedData.keyword);

    // Calcola statistiche
    const bsrValues = parsedData.books.filter(book => book.bsr).map(book => book.bsr!);
    const priceValues = parsedData.books.filter(book => book.price > 0).map(book => book.price);
    
    const avgBSR = bsrValues.length > 0 ? 
      Math.round(bsrValues.reduce((acc, bsr) => acc + bsr, 0) / bsrValues.length) : 0;
    
    const avgPrice = priceValues.length > 0 ? 
      priceValues.reduce((acc, price) => acc + price, 0) / priceValues.length : 0;

    const opportunities = parsedData.books.filter(book => 
      book.bsr && book.bsr < 20000
    ).length;

    return {
      keyword: parsedData.keyword,
      books: parsedData.books.map(book => ({
        ...book,
        // Aggiungi campi calcolati
        salesEstimate: getSalesEstimate(book.bsr || 999999),
        potential: getPotential(book.bsr || 999999),
        angle: extractAngle(book.title)
      })),
      analysis: {
        totalBooks: parsedData.books.length,
        averageBSR: avgBSR,
        averagePrice: avgPrice,
        opportunities,
        insights: aiInsights,
        ocrConfidence: 100, // Testo diretto = 100% confidence
        extractedDataQuality: 'Eccellente (Testo Diretto)'
      },
      rawText: text // Per debug
    };

  } catch (error) {
    console.error('Error in text analysis:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Errore durante l\'analisi del testo. Verifica che sia copiato correttamente dalla pagina Amazon.');
  }
};

export const analyzeScreenshot = async (file: File, knowledgeBase: any[]): Promise<any> => {
  try {
    console.log('Starting OCR analysis of screenshot...');
    
    // Configura Tesseract per italiano e inglese
    const { data: { text } } = await Tesseract.recognize(file, 'ita+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    console.log('OCR completed. Extracted text length:', text.length);
    
    if (!text || text.trim().length < 50) {
      throw new Error('Testo insufficiente estratto dall\'immagine. Assicurati che lo screenshot sia chiaro e contenga risultati di ricerca Amazon.');
    }

    // Parsa i risultati Amazon dal testo OCR
    const parsedData: ParsedAmazonData = AmazonResultsParser.parseAmazonResults(text);
    
    if (parsedData.books.length === 0) {
      throw new Error('Nessun libro trovato nell\'immagine. Verifica che sia uno screenshot dei risultati di ricerca Amazon con libri visibili.');
    }

    console.log(`Successfully parsed ${parsedData.books.length} books`);

    // Genera insights basati sulla knowledge base
    const aiInsights = generateInsights(parsedData.books, knowledgeBase, parsedData.keyword);

    // Calcola statistiche
    const bsrValues = parsedData.books.filter(book => book.bsr).map(book => book.bsr!);
    const priceValues = parsedData.books.filter(book => book.price > 0).map(book => book.price);
    
    const avgBSR = bsrValues.length > 0 ? 
      Math.round(bsrValues.reduce((acc, bsr) => acc + bsr, 0) / bsrValues.length) : 0;
    
    const avgPrice = priceValues.length > 0 ? 
      priceValues.reduce((acc, price) => acc + price, 0) / priceValues.length : 0;

    const opportunities = parsedData.books.filter(book => 
      book.bsr && book.bsr < 20000
    ).length;

    return {
      keyword: parsedData.keyword,
      books: parsedData.books.map(book => ({
        ...book,
        // Aggiungi campi calcolati
        salesEstimate: getSalesEstimate(book.bsr || 999999),
        potential: getPotential(book.bsr || 999999),
        angle: extractAngle(book.title)
      })),
      analysis: {
        totalBooks: parsedData.books.length,
        averageBSR: avgBSR,
        averagePrice: avgPrice,
        opportunities,
        insights: aiInsights,
        ocrConfidence: calculateOCRConfidence(parsedData.books),
        extractedDataQuality: assessDataQuality(parsedData.books)
      },
      rawOCRText: text // Per debug
    };

  } catch (error) {
    console.error('Error in screenshot analysis:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Errore durante l\'analisi OCR dell\'immagine. Riprova con uno screenshot più chiaro.');
  }
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

const extractAngle = (title: string): string => {
  // Estrai l'angolo di attacco dal titolo
  const angles = [
    'Guida completa', 'Manuale pratico', 'Corso base', 'Guida per principianti',
    'Strategie avanzate', 'Metodo step-by-step', 'Guida definitiva', 'Workbook',
    'Checklist', 'Template', 'Esempi pratici', 'Case study'
  ];
  
  const titleLower = title.toLowerCase();
  for (const angle of angles) {
    if (titleLower.includes(angle.toLowerCase())) {
      return angle;
    }
  }
  
  // Fallback: estrai dalle prime parole
  const words = title.split(' ').slice(0, 3).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
};

const generateInsights = (books: any[], knowledgeBase: any[], keyword: string): string => {
  if (!books || books.length === 0) {
    return "Nessun libro trovato nell'analisi OCR.";
  }

  const bsrValues = books.filter(book => book.bsr).map(book => book.bsr);
  const priceValues = books.filter(book => book.price > 0).map(book => book.price);
  
  if (bsrValues.length === 0 && priceValues.length === 0) {
    return "Dati insufficienti per l'analisi. L'OCR potrebbe non aver estratto BSR e prezzi correttamente.";
  }

  const avgBSR = bsrValues.length > 0 ? 
    bsrValues.reduce((acc, bsr) => acc + bsr, 0) / bsrValues.length : 0;
  
  const avgPrice = priceValues.length > 0 ? 
    priceValues.reduce((acc, price) => acc + price, 0) / priceValues.length : 0;
  
  const goodOpportunities = books.filter(book => book.bsr && book.bsr < 20000).length;
  
  let insights = `📊 ANALISI KEYWORD "${keyword}":\n\n`;
  
  // Analisi competitività
  if (avgBSR > 0) {
    if (avgBSR < 20000) {
      insights += `🔴 MERCATO COMPETITIVO: BSR medio ${Math.round(avgBSR).toLocaleString()} indica alta concorrenza.\n`;
    } else if (avgBSR < 50000) {
      insights += `🟡 MERCATO MODERATO: BSR medio ${Math.round(avgBSR).toLocaleString()} - opportunità con angolo specifico.\n`;
    } else {
      insights += `🟢 BUONE OPPORTUNITÀ: BSR medio ${Math.round(avgBSR).toLocaleString()} indica mercato accessibile.\n`;
    }
  }
  
  // Analisi prezzi
  if (avgPrice > 0) {
    if (avgPrice > 20) {
      insights += `💰 FASCIA PREMIUM: Prezzo medio €${avgPrice.toFixed(2)} - pubblico disposto a spendere.\n`;
    } else if (avgPrice > 12) {
      insights += `💵 FASCIA MEDIA: Prezzo medio €${avgPrice.toFixed(2)} - buon equilibrio profitto/accessibilità.\n`;
    } else {
      insights += `💸 PREZZI BASSI: Prezzo medio €${avgPrice.toFixed(2)} - necessari volumi alti.\n`;
    }
  }

  insights += `\n🎯 OPPORTUNITÀ: ${goodOpportunities}/${books.length} libri con BSR competitivo\n`;

  // Raccomandazioni basate sulla knowledge base
  if (knowledgeBase.length > 0) {
    insights += `\n📚 RACCOMANDAZIONI (basate su ${knowledgeBase.length} documenti):\n`;
    insights += `• Analizza gap negli angoli di attacco\n`;
    insights += `• Considera target demografici specifici\n`;
    insights += `• Valuta formati alternativi (workbook, guide pratiche)\n`;
    insights += `• Ottimizza prezzo basandoti sui competitor\n`;
  } else {
    insights += `\n💡 SUGGERIMENTO: Carica documenti del tuo coach nella Knowledge Base per consigli più specifici.\n`;
  }

  return insights;
};

const calculateOCRConfidence = (books: any[]): number => {
  if (books.length === 0) return 0;
  
  let score = 0;
  let maxScore = 0;
  
  books.forEach(book => {
    maxScore += 5; // 5 punti per libro
    
    if (book.title && book.title.length > 10) score += 1;
    if (book.author && book.author !== 'Autore non trovato') score += 1;
    if (book.price && book.price > 0) score += 1;
    if (book.bsr && book.bsr > 0) score += 1;
    if (book.rating && book.rating > 0) score += 1;
  });
  
  return Math.round((score / maxScore) * 100);
};

const assessDataQuality = (books: any[]): string => {
  const confidence = calculateOCRConfidence(books);
  
  if (confidence >= 80) return 'Eccellente';
  if (confidence >= 60) return 'Buona';
  if (confidence >= 40) return 'Discreta';
  return 'Bassa - Riprova con screenshot più chiaro';
};