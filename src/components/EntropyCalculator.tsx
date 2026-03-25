import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Label,
  Button,
} from '@fluentui/react-components';
import { DataBarVertical24Regular } from '@fluentui/react-icons';
import { shannonEntropy, shannonEntropyBytes, stringToBytes } from '../utils/crypto';

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
  modeToggle: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  bigNumber: {
    fontFamily: 'monospace',
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    padding: tokens.spacingVerticalM,
  },
  bigLabel: {
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
  gaugeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
  gaugeTrack: {
    position: 'relative' as const,
    height: '28px',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'visible',
  },
  gaugeMarker: {
    position: 'absolute' as const,
    top: '-4px',
    width: '4px',
    height: '36px',
    backgroundColor: tokens.colorNeutralForeground1,
    borderRadius: '2px',
    transform: 'translateX(-50%)',
  },
  gaugeLandmark: {
    position: 'absolute' as const,
    top: '-4px',
    width: '2px',
    height: '36px',
    backgroundColor: tokens.colorNeutralForeground3,
    opacity: 0.5,
    transform: 'translateX(-50%)',
  },
  gaugeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  statsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    minWidth: '120px',
  },
});

type InputMode = 'text' | 'hex';

function hexToUint8Array(hex: string): Uint8Array | null {
  const clean = hex.replace(/[\s,]/g, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function EntropyCalculator() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<InputMode>('text');

  const { entropy, totalChars, uniqueChars, maxEntropy, isHexError } = useMemo(() => {
    if (mode === 'hex') {
      const bytes = hexToUint8Array(input);
      if (!bytes || bytes.length === 0) {
        return {
          entropy: 0,
          totalChars: 0,
          uniqueChars: 0,
          maxEntropy: 0,
          isHexError: input.trim().length > 0,
        };
      }
      const e = shannonEntropyBytes(bytes);
      const unique = new Set(bytes).size;
      return {
        entropy: e,
        totalChars: bytes.length,
        uniqueChars: unique,
        maxEntropy: unique > 1 ? Math.log2(unique) : 0,
        isHexError: false,
      };
    }
    // text mode
    if (input.length === 0) {
      return {
        entropy: 0,
        totalChars: 0,
        uniqueChars: 0,
        maxEntropy: 0,
        isHexError: false,
      };
    }
    stringToBytes(input);
    const e = shannonEntropy(input);
    const unique = new Set(input).size;
    return {
      entropy: e,
      totalChars: input.length,
      uniqueChars: unique,
      maxEntropy: unique > 1 ? Math.log2(unique) : 0,
      isHexError: false,
    };
  }, [input, mode]);

  // Gauge: 0..8 bits range
  const maxGauge = 8;
  const gaugePos = Math.min(100, Math.max(0, (entropy / maxGauge) * 100));
  const englishPos = (4.7 / maxGauge) * 100;

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <DataBarVertical24Regular />
              <Text weight="semibold" size={400}>
                Shannon Entropy Calculator
              </Text>
            </div>
          }
          description="Measure information entropy — low = structured/compressible, high = random/encrypted"
        />

        <div className={styles.modeToggle} style={{ marginTop: tokens.spacingVerticalM }}>
          <Button
            appearance={mode === 'text' ? 'primary' : 'secondary'}
            onClick={() => setMode('text')}
            size="small"
          >
            Text
          </Button>
          <Button
            appearance={mode === 'hex' ? 'primary' : 'secondary'}
            onClick={() => setMode('hex')}
            size="small"
          >
            Hex
          </Button>
        </div>

        <div style={{ marginTop: tokens.spacingVerticalS }}>
          <Label htmlFor="entropy-input">
            {mode === 'text' ? 'Text input' : 'Hex input (e.g. 4f 70 65 6e)'}
          </Label>
          <Textarea
            id="entropy-input"
            value={input}
            onChange={(_, d) => setInput(d.value)}
            placeholder={
              mode === 'text' ? 'Paste text here...' : 'Paste hex bytes (e.g. 48656c6c6f)...'
            }
            resize="vertical"
            style={{ width: '100%', minHeight: '80px' }}
          />
          {isHexError && (
            <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
              Invalid hex input
            </Text>
          )}
        </div>

        {/* Big entropy display */}
        <div className={styles.bigNumber}>{entropy.toFixed(4)}</div>
        <div className={styles.bigLabel}>
          <Text size={300}>bits per {mode === 'hex' ? 'byte' : 'character'}</Text>
        </div>

        {/* Visual gauge */}
        <div className={styles.gaugeWrapper} style={{ marginTop: tokens.spacingVerticalM }}>
          <div
            className={styles.gaugeTrack}
            style={{
              background: `linear-gradient(to right, ${tokens.colorPaletteGreenBackground3}, ${tokens.colorPaletteYellowBackground3}, ${tokens.colorPaletteRedBackground3})`,
            }}
          >
            {/* English landmark */}
            <div
              className={styles.gaugeLandmark}
              style={{ left: `${englishPos}%` }}
              title="Typical English (~4.7 bits)"
            />
            {/* Current value marker */}
            <div className={styles.gaugeMarker} style={{ left: `${gaugePos}%` }} />
          </div>
          <div className={styles.gaugeLabels}>
            <span>0 bits (no randomness)</span>
            <span>~4.7 (English)</span>
            <span>8 bits (max)</span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow} style={{ marginTop: tokens.spacingVerticalL }}>
          <div className={styles.statItem}>
            <Text size={200}>Total {mode === 'hex' ? 'Bytes' : 'Characters'}</Text>
            <Text weight="bold" size={400}>
              {totalChars}
            </Text>
          </div>
          <div className={styles.statItem}>
            <Text size={200}>Unique Symbols</Text>
            <Text weight="bold" size={400}>
              {uniqueChars}
            </Text>
          </div>
          <div className={styles.statItem}>
            <Text size={200}>Max Possible Entropy</Text>
            <Text weight="bold" size={400}>
              {maxEntropy.toFixed(4)}
            </Text>
          </div>
          <div className={styles.statItem}>
            <Text size={200}>Efficiency</Text>
            <Text weight="bold" size={400}>
              {maxEntropy > 0 ? `${((entropy / maxEntropy) * 100).toFixed(1)}%` : '—'}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
