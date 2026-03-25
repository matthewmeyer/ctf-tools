/**
 * Shared cryptanalysis utility functions used across CTF tools.
 */

// Standard English letter frequencies (percentage)
export const ENGLISH_FREQUENCIES: Record<string, number> = {
  A: 8.167,
  B: 1.492,
  C: 2.782,
  D: 4.253,
  E: 12.702,
  F: 2.228,
  G: 2.015,
  H: 6.094,
  I: 6.966,
  J: 0.153,
  K: 0.772,
  L: 4.025,
  M: 2.406,
  N: 6.749,
  O: 7.507,
  P: 1.929,
  Q: 0.095,
  R: 5.987,
  S: 6.327,
  T: 9.056,
  U: 2.758,
  V: 0.978,
  W: 2.36,
  X: 0.15,
  Y: 1.974,
  Z: 0.074,
};

// Common English bigrams
export const ENGLISH_BIGRAMS: string[] = [
  'TH',
  'HE',
  'IN',
  'ER',
  'AN',
  'RE',
  'ON',
  'AT',
  'EN',
  'ND',
  'TI',
  'ES',
  'OR',
  'TE',
  'OF',
  'ED',
  'IS',
  'IT',
  'AL',
  'AR',
];

// Common English trigrams
export const ENGLISH_TRIGRAMS: string[] = [
  'THE',
  'AND',
  'ING',
  'HER',
  'HAT',
  'HIS',
  'THA',
  'ERE',
  'FOR',
  'ENT',
  'ION',
  'TER',
  'WAS',
  'YOU',
  'ITH',
  'VER',
  'ALL',
  'WIT',
  'THI',
  'TIO',
];

/** Count letter frequencies in text (A-Z only) */
export function letterFrequency(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    counts[ch] = 0;
  }
  for (const ch of text.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch]++;
    }
  }
  return counts;
}

/** Count letter frequencies as percentages */
export function letterFrequencyPercent(text: string): Record<string, number> {
  const counts = letterFrequency(text);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return counts;
  const result: Record<string, number> = {};
  for (const [ch, count] of Object.entries(counts)) {
    result[ch] = (count / total) * 100;
  }
  return result;
}

/** Count n-gram frequencies */
export function ngramFrequency(text: string, n: number): Record<string, number> {
  const upper = text.toUpperCase().replace(/[^A-Z]/g, '');
  const counts: Record<string, number> = {};
  for (let i = 0; i <= upper.length - n; i++) {
    const gram = upper.substring(i, i + n);
    counts[gram] = (counts[gram] || 0) + 1;
  }
  return counts;
}

/**
 * Chi-squared statistic comparing observed letter frequencies to English.
 * Lower = more English-like.
 */
export function chiSquaredScore(text: string): number {
  const freq = letterFrequency(text);
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return Infinity;

  let chi2 = 0;
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const observed = freq[ch];
    const expected = (ENGLISH_FREQUENCIES[ch] / 100) * total;
    if (expected > 0) {
      chi2 += (observed - expected) ** 2 / expected;
    }
  }
  return chi2;
}

/** Index of Coincidence for a text */
export function indexOfCoincidence(text: string): number {
  const freq = letterFrequency(text);
  const n = Object.values(freq).reduce((a, b) => a + b, 0);
  if (n <= 1) return 0;

  let sum = 0;
  for (const count of Object.values(freq)) {
    sum += count * (count - 1);
  }
  return sum / (n * (n - 1));
}

