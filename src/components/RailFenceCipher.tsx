import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Button,
  Label,
  Slider,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { LockClosed24Regular, LockOpen24Regular, Search24Regular } from '@fluentui/react-icons';
import { railFenceEncrypt, railFenceDecrypt, chiSquaredScore } from '../utils/crypto';

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
  controls: {
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
  railLabel: {
    fontWeight: 'bold',
    minWidth: '70px',
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
    minWidth: '80px',
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface BruteResult {
  rails: number;
  text: string;
  score: number;
}

export function RailFenceCipher() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<string>('encrypt');
  const [rails, setRails] = useState(3);
  const [output, setOutput] = useState('');
  const [bruteResults, setBruteResults] = useState<BruteResult[]>([]);

  const handleRun = () => {
    if (!input.trim()) return;
    if (mode === 'encrypt') {
      setOutput(railFenceEncrypt(input, rails));
    } else {
      setOutput(railFenceDecrypt(input, rails));
    }
  };

  const handleBruteForce = () => {
    if (!input.trim()) return;
    const results: BruteResult[] = [];
    for (let r = 2; r <= 20; r++) {
      const text = railFenceDecrypt(input, r);
      results.push({ rails: r, text, score: chiSquaredScore(text) });
    }
    results.sort((a, b) => a.score - b.score);
    setBruteResults(results);
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <LockClosed24Regular />
              <Text weight="semibold" size={400}>
                Rail Fence Cipher
              </Text>
            </div>
          }
          description="Encrypt, decrypt, or brute-force rail fence ciphers"
        />

        <Textarea
          placeholder="Enter text..."
          value={input}
          onChange={(_, data) => setInput(data.value)}
          resize="vertical"
          style={{ marginTop: tokens.spacingVerticalM }}
        />

        <div className={styles.controls} style={{ marginTop: tokens.spacingVerticalM }}>
          <TabList selectedValue={mode} onTabSelect={(_, data) => setMode(data.value as string)}>
            <Tab value="encrypt" icon={<LockClosed24Regular />}>
              Encrypt
            </Tab>
            <Tab value="decrypt" icon={<LockOpen24Regular />}>
              Decrypt
            </Tab>
          </TabList>

          <div className={styles.field} style={{ minWidth: '200px' }}>
            <Label>Rails: {rails}</Label>
            <Slider min={2} max={20} value={rails} onChange={(_, data) => setRails(data.value)} />
          </div>

          <Button appearance="primary" onClick={handleRun}>
            {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </Button>

          <Button appearance="secondary" icon={<Search24Regular />} onClick={handleBruteForce}>
            Brute Force
          </Button>
        </div>

        {output && (
          <div className={styles.field} style={{ marginTop: tokens.spacingVerticalM }}>
            <Label>Output</Label>
            <div className={styles.outputBox}>{output}</div>
          </div>
        )}

        {bruteResults.length > 0 && (
          <div style={{ marginTop: tokens.spacingVerticalM }}>
            <Label>Brute Force Results (sorted by χ² score)</Label>
            <div className={styles.bruteList}>
              {bruteResults.map((r, i) => (
                <div
                  key={r.rails}
                  className={`${styles.bruteRow} ${i === 0 ? styles.bestRow : ''}`}
                >
                  <Text className={styles.railLabel}>Rails {r.rails}</Text>
                  <Text className={styles.bruteText}>{r.text.slice(0, 100)}</Text>
                  <Text className={styles.bruteScore}>χ² {r.score.toFixed(1)}</Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
