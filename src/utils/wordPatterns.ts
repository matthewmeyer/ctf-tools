/**
 * Word-pattern analysis and alternative scoring strategies for breaking
 * ciphers that use synonym substitution or other frequency-flattening tricks.
 *
 * Standard chi-squared fails when the plaintext's letter distribution has been
 * deliberately distorted (e.g., replacing "the" with "that", "big" with "large").
 * These utilities provide pattern-based and n-gram-based strategies instead.
 */

import { letterFrequency, chiSquaredScore } from './crypto';

// ── Word Pattern Matching ──

/**
 * Generate a canonical "shape" signature for a word.
 * e.g., "HELLO" → "ABCCD", "MEET" → "ABBC", "BANANA" → "ABCBCB"
 * This is invariant under substitution — a Caesar or substitution cipher
 * preserves word shapes.
 */
export function wordPattern(word: string): string {
  const upper = word.toUpperCase();
  const mapping: Record<string, string> = {};
  let nextChar = 65; // 'A'
  let pattern = '';
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (!(ch in mapping)) {
      mapping[ch] = String.fromCharCode(nextChar++);
    }
    pattern += mapping[ch];
  }
  return pattern;
}

/**
 * Extract "words" (contiguous alpha runs) from cipher text.
 * Returns array of {word, positions} where positions are start indices.
 */
export function extractWords(text: string): Array<{ word: string; index: number }> {
  const results: Array<{ word: string; index: number }> = [];
  const regex = /[A-Za-z]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({ word: match[0].toUpperCase(), index: match.index });
  }
  return results;
}

// ── Common English Word Dictionary (by pattern) ──
// ~500 most common English words organized by their word pattern.
// This allows matching cipher words to plaintext candidates by shape alone.

