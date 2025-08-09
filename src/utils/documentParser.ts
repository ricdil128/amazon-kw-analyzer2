// Simulazione del parsing di documenti Word
export const parseWordDocument = async (file: File): Promise<string> => {
  // In un'implementazione reale, useresti librerie come mammoth.js per parsing .docx
  // Simuliamo il contenuto estratto
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Contenuto simulato di un documento di coaching
  const simulatedContent = `
  GUIDA ANALISI KEYWORD AMAZON KDP - ${file.name}
  
  CRITERI FONDAMENTALI PER KEYWORD VINCENTI:
  
  1. BSR (Best Seller Rank):
  - Sotto 5.000: Mercato molto competitivo, difficile da penetrare
  - 5.000-20.000: Competitivo ma con opportunità con il giusto angolo
  - 20.000-100.000: Range ideale per principianti
  - Sopra 100.000: Mercato di nicchia, validare la domanda
  
  2. Analisi della Concorrenza:
  - Conta i libri con BSR sotto 20k nella prima pagina
  - Se più del 60% è sotto 20k = troppo competitivo
  - Se meno del 30% è sotto 20k = buona opportunità
  
  3. Prezzi e Profittabilità:
  - Fascia €8-12: Mercato di massa, servono volumi alti
  - Fascia €12-20: Sweet spot per most niches
  - Fascia €20+: Premium, pubblico specializzato
  
  4. Analisi dei Titoli:
  - Cerca pattern vincenti nei titoli top-ranking
  - Identifica gap negli angoli di attacco
  - Verifica lunghezza ottimale (titolo + sottotitolo)
  
  5. Fattori di Successo:
  - Copertine accattivanti e professionali
  - Descrizioni ben strutturate con bullet points
  - Recensioni: più di 20 recensioni = libro stabilizzato
  - Rating: sopra 4.0 è essenziale
  
  6. Red Flags da Evitare:
  - Troppi libri "How to" generici
  - Titoli identici o molto simili
  - BSR che fluttuano troppo (instabilità)
  - Prezzi sotto €5 (gara al ribasso)
  
  7. Strategia di Posizionamento:
  - Trova un angolo specifico non coperto
  - Considera target demografici specifici
  - Pensa a problemi specifici non risolti
  - Valuta formati diversi (workbook, checklist, etc.)
  
  PROCESSO DI VALIDAZIONE:
  1. Screenshot della SERP
  2. Analisi dei primi 20 risultati
  3. Calcolo competitività media
  4. Identificazione gap di mercato
  5. Verifica sostenibilità economica
  
  METRICHE CHIAVE DA TRACCIARE:
  - BSR medio dei competitor
  - Prezzo medio di categoria
  - Numero di recensioni medio
  - Rating medio
  - Lunghezza media dei libri
  - Età media dei libri (data pubblicazione)
  
  QUANDO PROCEDERE:
  ✅ BSR medio >20k
  ✅ Meno di 5 libri molto forti (sotto 10k BSR)
  ✅ Gap identificabile nell'angolo di attacco
  ✅ Pubblico disposto a pagare €12+ 
  ✅ Più di 3 libri con poche recensioni (<50)
  
  QUANDO EVITARE:
  ❌ Più di 7 libri sotto 10k BSR
  ❌ Titoli tutti identici
  ❌ Prezzi medi sotto €8
  ❌ Mercato in declino
  ❌ Keyword stagionale senza evergreen appeal
  `;
  
  return simulatedContent;
};