import { useState, useMemo, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Textarea,
  TabList,
  Tab,
  Label,
} from '@fluentui/react-components';
import { Copy24Regular, TextNumberFormat24Regular } from '@fluentui/react-icons';

// --- Conversion helpers ---
function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function bytesToDecimal(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(10))
    .join(' ');
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join(' ');
}

function bytesToOctal(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(8).padStart(3, '0'))
    .join(' ');
}

function textToUnicodeCodePoints(text: string): string {
  const points: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) {
      points.push('U+' + cp.toString(16).toUpperCase().padStart(4, '0'));
    }
  }
  return points.join(' ');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// --- Reverse conversions ---
function hexToText(hex: string): string {
  const cleaned = hex.replace(/\s+/g, '');
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('Invalid hex');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function decimalToText(dec: string): string {
  const groups = dec.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    const val = parseInt(groups[i], 10);
    if (isNaN(val) || val > 255 || val < 0) throw new Error('Invalid decimal byte');
    bytes[i] = val;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function binaryToText(bin: string): string {
  const groups = bin.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    if (!/^[01]{1,8}$/.test(groups[i])) throw new Error('Invalid binary');
    bytes[i] = parseInt(groups[i], 2);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function octalToText(oct: string): string {
  const groups = oct.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    const val = parseInt(groups[i], 8);
    if (isNaN(val) || val > 255 || val < 0) throw new Error('Invalid octal byte');
    bytes[i] = val;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function unicodeCodePointsToText(input: string): string {
  const matches = input.match(/U\+([0-9a-fA-F]{1,6})/gi);
  if (!matches) throw new Error('No valid U+XXXX code points found');
  return matches.map((m) => String.fromCodePoint(parseInt(m.slice(2), 16))).join('');
}

function base64ToText(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

type ReverseFormat = 'hex' | 'decimal' | 'binary' | 'octal' | 'unicode' | 'base64';

const REVERSE_FORMATS: { value: ReverseFormat; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'binary', label: 'Binary' },
  { value: 'octal', label: 'Octal' },
  { value: 'unicode', label: 'Unicode Code Points' },
  { value: 'base64', label: 'Base64' },
];

const REVERSE_DECODERS: Record<ReverseFormat, (s: string) => string> = {
  hex: hexToText,
  decimal: decimalToText,
  binary: binaryToText,
  octal: octalToText,
  unicode: unicodeCodePointsToText,
  base64: base64ToText,
};

interface FormatOutput {
  label: string;
  key: string;
  value: string;
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
  reverseSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  reverseGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  reversePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

export function HexAsciiUnicode() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<string>('text-to-codes');
  const [inputText, setInputText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reverse tab state
  const [reverseFormat, setReverseFormat] = useState<ReverseFormat>('hex');
  const [reverseInput, setReverseInput] = useState('');

  const bytes = useMemo(() => textToBytes(inputText), [inputText]);

  const outputs: FormatOutput[] = useMemo(() => {
    if (!inputText) {
      return [
        { label: 'Hex', key: 'hex', value: '' },
        { label: 'Decimal', key: 'decimal', value: '' },
        { label: 'Binary', key: 'binary', value: '' },
        { label: 'Octal', key: 'octal', value: '' },
        { label: 'Unicode Code Points', key: 'unicode', value: '' },
        { label: 'Base64', key: 'base64', value: '' },
      ];
    }
    return [
      { label: 'Hex', key: 'hex', value: bytesToHex(bytes) },
      { label: 'Decimal', key: 'decimal', value: bytesToDecimal(bytes) },
      { label: 'Binary', key: 'binary', value: bytesToBinary(bytes) },
      { label: 'Octal', key: 'octal', value: bytesToOctal(bytes) },
      {
        label: 'Unicode Code Points',
        key: 'unicode',
        value: textToUnicodeCodePoints(inputText),
      },
      { label: 'Base64', key: 'base64', value: bytesToBase64(bytes) },
    ];
  }, [inputText, bytes]);

  const reverseResult = useMemo(() => {
    if (!reverseInput.trim()) return { text: '', error: '' };
    try {
      return { text: REVERSE_DECODERS[reverseFormat](reverseInput), error: '' };
    } catch (e) {
      return {
        text: '',
        error: e instanceof Error ? e.message : 'Conversion error',
      };
    }
  }, [reverseInput, reverseFormat]);

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
              <TextNumberFormat24Regular />
              <Text weight="semibold" size={400}>
                Hex / ASCII / Unicode Converter
              </Text>
            </div>
          }
          description="View text in all numeric representations, or decode numeric formats back to text"
        />

        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as string)}
          style={{ marginTop: tokens.spacingVerticalM }}
        >
          <Tab value="text-to-codes">Text → Codes</Tab>
          <Tab value="codes-to-text">Codes → Text</Tab>
        </TabList>
      </Card>

      {activeTab === 'text-to-codes' && (
        <>
          <Card>
            <Label htmlFor="text-input" weight="semibold">
              Input Text
            </Label>
            <Textarea
              id="text-input"
              value={inputText}
              onChange={(_, data) => setInputText(data.value)}
              placeholder="Type or paste text to convert..."
              resize="vertical"
              style={{ minHeight: '80px', marginTop: tokens.spacingVerticalXS }}
            />
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
                  <Textarea
                    readOnly
                    value={out.value}
                    resize="vertical"
                    style={{ minHeight: '60px', fontFamily: 'monospace' }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'codes-to-text' && (
        <Card>
          <div className={styles.reverseSection}>
            <div className={styles.reverseGrid}>
              <div className={styles.reversePanel}>
                <Label weight="semibold">Input Format</Label>
                <TabList
                  selectedValue={reverseFormat}
                  onTabSelect={(_, data) => setReverseFormat(data.value as ReverseFormat)}
                  size="small"
                >
                  {REVERSE_FORMATS.map((fmt) => (
                    <Tab key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </Tab>
                  ))}
                </TabList>
                <Textarea
                  value={reverseInput}
                  onChange={(_, data) => setReverseInput(data.value)}
                  placeholder={getPlaceholder(reverseFormat)}
                  resize="vertical"
                  style={{
                    minHeight: '120px',
                    fontFamily: 'monospace',
                    marginTop: tokens.spacingVerticalXS,
                  }}
                />
              </div>

              <div className={styles.reversePanel}>
                <div className={styles.outputHeader}>
                  <Label weight="semibold">Decoded Text</Label>
                  <Button
                    size="small"
                    icon={<Copy24Regular />}
                    appearance="subtle"
                    disabled={!reverseResult.text}
                    onClick={() => handleCopy('reverse-text', reverseResult.text)}
                  >
                    {copiedKey === 'reverse-text' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                {reverseResult.error ? (
                  <Text className={styles.errorText}>{reverseResult.error}</Text>
                ) : null}
                <Textarea
                  readOnly
                  value={reverseResult.text}
                  resize="vertical"
                  style={{
                    minHeight: '120px',
                    fontFamily: 'monospace',
                    marginTop: tokens.spacingVerticalXS,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function getPlaceholder(format: ReverseFormat): string {
  switch (format) {
    case 'hex':
      return '48 65 6c 6c 6f';
    case 'decimal':
      return '72 101 108 108 111';
    case 'binary':
      return '01001000 01100101 01101100 01101100 01101111';
    case 'octal':
      return '110 145 154 154 157';
    case 'unicode':
      return 'U+0048 U+0065 U+006C U+006C U+006F';
    case 'base64':
      return 'SGVsbG8=';
  }
}
