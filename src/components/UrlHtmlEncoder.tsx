import { useState, useCallback, useRef } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Dropdown,
  Option,
  Label,
} from '@fluentui/react-components';
import { Code24Regular } from '@fluentui/react-icons';

// --- HTML entity maps ---
const HTML_ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_NAMED_DECODE_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  copy: '\u00A9',
  reg: '\u00AE',
  trade: '\u2122',
  mdash: '\u2014',
  ndash: '\u2013',
  laquo: '\u00AB',
  raquo: '\u00BB',
  bull: '\u2022',
  hellip: '\u2026',
  euro: '\u20AC',
  pound: '\u00A3',
  yen: '\u00A5',
  cent: '\u00A2',
};

function htmlEncode(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ENCODE_MAP[ch] || ch);
}

function htmlDecode(encoded: string): string {
  return encoded.replace(/&(#x([0-9a-fA-F]+)|#(\d+)|(\w+));/g, (match, _, hex, dec, named) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    if (named && HTML_NAMED_DECODE_MAP[named.toLowerCase()]) {
      return HTML_NAMED_DECODE_MAP[named.toLowerCase()];
    }
    return match;
  });
}

type EncodingMode = 'url' | 'html';

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
  modeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export function UrlHtmlEncoder() {
  const styles = useStyles();
  const [mode, setMode] = useState<EncodingMode>('url');
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  // Track which side the user last edited to avoid circular updates
  const editingRef = useRef<'decoded' | 'encoded' | null>(null);

  const encode = useCallback(
    (text: string): string => {
      if (mode === 'url') return encodeURIComponent(text);
      return htmlEncode(text);
    },
    [mode],
  );

  const decode = useCallback(
    (text: string): string => {
      if (mode === 'url') {
        try {
          return decodeURIComponent(text);
        } catch {
          return text;
        }
      }
      return htmlDecode(text);
    },
    [mode],
  );

  const handleDecodedChange = useCallback(
    (_: unknown, data: { value: string }) => {
      editingRef.current = 'decoded';
      setDecoded(data.value);
      setEncoded(encode(data.value));
    },
    [encode],
  );

  const handleEncodedChange = useCallback(
    (_: unknown, data: { value: string }) => {
      editingRef.current = 'encoded';
      setEncoded(data.value);
      setDecoded(decode(data.value));
    },
    [decode],
  );

  const handleModeChange = useCallback(
    (_: unknown, data: { optionValue?: string }) => {
      if (!data.optionValue) return;
      const newMode = data.optionValue as EncodingMode;
      setMode(newMode);

      // Re-encode from decoded side using the new mode
      const encodeFn = newMode === 'url' ? encodeURIComponent : htmlEncode;
      setEncoded(encodeFn(decoded));
    },
    [decoded],
  );

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <Code24Regular />
              <Text weight="semibold" size={400}>
                URL &amp; HTML Encoder / Decoder
              </Text>
            </div>
          }
          description="Encode and decode URL percent-encoding or HTML entities in real-time"
        />

        <div className={styles.modeRow} style={{ marginTop: tokens.spacingVerticalM }}>
          <Label htmlFor="encoding-mode">Mode:</Label>
          <Dropdown
            id="encoding-mode"
            value={mode === 'url' ? 'URL Encoding' : 'HTML Entities'}
            selectedOptions={[mode]}
            onOptionSelect={handleModeChange}
            style={{ minWidth: '180px' }}
          >
            <Option value="url" text="URL Encoding">
              URL Encoding
            </Option>
            <Option value="html" text="HTML Entities">
              HTML Entities
            </Option>
          </Dropdown>
        </div>

        <div className={styles.panels} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Label weight="semibold">Decoded (Plain Text)</Label>
              <Text className={styles.charCount}>{decoded.length} chars</Text>
            </div>
            <Textarea
              value={decoded}
              onChange={handleDecodedChange}
              placeholder="Type or paste plain text here..."
              resize="vertical"
              style={{ minHeight: '200px', fontFamily: 'monospace' }}
            />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Label weight="semibold">Encoded</Label>
              <Text className={styles.charCount}>{encoded.length} chars</Text>
            </div>
            <Textarea
              value={encoded}
              onChange={handleEncodedChange}
              placeholder="Type or paste encoded text here..."
              resize="vertical"
              style={{ minHeight: '200px', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
