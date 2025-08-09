// Parser specifico per risultati di ricerca Amazon
export interface AmazonBook {
  title: string;
  author: string;
  price: number;
  bsr?: number;
  rating?: number;
  reviews?: number;
  pages?: number;
  format?: string;
  sponsored?: boolean;
}

export interface ParsedAmazonData {
  keyword: string;
  books: AmazonBook[];
  totalResults: number;
}

export class AmazonResultsParser {
  private static readonly PRICE_PATTERNS = [
    /€\s*(\d+[,.]?\d*)/g,
    /EUR\s*(\d+[,.]?\d*)/g,
    /(\d+[,.]?\d*)\s*€/g,
    /(\d+[,.]?\d*)\s*euro/gi
  ];

  private static readonly BSR_PATTERNS = [
    /#(\d{1,3}(?:[.,]\d{3})*)\s*in/gi,
    /n\.\s*(\d{1,3}(?:[.,]\d{3})*)/gi,
    /bestseller\s*#(\d{1,3}(?:[.,]\d{3})*)/gi,
    /posizione\s*(\d{1,3}(?:[.,]\d{3})*)/gi
  ];

  private static readonly RATING_PATTERNS = [
    /(\d[,.]?\d?)\s*su\s*5/gi,
    /(\d[,.]?\d?)\s*stelle/gi,
    /★+\s*(\d[,.]?\d?)/gi,
    /(\d[,.]?\d?)\s*\/\s*5/gi
  ];

  private static readonly REVIEW_PATTERNS = [
    /(\d{1,3}(?:[.,]\d{3})*)\s*recensioni?/gi,
    /(\d{1,3}(?:[.,]\d{3})*)\s*valutazioni?/gi,
    /(\d{1,3}(?:[.,]\d{3})*)\s*review/gi
  ];

  static parseAmazonResults(ocrText: string): ParsedAmazonData {
    console.log('=== INIZIO PARSING OCR ===');
    console.log('Testo OCR completo:', ocrText.substring(0, 1000) + '...');
    
    // Pulisci e normalizza il testo
    const cleanedText = this.cleanOCRText(ocrText);
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 2);
    
    console.log(`Righe estratte: ${lines.length}`);
    lines.slice(0, 20).forEach((line, i) => console.log(`${i}: "${line}"`));
    
    // Estrai keyword
    const keyword = this.extractKeyword(cleanedText);
    console.log('Keyword estratta:', keyword);
    
    // Identifica i separatori di libri (pattern Amazon)
    const bookSeparators = this.findBookSeparators(lines);
    console.log('Separatori trovati:', bookSeparators);
    
    // Raggruppa le righe in blocchi per libro
    const bookBlocks = this.groupLinesByBooks(lines, bookSeparators);
    console.log(`Blocchi libro creati: ${bookBlocks.length}`);
    
    const books: AmazonBook[] = [];
    
    bookBlocks.forEach((block, index) => {
      console.log(`\n--- PARSING LIBRO ${index + 1} ---`);
      console.log('Righe del blocco:', block);
      
      const book = this.parseBookBlock(block, index);
      if (book && this.isValidBook(book)) {
        books.push(book);
        console.log('Libro valido aggiunto:', book.title);
      } else {
        console.log('Libro scartato (non valido)');
      }
    });

    console.log(`\n=== RISULTATO FINALE: ${books.length} libri ===`);
    