const COMMON_WORDS: string[] = [
  // 1-letter
  'A',
  'I',
  // 2-letter
  'AN',
  'AM',
  'AS',
  'AT',
  'BE',
  'BY',
  'DO',
  'GO',
  'HE',
  'IF',
  'IN',
  'IS',
  'IT',
  'ME',
  'MY',
  'NO',
  'OF',
  'ON',
  'OR',
  'SO',
  'TO',
  'UP',
  'US',
  'WE',
  // 3-letter
  'THE',
  'AND',
  'FOR',
  'ARE',
  'BUT',
  'NOT',
  'YOU',
  'ALL',
  'CAN',
  'HER',
  'WAS',
  'ONE',
  'OUR',
  'OUT',
  'DAY',
  'HAD',
  'HAS',
  'HIS',
  'HOW',
  'ITS',
  'LET',
  'MAY',
  'NEW',
  'NOW',
  'OLD',
  'SEE',
  'WAY',
  'WHO',
  'DID',
  'GET',
  'HIM',
  'MAN',
  'SAY',
  'SHE',
  'TOO',
  'USE',
  'ADD',
  'AGE',
  'AGO',
  'AID',
  'AIM',
  'AIR',
  'ASK',
  'ATE',
  'BAD',
  'BIG',
  'BOX',
  'BOY',
  'CAR',
  'CUT',
  'EAT',
  'END',
  'FAR',
  'FEW',
  'GOD',
  'GOT',
  'GUN',
  'GUY',
  'HOT',
  'JOB',
  'KEY',
  'LAW',
  'LAY',
  'LED',
  'LOT',
  'LOW',
  'MAP',
  'MET',
  'MRS',
  'OIL',
  'PAY',
  'PUT',
  'RAN',
  'RED',
  'RUN',
  'SET',
  'SIT',
  'SIX',
  'TEN',
  'TOP',
  'TRY',
  'TWO',
  'WAR',
  'WON',
  'YET',
  // 4-letter
  'THAT',
  'WITH',
  'HAVE',
  'THIS',
  'WILL',
  'YOUR',
  'FROM',
  'THEY',
  'BEEN',
  'CALL',
  'COME',
  'EACH',
  'FIND',
  'GIVE',
  'GOOD',
  'HAND',
  'HERE',
  'HIGH',
  'JUST',
  'KEEP',
  'KNOW',
  'LAST',
  'LIFE',
  'LIKE',
  'LINE',
  'LONG',
  'LOOK',
  'MADE',
  'MAKE',
  'MANY',
  'MORE',
  'MOST',
  'MUCH',
  'MUST',
  'NAME',
  'NEED',
  'ONLY',
  'OVER',
  'PART',
  'SAME',
  'SHOW',
  'SIDE',
  'SOME',
  'SUCH',
  'SURE',
  'TAKE',
  'TELL',
  'THAN',
  'THEM',
  'THEN',
  'THEY',
  'TIME',
  'TURN',
  'UPON',
  'VERY',
  'WANT',
  'WELL',
  'WENT',
  'WERE',
  'WHAT',
  'WHEN',
  'WHOM',
  'WORK',
  'YEAR',
  'ALSO',
  'BACK',
  'BEST',
  'BOTH',
  'CAME',
  'CASE',
  'CITY',
  'DAYS',
  'DOES',
  'DONE',
  'DOWN',
  'EVEN',
  'FACT',
  'FEEL',
  'FOUR',
  'FULL',
  'GOES',
  'GONE',
  'HALF',
  'HARD',
  'HEAD',
  'HELP',
  'HOME',
  'IDEA',
  'INTO',
  'KIND',
  'LAND',
  'LEFT',
  'LESS',
  'LIVE',
  'MEAN',
  'MIND',
  'MOVE',
  'NEXT',
  'OPEN',
  'PLAN',
  'PLAY',
  'POINT',
  'READ',
  'REAL',
  'SAID',
  'SEEN',
  'SEEM',
  'SELF',
  'SENT',
  'SOON',
  'STOP',
  'TOLD',
  'TRUE',
  'USED',
  'WORD',
  'ABLE',
  // 5-letter
  'ABOUT',
  'AFTER',
  'AGAIN',
  'BEING',
  'BELOW',
  'COULD',
  'EVERY',
  'FIRST',
  'FOUND',
  'GREAT',
  'HOUSE',
  'LARGE',
  'LATER',
  'NEVER',
  'OTHER',
  'PLACE',
  'POINT',
  'RIGHT',
  'SHALL',
  'SINCE',
  'SMALL',
  'SOUND',
  'STILL',
  'STUDY',
  'THEIR',
  'THERE',
  'THESE',
  'THING',
  'THINK',
  'THREE',
  'UNDER',
  'WATER',
  'WHERE',
  'WHICH',
  'WHILE',
  'WORLD',
  'WOULD',
  'WRITE',
  'ABOVE',
  'ALONG',
  'BEGIN',
  'BLACK',
  'BRING',
  'BUILD',
  'CARRY',
  'CAUSE',
  'CHILD',
  'CLOSE',
  'COVER',
  'EARLY',
  'EARTH',
  'EIGHT',
  'GIVEN',
  'GREEN',
  'GROUP',
  'HUMAN',
  'ISSUE',
  'KNOWN',
  'LEARN',
  'LEVEL',
  'LIGHT',
  'LOCAL',
  'MIGHT',
  'MONEY',
  'MONTH',
  'NIGHT',
  'OFTEN',
  'ORDER',
  'PAPER',
  'PARTY',
  'POWER',
  'PRESS',
  'QUITE',
  'REACH',
  'SHORT',
  'SHOWN',
  'SPEAK',
  'STAND',
  'START',
  'STATE',
  'STORY',
  'TABLE',
  'TODAY',
  'TOTAL',
  'UNTIL',
  'USUAL',
  'VALUE',
  'WHITE',
  'WOMAN',
  'YOUNG',
  // 6-letter
  'PEOPLE',
  'BEFORE',
  'SHOULD',
  'AROUND',
  'CHANGE',
  'FAMILY',
  'FOLLOW',
  'LITTLE',
  'NUMBER',
  'OFFICE',
  'PUBLIC',
  'REASON',
  'SCHOOL',
  'SECOND',
  'SYSTEM',
  'WITHIN',
  'ALWAYS',
  'BECOME',
  'BETTER',
  'CALLED',
  'COMMON',
  'COURSE',
  'DURING',
  'ENOUGH',
  'FIGURE',
  'FATHER',
  'GIVING',
  'GROWTH',
  'HAVING',
  'ITSELF',
  'MEMBER',
  'MOMENT',
  'MOTHER',
  'MOVING',
  'NATION',
  'POLICY',
  'RATHER',
  'REPORT',
  'RESULT',
  'RETURN',
  'SOCIAL',
  'STRONG',
  'TAKING',
  'THOUGH',
  'UNITED',
  'WANTED',
  'WITHIN',
  'MARKET',
  // 7-letter
  'BECAUSE',
  'BETWEEN',
  'COUNTRY',
  'GENERAL',
  'HISTORY',
  'MILLION',
  'NOTHING',
  'PROBLEM',
  'PROGRAM',
  'HOWEVER',
  'ANOTHER',
  'BROUGHT',
  'CERTAIN',
  'CHAPTER',
  'COMPANY',
  'CULTURE',
  'CURRENT',
  'DEVELOP',
  'ECONOMIC',
  'EXAMPLE',
  'FEELING',
  'FOREIGN',
  'FORWARD',
  'FURTHER',
  'HERSELF',
  'HIMSELF',
  'HUNDRED',
  'INCLUDE',
  'LOOKING',
  'MEETING',
  'MORNING',
  'NATURAL',
  'PERHAPS',
  'PICTURE',
  'POPULAR',
  'PRESENT',
  'QUALITY',
  'READING',
  'RUNNING',
  'SEVERAL',
  'SERVICE',
  'SOCIETY',
  'SPECIAL',
  'STUDENT',
  'SUBJECT',
  'SUPPORT',
  'TEACHER',
  'THROUGH',
  'THOUGHT',
  'TURNING',
  'VILLAGE',
  'WHETHER',
  'WITHOUT',
  'WORKING',
  'WRITTEN',
];

