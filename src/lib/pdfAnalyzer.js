/**
 * pdfAnalyzer.js
 * Estrazione dati bollette italiane da PDF.
 *
 * Livello 1 (offline): pdf.js → testo grezzo → regex avanzate
 * Livello 2 (opzionale): Claude Haiku API → massima accuratezza
 *   - PDF digitale: invia il testo estratto
 *   - PDF scansionato: renderizza come immagine e invia via Vision
 */

import * as pdfjsLib from 'pdfjs-dist';

// ── Worker pdf.js (Vite gestisce l'URL automaticamente) ────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ── 1. ESTRAZIONE TESTO DA PDF ─────────────────────────────────────────────
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 6);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Ricostruisce il testo preservando gli spazi tra gli item
    const pageText = content.items
      .map(item => item.str)
      .filter(s => s.trim().length > 0)
      .join(' ');
    fullText += pageText + '\n';
  }
  return fullText.trim();
}

// ── 2. RENDER PAGINA COME IMMAGINE (per PDF scansionati) ──────────────────
export async function renderPageAsImage(file, pageNum = 1, scale = 2.5) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  // JPEG 85% = buon compromesso qualità/dimensione per OCR
  return canvas.toDataURL('image/jpeg', 0.85);
}

// ── 3. ANALISI REGEX — pattern bollette italiane ──────────────────────────

const IMPORTO_PATTERNS = [
  /totale\s+da\s+pagare\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /importo\s+(?:totale|fattura|dovuto|da\s+pagare)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /da\s+pagare\s*[:\s€]+\s*([\d]{1,4}[.,]\d{2})/i,
  /totale\s+fattura\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /saldo\s+(?:da\s+pagare|dovuto|residuo)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /importo\s+(?:da\s+)?addebit(?:are|ato)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /rata\s+(?:totale|mensile|da\s+pagare)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /(?:totale|importo)\s+(?:complessivo|bolletta)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
  /(?:amount\s+due|total\s+due)\s*[:\s€]*\s*([\d]{1,4}[.,]\d{2})/i,
];

const SCADENZA_PATTERNS = [
  /scaden[tz]a\s+(?:del\s+)?pagamento\s*[:\s]*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /scaden[tz]a\s*[:\s]*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /pagare\s+entro(?:\s+il)?\s*[:\s]*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /entro\s+(?:e\s+non\s+oltre\s+)?il\s+(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /data\s+(?:di\s+)?(?:scaden[tz]a|pagamento|addebito)\s*[:\s]*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /effettuare\s+(?:il\s+)?pagamento\s+(?:entro\s+)?(?:il\s+)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /(?:pagamento|versamento)\s+(?:entro|previsto)\s+(?:il\s+)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  /(?:last\s+date|due\s+date|payment\s+date)\s*[:\s]*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
];

const FORNITORI_NOTI = [
  { p: /enel\s*(?:energia|luce|gas|servizi|x)?\b/i,          n: 'Enel Energia',    c: 'utilities'     },
  { p: /eni\s*(?:gas\s+(?:e\s+)?luce|plenitude|luce)?\b/i,  n: 'Eni Gas e Luce',  c: 'utilities'     },
  { p: /a2a\s*(?:energia|luce\s+e\s+gas)?\b/i,               n: 'A2A Energia',     c: 'utilities'     },
  { p: /iren\s*(?:energia|mercato|luce\s+gas)?\b/i,          n: 'Iren Energia',    c: 'utilities'     },
  { p: /hera\s*(?:comm|luce\s+gas)?\b/i,                     n: 'Hera',            c: 'utilities'     },
  { p: /acea\s*(?:energia|distribuzione)?\b/i,               n: 'Acea',            c: 'utilities'     },
  { p: /snam\s*(?:rete\s+gas)?\b/i,                          n: 'Snam',            c: 'utilities'     },
  { p: /italgas\b/i,                                         n: 'Italgas',         c: 'utilities'     },
  { p: /edison\s*(?:energia|servizi)?\b/i,                   n: 'Edison Energia',  c: 'utilities'     },
  { p: /2i\s+rete\s+gas\b/i,                                 n: '2i Rete Gas',     c: 'utilities'     },
  { p: /axpo\b/i,                                            n: 'Axpo',            c: 'utilities'     },
  { p: /dolomiti\s+energia\b/i,                              n: 'Dolomiti Energia', c: 'utilities'    },
  { p: /gelsia\b/i,                                          n: 'Gelsia',          c: 'utilities'     },
  { p: /\btim\b|telecom\s+italia/i,                          n: 'TIM',             c: 'subscription'  },
  { p: /vodafone\s*(?:italy|italia)?\b/i,                    n: 'Vodafone',        c: 'subscription'  },
  { p: /wind\s*tre\b/i,                                      n: 'WindTre',         c: 'subscription'  },
  { p: /fastweb\b/i,                                         n: 'Fastweb',         c: 'subscription'  },
  { p: /sky\s*(?:italia|italia\s+s\.r\.l)?\b/i,             n: 'Sky Italia',      c: 'subscription'  },
  { p: /dazn\b/i,                                            n: 'DAZN',            c: 'subscription'  },
  { p: /netflix\b/i,                                         n: 'Netflix',         c: 'subscription'  },
  { p: /iliad\b/i,                                           n: 'Iliad',           c: 'subscription'  },
  { p: /tiscali\b/i,                                         n: 'Tiscali',         c: 'subscription'  },
  { p: /linkem\b/i,                                          n: 'Linkem',          c: 'subscription'  },
  { p: /amazon\s*(?:prime|web\s+services)?\b/i,             n: 'Amazon',          c: 'subscription'  },
  { p: /spotify\b/i,                                         n: 'Spotify',         c: 'subscription'  },
  { p: /google\s*(?:one|llc|ireland)?\b/i,                  n: 'Google',          c: 'subscription'  },
  { p: /microsoft\b/i,                                       n: 'Microsoft',       c: 'subscription'  },
  { p: /apple\s*(?:inc|italia)?\b/i,                        n: 'Apple',           c: 'subscription'  },
  { p: /mediaset\s*(?:infinity|premium)?\b/i,               n: 'Mediaset',        c: 'subscription'  },
  { p: /poste\s*(?:italiane)?\b/i,                          n: 'Poste Italiane',  c: 'other'         },
  { p: /agenzia\s+(?:delle\s+)?entrate\b/i,                 n: 'Agenzia Entrate', c: 'taxes'         },
  { p: /comune\s+di\s+\w+/i,                                n: null,              c: 'taxes'         },
  { p: /equitalia|agenzia\s+riscossione\b/i,                n: 'Agenzia Riscossione', c: 'taxes'     },
  { p: /inps\b/i,                                            n: 'INPS',            c: 'taxes'         },
];

function parseImporto(str) {
  // Normalizza "1.234,56" → 1234.56  e  "1234.56" → 1234.56
  const clean = str.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

function parseDataIT(str) {
  // Converte vari separatori in formato Date-compatibile
  const parts = str.split(/[\/.\-]/);
  if (parts.length !== 3) return null;
  let [d, m, y] = parts;
  if (y.length === 2) y = '20' + y;
  const date = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
  if (isNaN(date)) return null;
  return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
}

export function analyzeBillText(text) {
  const result = { fornitore: null, importo: null, scadenza: null, categoria: 'other', fonte: 'regex' };

  // ── Fornitore ──────────────────────────────────────────────────────────
  for (const { p, n, c } of FORNITORI_NOTI) {
    if (p.test(text)) {
      // Se il pattern ha un gruppo, usa quello, altrimenti usa il nome fisso
      result.fornitore = n ?? text.match(p)?.[0] ?? null;
      result.categoria = c;
      break;
    }
  }
  // Fallback: prima riga non vuota (spesso è il nome del fornitore)
  if (!result.fornitore) {
    const righe = text.split('\n').map(r => r.trim()).filter(r => r.length > 3 && r.length < 60);
    if (righe.length > 0) result.fornitore = righe[0];
  }

  // ── Importo ────────────────────────────────────────────────────────────
  for (const pattern of IMPORTO_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const val = parseImporto(match[1]);
      if (val !== null && val > 0 && val < 99999) {
        result.importo = val;
        break;
      }
    }
  }

  // ── Scadenza ───────────────────────────────────────────────────────────
  for (const pattern of SCADENZA_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const data = parseDataIT(match[1]);
      if (data) { result.scadenza = data; break; }
    }
  }

  return result;
}

