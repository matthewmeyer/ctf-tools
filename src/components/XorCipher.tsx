import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Input,
  Button,
  Label,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { LockClosed24Regular, Search24Regular } from '@fluentui/react-icons';
import {
  xorBytes,
  printableScore,
  hexToBytes,
  bytesToHex,
  stringToBytes,
  bytesToString,
  chiSquaredScore,
} from '../utils/crypto';

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
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  outputBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflowY: 'auto',
    minHeight: '40px',
  },
  bruteList: {
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  bruteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  bestRow: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  keyLabel: {
    fontWeight: 'bold',
    minWidth: '80px',
    fontFamily: 'monospace',
  },
  bruteText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bruteScore: {
    minWidth: '60px',
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

type Format = 'text' | 'hex';

interface BruteResult {
  key: number;
  text: string;
  pScore: number;
  chi2: number;
}

export function XorCipher() {
  const styles = useStyles();
  const [inputFormat, setInputFormat] = useState<Format>('text');
  const [input, setInput] = useState('');
  const [keyFormat, setKeyFormat] = useState<Format>('text');
  const [key, setKey] = useState('');
  const [outputHex, setOutputHex] = useState('');
  const [outputText, setOutputText] = useState('');
  const [bruteResults, setBruteResults] = useState<BruteResult[]>([]);

  const handleXor = () => {
    const dataBytes = inputFormat === 'hex' ? hexToBytes(input) : stringToBytes(input);
    const keyBytes = keyFormat === 'hex' ? hexToBytes(key) : stringToBytes(key);
    if (keyBytes.length === 0) return;
    const result = xorBytes(dataBytes, keyBytes);
    setOutputHex(bytesToHex(result));
    setOutputText(bytesToString(result));
  };

  const handleBruteForce = () => {
    const dataBytes = inputFormat === 'hex' ? hexToBytes(input) : stringToBytes(input);
    if (dataBytes.length === 0) return;

    const results: BruteResult[] = [];
    for (let k = 0; k < 256; k++) {
      const keyByte = new Uint8Array([k]);
      const result = xorBytes(dataBytes, keyByte);
      const pScore = printableScore(result);
      const text = bytesToString(result);
      const chi2 = chiSquaredScore(text);
      results.push({ key: k, text, pScore, chi2 });
    }

    // Sort by printable score descending, then chi-squared ascending
    results.sort((a, b) => {
      if (b.pScore !== a.pScore) return b.pScore - a.pScore;
      return a.chi2 - b.chi2;
    });

    setBruteResults(results.slice(0, 20));
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <LockClosed24Regular />
              <Text weight="semibold" size={400}>
                XOR Cipher
              </Text>
            </div>
          }
          description="XOR data with a key, or brute-force single-byte XOR"
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacingVerticalM,
            marginTop: tokens.spacingVerticalM,
          }}
        >
          <div className={styles.row}>
            <div className={styles.field}>
              <Label>Input Format</Label>
              <Dropdown
                value={inputFormat === 'hex' ? 'Hex' : 'Text'}
                selectedOptions={[inputFormat]}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) setInputFormat(data.optionValue as Format);
                }}
                style={{ minWidth: '100px' }}
              >
                <Option value="text" text="Text">
                  Text
                </Option>
                <Option value="hex" text="Hex">
                  Hex
                </Option>
              </Dropdown>
            </div>
            <div className={styles.field}>
              <Label>Key Format</Label>
              <Dropdown
                value={keyFormat === 'hex' ? 'Hex' : 'Text'}
                selectedOptions={[keyFormat]}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) setKeyFormat(data.optionValue as Format);
                }}
                style={{ minWidth: '100px' }}
              >
                <Option value="text" text="Text">
                  Text
                </Option>
                <Option value="hex" text="Hex">
                  Hex
                </Option>
              </Dropdown>
            </div>
          </div>

          <Textarea
            placeholder={
              inputFormat === 'hex' ? 'Enter hex (e.g., 48 65 6c 6c 6f)...' : 'Enter text...'
            }
            value={input}
            onChange={(_, data) => setInput(data.value)}
            resize="vertical"
          />

          <div className={styles.row}>
            <div className={styles.field} style={{ flex: 1 }}>
              <Label>Key</Label>
              <Input
                value={key}
                onChange={(_, data) => setKey(data.value)}
                placeholder={keyFormat === 'hex' ? 'Hex key (e.g., ff)' : 'Text key'}
              />
            </div>
            <Button appearance="primary" icon={<LockClosed24Regular />} onClick={handleXor}>
              XOR
            </Button>
            <Button appearance="secondary" icon={<Search24Regular />} onClick={handleBruteForce}>
              Brute Force Single Byte
            </Button>
          </div>

          {(outputHex || outputText) && (
            <>
              <div className={styles.field}>
                <Label>Output (Hex)</Label>
                <div className={styles.outputBox}>{outputHex}</div>
              </div>
              <div className={styles.field}>
                <Label>Output (Text)</Label>
                <div className={styles.outputBox}>{outputText}</div>
              </div>
            </>
          )}

          {bruteResults.length > 0 && (
            <div>
              <Label>Top 20 Single-Byte Keys (by printable score)</Label>
              <div className={styles.bruteList}>
                {bruteResults.map((r, i) => (
                  <div
                    key={r.key}
                    className={`${styles.bruteRow} ${i === 0 ? styles.bestRow : ''}`}
                  >
                    <Text className={styles.keyLabel}>0x{r.key.toString(16).padStart(2, '0')}</Text>
                    <Text className={styles.bruteText}>{r.text.slice(0, 80)}</Text>
                    <Text className={styles.bruteScore}>{(r.pScore * 100).toFixed(0)}%</Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