// Build pattern→words lookup (lazy singleton)
let _patternDict: Map<string, string[]> | null = null;

export function getPatternDictionary(): Map<string, string[]> {
  if (_patternDict) return _patternDict;
  _patternDict = new Map();
  for (const w of COMMON_WORDS) {
    const p = wordPattern(w);
    if (!_patternDict.has(p)) {
      _patternDict.set(p, []);
    }
    const list = _patternDict.get(p)!;
    if (!list.includes(w)) {
      list.push(w);
    }
  }
  return _patternDict;
}

/**
 * For each cipher word, find candidate plaintext words with the same pattern.
 * Returns map of cipherWord → candidate plaintext words.
 */
export function findPatternMatches(cipherWords: string[]): Map<string, string[]> {
  const dict = getPatternDictionary();
  const results = new Map<string, string[]>();
  const seen = new Set<string>();

  for (const cw of cipherWords) {
    if (seen.has(cw)) continue;
    seen.add(cw);
    const pattern = wordPattern(cw);
    const candidates = dict.get(pattern) || [];
    if (candidates.length > 0) {
      results.set(cw, candidates);
    }
  }
  return results;
}

/**
 * Derive letter mappings from a cipher word → plaintext word pair.
 * Returns null if the mapping is inconsistent (same cipher letter maps to
 * two different plain letters, or two cipher letters map to same plain letter).
 */
export function deriveMappingFromPair(
  cipherWord: string,
  plainWord: string,
): Record<string, string> | null {
  if (cipherWord.length !== plainWord.length) return null;
  const forward: Record<string, string> = {};
  const reverse: Record<string, string> = {};

  for (let i = 0; i < cipherWord.length; i++) {
    const c = cipherWord[i].toUpperCase();
    const p = plainWord[i].toUpperCase();
    if (forward[c] && forward[c] !== p) return null;
    if (reverse[p] && reverse[p] !== c) return null;
    forward[c] = p;
    reverse[p] = c;
  }
  return forward;
}

/**
 * Check if a partial mapping is consistent with existing mappings.
 * Returns true if merging newMapping into existing doesn't create conflicts.
 */
export function isMappingConsistent(
  existing: Record<string, string>,
  newMapping: Record<string, string>,
): boolean {
  const reverseExisting: Record<string, string> = {};
  for (const [c, p] of Object.entries(existing)) {
    reverseExisting[p] = c;
  }

  for (const [c, p] of Object.entries(newMapping)) {
    if (existing[c] && existing[c] !== p) return false;
    if (reverseExisting[p] && reverseExisting[p] !== c) return false;
  }
  return true;
}