// ── 4. CLAUDE API (opzionale, "bring your own key") ───────────────────────
export async function analyzeWithClaude(payload, apiKey, isImage = false) {
  const userContent = isImage
    ? [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: payload.replace(/^data:image\/jpeg;base64,/, ''),
          },
        },
        { type: 'text', text: 'Analizza questa bolletta italiana ed estrai i dati richiesti.' },
      ]
    : [{ type: 'text', text: `Analizza questa bolletta italiana:\n\n${payload.slice(0, 6000)}` }];

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: `Sei un estrattore dati per bollette italiane. Rispondi ESCLUSIVAMENTE con JSON valido, nessun testo extra, nessun markdown.
Formato richiesto:
{"fornitore":"nome azienda","importo":0.00,"scadenza":"GG/MM/AAAA","categoria":"utilities|subscription|taxes|other"}
Usa null per i campi non rilevabili. importo deve essere un numero float.`,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const raw  = data.content?.[0]?.text || '{}';
  // Pulisce eventuali blocchi markdown residui
  const clean = raw.replace(/```(?:json)?/g, '').trim();
  return { ...JSON.parse(clean), fonte: 'claude' };
}

// ── 5. ENTRY POINT PRINCIPALE ─────────────────────────────────────────────
/**
 * Analizza un file PDF bolletta.
 * @param {File}   file     - File PDF selezionato dall'utente
 * @param {string} [apiKey] - Anthropic API key (opzionale)
 * @returns {{ fornitore, importo, scadenza, categoria, fonte, warn }}
 */
export async function analyzePDFBill(file, apiKey = null) {
  // Step 1: prova estrazione testo
  let text = '';
  try { text = await extractTextFromPDF(file); } catch {}

  const isPDFDigitale = text.length > 80;

  // Step 2a: Claude disponibile + PDF digitale → testo a Claude
  if (apiKey && isPDFDigitale) {
    try {
      return await analyzeWithClaude(text, apiKey, false);
    } catch (e) {
      console.warn('[pdfAnalyzer] Claude text API failed, fallback regex:', e.message);
    }
  }

  // Step 2b: Claude disponibile + PDF scansionato → immagine a Claude
  if (apiKey && !isPDFDigitale) {
    try {
      const img = await renderPageAsImage(file);
      return await analyzeWithClaude(img, apiKey, true);
    } catch (e) {
      console.warn('[pdfAnalyzer] Claude vision API failed, fallback regex:', e.message);
    }
  }

  // Step 3: Solo regex (offline, sempre disponibile)
  if (isPDFDigitale) {
    const result = analyzeBillText(text);
    return { ...result, warn: !result.importo || !result.scadenza };
  }

  // PDF scansionato senza Claude → non possiamo fare nulla
  return {
    fornitore: null, importo: null, scadenza: null,
    categoria: 'other', fonte: 'none',
    warn: true, errore: 'pdf_scansionato',
  };
}
