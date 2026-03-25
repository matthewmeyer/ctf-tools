import { useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Dropdown,
  Option,
  Textarea,
  Label,
} from '@fluentui/react-components';
import { Copy24Regular, ArrowSwap24Regular } from '@fluentui/react-icons';

// --- Base32 encoder/decoder (RFC 4648) ---
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  // Pad to multiple of 8
  while (output.length % 8 !== 0) {
    output += '=';
  }
  return output;
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// --- Conversion helpers ---
function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s+/g, '');
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join(' ');
}

function binaryToBytes(binary: string): Uint8Array {
  const groups = binary.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    if (!/^[01]{1,8}$/.test(groups[i])) throw new Error('Invalid binary');
    bytes[i] = parseInt(groups[i], 2);
  }
  return bytes;
}

function bytesToOctal(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(8).padStart(3, '0'))
    .join(' ');
}

function octalToBytes(octal: string): Uint8Array {
  const groups = octal.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    const val = parseInt(groups[i], 8);
    if (isNaN(val) || val > 255 || val < 0) throw new Error('Invalid octal');
    bytes[i] = val;
  }
  return bytes;
}

function bytesToDecimal(bytes: Uint8Array): string {
  return Array.from(bytes).join(' ');
}

function decimalToBytes(dec: string): Uint8Array {
  const groups = dec.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    const val = parseInt(groups[i], 10);
    if (isNaN(val) || val > 255 || val < 0) throw new Error('Invalid decimal');
    bytes[i] = val;
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type InputFormat = 'auto' | 'text' | 'base64' | 'base32' | 'hex' | 'binary' | 'octal' | 'decimal';

interface FormatOutput {
  label: string;
  key: string;
  value: string;
  error?: string;
}

function tryParseInput(
  raw: string,
  format: InputFormat,
): { bytes: Uint8Array | null; detectedFormat: string } {
  if (!raw.trim()) return { bytes: new Uint8Array(), detectedFormat: 'empty' };

  if (format !== 'auto') {
    try {
      const bytes = parseFormat(raw, format);
      return { bytes, detectedFormat: format };
    } catch {
      return { bytes: null, detectedFormat: format };
    }
  }

  // Auto-detect: try formats in order of specificity
  // Check hex: space-separated pairs of hex digits
  if (/^([0-9a-fA-F]{2}\s)*[0-9a-fA-F]{2}$/.test(raw.trim())) {
    try {
      return { bytes: hexToBytes(raw), detectedFormat: 'hex' };
    } catch {
      /* fall through */
    }
  }
  // Check binary: space-separated 8-bit groups
  if (/^([01]{8}\s)*[01]{8}$/.test(raw.trim())) {
    try {
      return { bytes: binaryToBytes(raw), detectedFormat: 'binary' };
    } catch {
      /* fall through */
    }
  }
  // Check octal: space-separated 3-digit octal groups all <= 377
  if (/^(\d{3}\s)*\d{3}$/.test(raw.trim())) {
    try {
      return { bytes: octalToBytes(raw), detectedFormat: 'octal' };
    } catch {
      /* fall through */
    }
  }
  // Check decimal: space-separated numbers 0-255
  if (/^(\d{1,3}\s)*\d{1,3}$/.test(raw.trim())) {
    try {
      const b = decimalToBytes(raw);
      return { bytes: b, detectedFormat: 'decimal' };
    } catch {
      /* fall through */
    }
  }
  // Check base64
  if (/^[A-Za-z0-9+/]+=*$/.test(raw.trim()) && raw.trim().length >= 4) {
    try {
      return { bytes: base64ToBytes(raw.trim()), detectedFormat: 'base64' };
    } catch {
      /* fall through */
    }
  }
  // Check base32
  if (/^[A-Z2-7]+=*$/i.test(raw.trim()) && raw.trim().length >= 8) {
    try {
      return { bytes: base32Decode(raw.trim()), detectedFormat: 'base32' };
    } catch {
      /* fall through */
    }
  }

  // Fallback: treat as plain text
  return { bytes: textToBytes(raw), detectedFormat: 'text' };
}

function parseFormat(raw: string, format: InputFormat): Uint8Array {
  switch (format) {
    case 'text':
      return textToBytes(raw);
    case 'base64':
      return base64ToBytes(raw.trim());
    case 'base32':
      return base32Decode(raw.trim());
    case 'hex':
      return hexToBytes(raw);
    case 'binary':
      return binaryToBytes(raw);
    case 'octal':
      return octalToBytes(raw);
    case 'decimal':
      return decimalToBytes(raw);
    default:
      return textToBytes(raw);
  }
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%',
    padding: tokens.spacingVerticalL,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  formatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  outputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  outputCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedBadge: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
  },
});