/**
 * Merge a new mapping into an existing one.
 * Returns null if inconsistent.
 */
export function mergeMappings(
  existing: Record<string, string>,
  newMapping: Record<string, string>,
): Record<string, string> | null {
  if (!isMappingConsistent(existing, newMapping)) return null;
  return { ...existing, ...newMapping };
}

// ── Alternative Scoring Strategies ──

// English bigram log-probabilities (approximation from large corpus)
// Higher = more English-like. Based on letter-pair frequencies.
const ENGLISH_BIGRAM_FREQ: Record<string, number> = {
  TH: 3.56,
  HE: 3.07,
  IN: 2.43,
  ER: 2.05,
  AN: 1.99,
  RE: 1.85,
  ON: 1.76,
  AT: 1.49,
  EN: 1.45,
  ND: 1.35,
  TI: 1.34,
  ES: 1.34,
  OR: 1.28,
  TE: 1.27,
  OF: 1.17,
  ED: 1.17,
  IS: 1.13,
  IT: 1.12,
  AL: 1.09,
  AR: 1.07,
  ST: 1.05,
  TO: 1.05,
  NT: 1.04,
  NG: 0.95,
  SE: 0.93,
  HA: 0.93,
  AS: 0.87,
  OU: 0.87,
  IO: 0.83,
  LE: 0.83,
  VE: 0.83,
  CO: 0.79,
  ME: 0.79,
  DE: 0.76,
  HI: 0.76,
  RI: 0.73,
  RO: 0.73,
  IC: 0.7,
  NE: 0.69,
  EA: 0.69,
  RA: 0.69,
  CE: 0.65,
  LI: 0.62,
  CH: 0.6,
  LL: 0.58,
  MA: 0.57,
  CA: 0.53,
  EL: 0.53,
  SI: 0.53,
};

/**
 * Score text by bigram fitness (log-probability sum).
 * Higher = more English-like. This is resistant to single-letter frequency
 * manipulation because it looks at letter PAIRS.
 *
 * Returns a negative number (log-probability); closer to 0 = more English.
 * Typically ranges from about -2 (very English) to -8 (random).
 */
export function bigramFitnessScore(text: string): number {
  const upper = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.length < 2) return -100;

  let score = 0;
  let count = 0;
  for (let i = 0; i < upper.length - 1; i++) {
    const bg = upper[i] + upper[i + 1];
    const freq = ENGLISH_BIGRAM_FREQ[bg] || 0.01;
    score += Math.log(freq);
    count++;
  }
  return count > 0 ? score / count : -100;
}

/**
 * Score text by how many recognizable English words it contains.
 * Returns ratio (0-1) of characters that are part of recognized words.
 * Resistant to frequency manipulation since it checks whole words.
 */
export function wordRecognitionScore(text: string): number {
  const dict = getPatternDictionary();
  const allWords = new Set<string>();
  for (const list of dict.values()) {
    for (const w of list) {
      allWords.add(w);
    }
  }

  const words = extractWords(text);
  if (words.length === 0) return 0;

  let recognizedChars = 0;
  let totalChars = 0;
  for (const { word } of words) {
    totalChars += word.length;
    if (allWords.has(word)) {
      recognizedChars += word.length;
    }
  }
  return totalChars > 0 ? recognizedChars / totalChars : 0;
}

/**
 * Combined scoring strategy that blends multiple signals.
 * Returns a single score where LOWER = more likely English.
 *
 * This is specifically designed to work even when letter frequencies
 * have been deliberately distorted (synonym substitution, etc.).
 */
export function combinedScore(text: string): number {
  const chi2 = chiSquaredScore(text);
  const bigram = bigramFitnessScore(text);
  const wordRec = wordRecognitionScore(text);

  // Normalize each into a 0-100 range where lower = better
  const chi2Norm = Math.min(chi2, 500); // cap at 500
  const bigramNorm = Math.max(0, (-bigram - 1) * 30); // transform: -1→0, -4→90
  const wordNorm = (1 - wordRec) * 100; // 1.0 recognition → 0, 0.0 → 100

  // Weight: bigram and word recognition get higher weight than chi-squared
  // because they're more robust against synonym substitution
  return chi2Norm * 0.2 + bigramNorm * 0.4 + wordNorm * 0.4;
}