    return {
      keyword,
      books,
      totalResults: books.length
    };
  }

  private static cleanOCRText(text: string): string {
    // Prima dividi in righe, poi pulisci ogni riga individualmente
    return text
      .split('\n')
      .map(line => line
      // Rimuovi caratteri strani OCR
      .replace(/[|]/g, 'I')
      .replace(/[°]/g, 'o')
      .replace(/[¢]/g, 'c')
      // Normalizza spazi
      .replace(/\s+/g, ' ')
      .trim()
      )
      .filter(line => {
        const cleaned = line;
        // Mantieni righe con lettere O con numeri/simboli importanti (prezzi, BSR, rating)
        return cleaned.length > 1 && (
          /[a-zA-ZÀ-ÿ]/.test(cleaned) || // Contiene lettere
          /[€$£¥#]/.test(cleaned) || // Contiene simboli di valuta o ranking
          /\d+[.,]\d+/.test(cleaned) || // Contiene numeri decimali (prezzi, rating)
          /\d+\s*(stelle|star|recensioni|review)/i.test(cleaned) // Pattern rating/recensioni
        );
      })
      .join('\n');
  }

  private static findBookSeparators(lines: string[]): number[] {
    const separators: number[] = [0]; // Inizia sempre da 0
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const prevLine = lines[i-1]?.trim() || '';
      const nextLine = lines[i+1]?.trim() || '';
      
      // Pattern che indicano l'inizio di un nuovo libro
      const isNewBookStart = 
        // Titolo che sembra un vero libro (lungo e descrittivo)
        (this.looksLikeRealBookTitle(line) && !this.looksLikeAuthorLine(line)) ||
        // Sponsorizzato
        /sponsorizzat|sponsor/i.test(line) ||
        // Titolo dopo informazioni di prezzo/rating del libro precedente
        (this.looksLikeTitle(line) && this.looksLikePriceOrRating(prevLine) && !this.looksLikeAuthorLine(line));
      
      if (isNewBookStart) {
        separators.push(i);
      }
    }
    
    return separators;
  }

  private static looksLikeRealBookTitle(line: string): boolean {
    if (!line || line.length < 15 || line.length > 200) return false;
    
    // Deve contenere principalmente lettere
    const alphaRatio = (line.match(/[a-zA-ZÀ-ÿ]/g) || []).length / line.length;
    if (alphaRatio < 0.7) return false;
    
    // Deve contenere parole tipiche dei titoli di libri
    const bookTitleWords = /\b(guide|manual|handbook|bible|complete|ultimate|secrets|how\s+to|step\s+by\s+step|beginner|advanced|master|learn|discover|unlock)\b/i;
    const hasBookWords = bookTitleWords.test(line);
    
    // Non deve essere metadata
    if (this.PRICE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    if (this.BSR_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    if (this.RATING_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    
    // Punteggio più alto per titoli che sembrano libri veri
    return hasBookWords || (line.length > 30 && alphaRatio > 0.8);
  }

  private static looksLikeAuthorLine(line: string): boolean {
    if (!line || line.length > 50) return false;
    
    // Pattern per autori
    const authorPatterns = [
      /^by\s+[A-ZÀ-Ÿ][a-zà-ÿ]+/i,
      /^di\s+[A-ZÀ-Ÿ][a-zà-ÿ]+/i,
      /^[A-ZÀ-Ÿ][a-zà-ÿ]+\s+[A-ZÀ-Ÿ][a-zà-ÿ]+$/,
      /^[A-ZÀ-Ÿ][a-zà-ÿ]+\s+[A-ZÀ-Ÿ]\.\s+[A-ZÀ-Ÿ][a-zà-ÿ]+$/
    ];
    
    return authorPatterns.some(pattern => pattern.test(line.trim()));
  }

  private static groupLinesByBooks(lines: string[], separators: number[]): string[][] {
    const blocks: string[][] = [];
    
    for (let i = 0; i < separators.length; i++) {
      const start = separators[i];
      const end = separators[i + 1] || lines.length;
      
      const block = lines.slice(start, end).filter(line => line.trim().length > 0);
      if (block.length > 0) {
        blocks.push(block);
      }
    }
    
    // Se non abbiamo trovato separatori chiari, prova a dividere per dimensione
    if (blocks.length <= 1 && lines.length > 10) {
      return this.fallbackGrouping(lines);
    }
    
    return blocks;
  }

  private static fallbackGrouping(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let currentBlock: string[] = [];
    
    for (const line of lines) {
      currentBlock.push(line);
      
      // Chiudi blocco se diventa troppo grande o troviamo pattern di fine libro
      if (currentBlock.length >= 8 || 
          (currentBlock.length >= 4 && this.looksLikePriceOrRating(line))) {
        blocks.push([...currentBlock]);
        currentBlock = [];
      }
    }
    
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }
    
    return blocks;
  }

  private static looksLikeTitle(line: string): boolean {
    if (!line || line.length < 10 || line.length > 200) return false;
    
    // Deve contenere principalmente lettere
    const alphaRatio = (line.match(/[a-zA-ZÀ-ÿ]/g) || []).length / line.length;
    if (alphaRatio < 0.6) return false;
    
    // Non deve essere prezzo, BSR o rating
    if (this.PRICE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    if (this.BSR_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    if (this.RATING_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) return false;
    
    return true;
  }

  private static looksLikePriceOrRating(line: string): boolean {
    return this.PRICE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); }) ||
           this.RATING_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); }) ||
           /stelle|star|€|euro|rating/i.test(line);
  }

  private static parseBookBlock(block: string[], index: number): AmazonBook | null {
    if (block.length === 0) return null;
    
    console.log(`Parsing blocco ${index}:`, block);
    
    const fullText = block.join(' ');
    
    // Estrai componenti
    const title = this.extractTitle(block);
    const author = this.extractAuthor(block, fullText);
    const price = this.extractPrice(fullText);
    const bsr = this.extractBSR(fullText);
    const rating = this.extractRating(fullText);
    const reviews = this.extractReviews(fullText);
    const sponsored = /sponsorizzat|sponsor|pubblicità/i.test(fullText);
    
    console.log('Componenti estratti:', { title, author, price, bsr, rating, reviews, sponsored });
    
    if (!title) {
      console.log('Titolo non trovato, libro scartato');
      return null;
    }
    
    return {
      title: title.trim(),
      author: author || 'Autore non disponibile',
      price: price || 0,
      bsr,
      rating,
      reviews,
      sponsored
    };
  }

  private static extractTitle(block: string[]): string | null {
    // Cerca il titolo più probabile
    let bestTitle = '';
    let bestScore = 0;
    
    for (const line of block) {
      if (this.looksLikeTitle(line)) {
        let score = 0;
        
        // Punteggio basato su lunghezza (titoli Amazon sono solitamente lunghi)
        if (line.length > 20 && line.length < 150) score += 3;
        else if (line.length > 10) score += 1;
        
        // Punteggio se contiene parole chiave tipiche dei titoli
        if (/guida|manuale|corso|metodo|strategia|come|per|libro/i.test(line)) score += 2;
        
        // Punteggio se è all'inizio del blocco
        if (block.indexOf(line) <= 2) score += 1;
        
        // Penalizza se contiene pattern non-titolo
        if (/kindle|copertina|pagine|formato/i.test(line)) score -= 1;
        
        if (score > bestScore) {
          bestScore = score;
          bestTitle = line;
        }
      }
    }
    
    // Se non abbiamo trovato un titolo con il metodo principale, usa fallback
    if (bestTitle) {
      return bestTitle;
    }
    
    // Fallback: cerca qualsiasi riga ragionevole che possa essere un titolo
    for (const line of block) {
      const trimmed = line.trim();
      
      // Deve avere lunghezza ragionevole
      if (trimmed.length < 5 || trimmed.length > 200) continue;
      
      // Non deve essere vuota
      if (!trimmed) continue;
      
      // Non deve sembrare un prezzo
      if (this.PRICE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(trimmed); })) continue;
      
      // Non deve sembrare un BSR
      if (this.BSR_PATTERNS.some(p => { p.lastIndex = 0; return p.test(trimmed); })) continue;
      
      // Non deve sembrare un autore (pattern "di Nome Cognome")
      if (/^di\s+[A-ZÀ-Ÿ][a-zà-ÿ]+/i.test(trimmed)) continue;
      
      // Non deve essere solo numeri o simboli
      if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) continue;
      
      // Se arriviamo qui, probabilmente è un titolo
      return trimmed;
    }
    
    return null;
  }

  private static extractAuthor(block: string[], fullText: string): string | null {
    // Pattern per autori
    const authorPatterns = [
      /(?:di|by|autore:?)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)/i,
      /([A-ZÀ-Ÿ][a-zà-ÿ]+\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)(?:\s*\||\s*,|\s*$)/
    ];

    for (const pattern of authorPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Cerca in righe separate (nomi che sembrano autori)
    for (const line of block) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 50) {
        const words = trimmed.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          const looksLikeName = words.every(word => 
            /^[A-ZÀ-Ÿ][a-zà-ÿ]+$/.test(word) && word.length > 1
          );
          if (looksLikeName && !this.looksLikeTitle(trimmed)) {
            return trimmed;
          }
        }
      }
    }

    return null;
  }

  private static extractKeyword(text: string): string {
    const keywordPatterns = [
      /risultati per "([^"]+)"/i,
      /ricerca per "([^"]+)"/i,
      /cerca "([^"]+)"/i,
      /risultati di ricerca per ([^\n]+)/i,
      /hai cercato "([^"]+)"/i
    ];

    for (const pattern of keywordPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: prime parole significative
    const lines = text.split('\n');
    for (const line of lines.slice(0, 5)) {
      if (line.length > 5 && line.length < 100 && 
          !this.PRICE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); })) {
        return line.trim();
      }
    }

    return 'Keyword da screenshot';
  }

  private static extractPrice(text: string): number | null {
    for (const pattern of this.PRICE_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const priceStr = match[1].replace(',', '.');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 1000) {
          return Math.round(price * 100) / 100; // Arrotonda a 2 decimali
        }
      }
    }
    return null;
  }

  private static extractBSR(text: string): number | null {
    for (const pattern of this.BSR_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const bsrStr = match[1].replace(/[.,]/g, '');
        const bsr = parseInt(bsrStr);
        if (!isNaN(bsr) && bsr > 0 && bsr < 10000000) {
          return bsr;
        }
      }
    }
    return null;
  }

  private static extractRating(text: string): number | null {
    for (const pattern of this.RATING_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const ratingStr = match[1].replace(',', '.');
        const rating = parseFloat(ratingStr);
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          return Math.round(rating * 10) / 10; // Arrotonda a 1 decimale
        }
      }
    }
    return null;
  }

  private static extractReviews(text: string): number | null {
    for (const pattern of this.REVIEW_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const reviewsStr = match[1].replace(/[.,]/g, '');
        const reviews = parseInt(reviewsStr);
        if (!isNaN(reviews) && reviews >= 0 && reviews < 1000000) {
          return reviews;
        }
      }
    }
    return null;
  }

  private static isValidBook(book: AmazonBook): boolean {
    if (!book.title || book.title.length < 10 || book.title.length > 300) {
      return false;
    }
    
    // Non solo simboli/numeri
    if (/^[^a-zA-ZÀ-ÿ]*$/.test(book.title)) {
      return false;
    }
    
    // Filtra elementi UI/metadata che non sono libri veri
    const invalidPatterns = [
      /^(Check each product|Results|Books|Kindle Store|Audible|Other format|Price History|ASIN:|Sold by|Try with|Best Seller)/i,
      /^(Sponsored Ad|Price, product page|Paperback|Hardcover|Audiobook)/i,
      /^(Heart Disease|Musculoskeletal|Preventive Medicine|Herbal Remedies|Tropical Medicine)/i,
      /^\$\d+\.\d+/,  // Solo prezzi
      /^#\d+/,        // Solo ranking
      /^by [A-Z]/,    // Solo autore senza titolo
      /^Other formats?:/i,
      /^ASIN:/i,
      /^Book \d+ of \d+:/i
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(book.title.trim()));
  }
}