const FORMAT_OPTIONS: { value: InputFormat; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'text', label: 'Text / ASCII' },
  { value: 'base64', label: 'Base64' },
  { value: 'base32', label: 'Base32' },
  { value: 'hex', label: 'Hex' },
  { value: 'binary', label: 'Binary' },
  { value: 'octal', label: 'Octal' },
  { value: 'decimal', label: 'Decimal' },
];

export function BaseConverter() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [inputFormat, setInputFormat] = useState<InputFormat>('auto');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { bytes, detectedFormat } = useMemo(
    () => tryParseInput(input, inputFormat),
    [input, inputFormat],
  );

  const outputs: FormatOutput[] = useMemo(() => {
    if (!bytes || bytes.length === 0) {
      return [
        { label: 'Text / ASCII', key: 'text', value: '' },
        { label: 'Base64', key: 'base64', value: '' },
        { label: 'Base32', key: 'base32', value: '' },
        { label: 'Hex', key: 'hex', value: '' },
        { label: 'Binary', key: 'binary', value: '' },
        { label: 'Octal', key: 'octal', value: '' },
        { label: 'Decimal', key: 'decimal', value: '' },
      ];
    }

    const results: FormatOutput[] = [];
    const safe = (fn: () => string, label: string, key: string) => {
      try {
        results.push({ label, key, value: fn() });
      } catch (e) {
        results.push({
          label,
          key,
          value: '',
          error: e instanceof Error ? e.message : 'Conversion error',
        });
      }
    };

    safe(() => bytesToText(bytes), 'Text / ASCII', 'text');
    safe(() => bytesToBase64(bytes), 'Base64', 'base64');
    safe(() => base32Encode(bytes), 'Base32', 'base32');
    safe(() => bytesToHex(bytes), 'Hex', 'hex');
    safe(() => bytesToBinary(bytes), 'Binary', 'binary');
    safe(() => bytesToOctal(bytes), 'Octal', 'octal');
    safe(() => bytesToDecimal(bytes), 'Decimal', 'decimal');

    return results;
  }, [bytes]);

  const handleCopy = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <ArrowSwap24Regular />
              <Text weight="semibold" size={400}>
                Base Converter
              </Text>
            </div>
          }
          description="Convert between Text, Base64, Base32, Hex, Binary, Octal, and Decimal"
        />

        <div className={styles.inputSection} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.formatRow}>
            <Label htmlFor="input-format">Input Format:</Label>
            <Dropdown
              id="input-format"
              value={FORMAT_OPTIONS.find((o) => o.value === inputFormat)?.label ?? ''}
              selectedOptions={[inputFormat]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) setInputFormat(data.optionValue as InputFormat);
              }}
              style={{ minWidth: '160px' }}
            >
              {FORMAT_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value} text={opt.label}>
                  {opt.label}
                </Option>
              ))}
            </Dropdown>
            {inputFormat === 'auto' && detectedFormat && input.trim() && (
              <span className={styles.detectedBadge}>Detected: {detectedFormat}</span>
            )}
          </div>

          <Label htmlFor="converter-input">Input:</Label>
          <Textarea
            id="converter-input"
            placeholder="Enter text, Base64, hex bytes, binary, etc."
            value={input}
            onChange={(_, data) => setInput(data.value)}
            resize="vertical"
            style={{ minHeight: '80px' }}
          />

          {!bytes && input.trim() && (
            <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
              Could not parse input as {inputFormat === 'auto' ? 'any format' : inputFormat}
            </Text>
          )}
        </div>
      </Card>

      <div className={styles.outputGrid}>
        {outputs.map((out) => (
          <Card key={out.key}>
            <div className={styles.outputCard}>
              <div className={styles.outputHeader}>
                <Label weight="semibold">{out.label}</Label>
                <Button
                  size="small"
                  icon={<Copy24Regular />}
                  appearance="subtle"
                  disabled={!out.value}
                  onClick={() => handleCopy(out.key, out.value)}
                >
                  {copiedKey === out.key ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              {out.error ? (
                <Text style={{ color: tokens.colorPaletteRedForeground1 }} size={200}>
                  {out.error}
                </Text>
              ) : (
                <Textarea
                  readOnly
                  value={out.value}
                  resize="vertical"
                  style={{ minHeight: '60px', fontFamily: 'monospace' }}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