// ── Distribution Analysis ──

/**
 * Measure how "flat" a frequency distribution is.
 * Returns 0 for perfectly uniform, higher for more peaked.
 * A flat distribution suggests homophonic cipher or frequency manipulation.
 *
 * Uses standard deviation of letter frequencies as the metric.
 * English text typically scores ~2.5-3.5, uniform would score ~0.
 */
export function flatnessScore(text: string): number {
  const freq = letterFrequency(text);
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  const percentages = Object.values(freq).map((c) => (c / total) * 100);
  const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const variance = percentages.reduce((a, p) => a + (p - mean) ** 2, 0) / percentages.length;
  return Math.sqrt(variance);
}

/**
 * Detect if text might use a homophonic or expanded alphabet cipher.
 * Returns info about the alphabet properties.
 */
export function analyzeAlphabet(text: string): {
  uniqueChars: number;
  alphaChars: number;
  nonAlphaSymbols: number;
  possibleHomophonic: boolean;
  flatness: number;
  expectedFlatness: string;
} {
  const chars = new Set(text);
  const alphaChars = new Set(text.toUpperCase().replace(/[^A-Z]/g, ''));
  const nonAlpha = new Set(text.replace(/[A-Za-z\s]/g, ''));

  const flatness = flatnessScore(text);
  // English ~2.5-3.5, flat <1.0, very flat <0.5
  const possibleHomophonic = flatness < 1.5 && text.length > 50;

  return {
    uniqueChars: chars.size,
    alphaChars: alphaChars.size,
    nonAlphaSymbols: nonAlpha.size,
    possibleHomophonic,
    flatness,
    expectedFlatness:
      flatness < 1.0
        ? 'Very flat (likely manipulated)'
        : flatness < 1.5
          ? 'Flatter than normal (possibly manipulated)'
          : flatness < 2.0
            ? 'Somewhat flat'
            : flatness < 3.0
              ? 'Normal English range'
              : 'Peaked (typical monoalphabetic)',
  };
}

// ── Scoring Strategy Type ──

export type ScoringStrategy = 'chi-squared' | 'bigram' | 'word-recognition' | 'combined';

export interface ScoringResult {
  text: string;
  scores: Record<ScoringStrategy, number>;
  primaryScore: number;
  label: string;
}

/**
 * Score a candidate decryption with all strategies.
 * The primaryScore uses the specified strategy.
 */
export function scoreCandidate(
  text: string,
  strategy: ScoringStrategy,
  label: string,
): ScoringResult {
  const chi2 = chiSquaredScore(text);
  const bigram = bigramFitnessScore(text);
  const wordRec = wordRecognitionScore(text);
  const combined = combinedScore(text);

  const scores: Record<ScoringStrategy, number> = {
    'chi-squared': chi2,
    bigram: -bigram, // negate so lower = better (consistent with others)
    'word-recognition': 1 - wordRec, // invert so lower = better
    combined: combined,
  };

  return {
    text,
    scores,
    primaryScore: scores[strategy],
    label,
  };
}

/**
 * Sort scoring results by primary score (lower = better for all strategies).
 */
export function rankResults(results: ScoringResult[]): ScoringResult[] {
  return results.slice().sort((a, b) => a.primaryScore - b.primaryScore);
}

// ── Crib / Known-Plaintext Helpers ──

/**
 * Given a crib (known plaintext fragment) and ciphertext, find positions
 * where the crib could align and derive partial mappings.
 */
export function findCribPositions(
  ciphertext: string,
  crib: string,
): Array<{ position: number; mapping: Record<string, string> }> {
  const ct = ciphertext.toUpperCase();
  const cr = crib.toUpperCase();
  const results: Array<{ position: number; mapping: Record<string, string> }> = [];

  for (let i = 0; i <= ct.length - cr.length; i++) {
    const segment = ct.substring(i, i + cr.length);
    const mapping = deriveMappingFromPair(segment, cr);
    if (mapping) {
      results.push({ position: i, mapping });
    }
  }
  return results;
}