/** Shannon entropy in bits per character */
export function shannonEntropy(data: string): number {
  if (data.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const ch of data) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / data.length;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/** Shannon entropy for raw bytes */
export function shannonEntropyBytes(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const freq = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    freq[bytes[i]]++;
  }
  let entropy = 0;
  for (const count of freq) {
    if (count > 0) {
      const p = count / bytes.length;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

// ── Caesar / ROT ──

/** Apply Caesar shift to a single character (preserves case, ignores non-alpha) */
export function caesarShiftChar(ch: string, shift: number): string {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
  }
  return ch;
}

/** Apply Caesar shift to entire string */
export function caesarShift(text: string, shift: number): string {
  return text
    .split('')
    .map((ch) => caesarShiftChar(ch, shift))
    .join('');
}

// ── Vigenère ──

export function vigenereEncrypt(plaintext: string, key: string): string {
  if (!key) return plaintext;
  const upperKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (upperKey.length === 0) return plaintext;

  let ki = 0;
  return plaintext
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        const shift = upperKey.charCodeAt(ki % upperKey.length) - 65;
        ki++;
        return caesarShiftChar(ch, shift);
      }
      return ch;
    })
    .join('');
}

export function vigenereDecrypt(ciphertext: string, key: string): string {
  if (!key) return ciphertext;
  const upperKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (upperKey.length === 0) return ciphertext;

  let ki = 0;
  return ciphertext
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        const shift = upperKey.charCodeAt(ki % upperKey.length) - 65;
        ki++;
        return caesarShiftChar(ch, -shift);
      }
      return ch;
    })
    .join('');
}

/** Kasiski examination: find repeated sequences and their distances */
export function kasiskiExamination(text: string, minLen: number = 3): Map<number, number> {
  const upper = text.toUpperCase().replace(/[^A-Z]/g, '');
  const distances: number[] = [];

  for (let len = minLen; len <= Math.min(20, Math.floor(upper.length / 2)); len++) {
    const seen = new Map<string, number[]>();
    for (let i = 0; i <= upper.length - len; i++) {
      const seq = upper.substring(i, i + len);
      if (!seen.has(seq)) {
        seen.set(seq, []);
      }
      seen.get(seq)!.push(i);
    }
    for (const positions of seen.values()) {
      if (positions.length >= 2) {
        for (let i = 1; i < positions.length; i++) {
          distances.push(positions[i] - positions[0]);
        }
      }
    }
  }

  // Count GCD factors
  const factorCounts = new Map<number, number>();
  for (const dist of distances) {
    for (let f = 2; f <= Math.min(dist, 20); f++) {
      if (dist % f === 0) {
        factorCounts.set(f, (factorCounts.get(f) || 0) + 1);
      }
    }
  }
  return factorCounts;
}

// ── XOR ──

/** XOR a Uint8Array with a key (repeating) */
export function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) return data;
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

/** Score how "printable ASCII" a byte array is (0-1, higher = more printable) */
export function printableScore(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  let printable = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (
      (bytes[i] >= 32 && bytes[i] <= 126) ||
      bytes[i] === 9 ||
      bytes[i] === 10 ||
      bytes[i] === 13
    ) {
      printable++;
    }
  }
  return printable / bytes.length;
}

/** Convert hex string to Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array to hex string */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/** Convert string to Uint8Array (UTF-8) */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert Uint8Array to string (UTF-8) */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

// ── Atbash ──

export function atbash(text: string): string {
  return text
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
      if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
      return ch;
    })
    .join('');
}

// ── Affine ──

function modInverse(a: number, m: number): number | null {
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return null;
}

export function affineEncrypt(text: string, a: number, b: number): string {
  return text
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((a * (code - 65) + b) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((a * (code - 97) + b) % 26) + 97);
      }
      return ch;
    })
    .join('');
}

export function affineDecrypt(text: string, a: number, b: number): string | null {
  const aInv = modInverse(a, 26);
  if (aInv === null) return null;
  return text
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((aInv * (code - 65 - b + 26 * 26)) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((aInv * (code - 97 - b + 26 * 26)) % 26) + 97);
      }
      return ch;
    })
    .join('');
}

// Valid 'a' values for affine cipher (coprime with 26)
export const AFFINE_VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

// ── Playfair ──

export function generatePlayfairGrid(key: string): string[] {
  const seen = new Set<string>();
  const grid: string[] = [];
  const keyUpper = (key.toUpperCase() + 'ABCDEFGHIKLMNOPQRSTUVWXYZ').replace(/J/g, 'I');
  for (const ch of keyUpper) {
    if (ch >= 'A' && ch <= 'Z' && !seen.has(ch)) {
      seen.add(ch);
      grid.push(ch);
    }
  }
  return grid;
}

export function playfairEncrypt(plaintext: string, key: string): string {
  const grid = generatePlayfairGrid(key);
  const pos = (ch: string) => {
    const idx = grid.indexOf(ch);
    return [Math.floor(idx / 5), idx % 5];
  };

  // Prepare digraphs
  let clean = plaintext
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/J/g, 'I');
  const pairs: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = clean[i];
    const b = i + 1 < clean.length ? clean[i + 1] : 'X';
    if (a === b) {
      pairs.push(a + 'X');
      i++;
    } else {
      pairs.push(a + b);
      i += 2;
    }
  }

  return pairs
    .map((pair) => {
      const [r1, c1] = pos(pair[0]);
      const [r2, c2] = pos(pair[1]);
      if (r1 === r2) {
        return grid[r1 * 5 + ((c1 + 1) % 5)] + grid[r2 * 5 + ((c2 + 1) % 5)];
      } else if (c1 === c2) {
        return grid[((r1 + 1) % 5) * 5 + c1] + grid[((r2 + 1) % 5) * 5 + c2];
      } else {
        return grid[r1 * 5 + c2] + grid[r2 * 5 + c1];
      }
    })
    .join(' ');
}

export function playfairDecrypt(ciphertext: string, key: string): string {
  const grid = generatePlayfairGrid(key);
  const pos = (ch: string) => {
    const idx = grid.indexOf(ch);
    return [Math.floor(idx / 5), idx % 5];
  };

  const clean = ciphertext
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/J/g, 'I');
  const pairs: string[] = [];
  for (let i = 0; i < clean.length - 1; i += 2) {
    pairs.push(clean[i] + clean[i + 1]);
  }

  return pairs
    .map((pair) => {
      const [r1, c1] = pos(pair[0]);
      const [r2, c2] = pos(pair[1]);
      if (r1 === r2) {
        return grid[r1 * 5 + ((c1 + 4) % 5)] + grid[r2 * 5 + ((c2 + 4) % 5)];
      } else if (c1 === c2) {
        return grid[((r1 + 4) % 5) * 5 + c1] + grid[((r2 + 4) % 5) * 5 + c2];
      } else {
        return grid[r1 * 5 + c2] + grid[r2 * 5 + c1];
      }
    })
    .join(' ');
}

// ── Rail Fence ──

export function railFenceEncrypt(text: string, rails: number): string {
  if (rails <= 1 || rails >= text.length) return text;
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;
  for (const ch of text) {
    fence[rail].push(ch);
    if (rail === 0) direction = 1;
    if (rail === rails - 1) direction = -1;
    rail += direction;
  }
  return fence.map((r) => r.join('')).join('');
}

export function railFenceDecrypt(cipher: string, rails: number): string {
  if (rails <= 1 || rails >= cipher.length) return cipher;
  const len = cipher.length;
  const fence: (string | null)[][] = Array.from({ length: rails }, () => new Array(len).fill(null));

  // Mark the pattern
  let rail = 0;
  let direction = 1;
  for (let i = 0; i < len; i++) {
    fence[rail][i] = '*';
    if (rail === 0) direction = 1;
    if (rail === rails - 1) direction = -1;
    rail += direction;
  }

  // Fill in characters
  let idx = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < len; c++) {
      if (fence[r][c] === '*') {
        fence[r][c] = cipher[idx++];
      }
    }
  }

  // Read off
  const result: string[] = [];
  rail = 0;
  direction = 1;
  for (let i = 0; i < len; i++) {
    result.push(fence[rail][i]!);
    if (rail === 0) direction = 1;
    if (rail === rails - 1) direction = -1;
    rail += direction;
  }
  return result.join('');
}
