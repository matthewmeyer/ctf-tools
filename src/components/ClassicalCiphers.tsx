import { useState, useMemo } from 'react';
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
  Slider,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { LockClosed24Regular, LockOpen24Regular, Search24Regular } from '@fluentui/react-icons';
import {
  atbash,
  affineEncrypt,
  affineDecrypt,
  AFFINE_VALID_A,
  playfairEncrypt,
  playfairDecrypt,
  generatePlayfairGrid,
} from '../utils/crypto';
import { ScoringStrategy, scoreCandidate, analyzeAlphabet } from '../utils/wordPatterns';

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
  playfairGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 40px)',
    gap: tokens.spacingHorizontalXS,
  },
  gridCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: tokens.fontSizeBase400,
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
  bruteLabel: {
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
    minWidth: '80px',
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  strategyRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap' as const,
  },
  strategyField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingVerticalXS,
    minWidth: '260px',
  },
  alertBanner: {
    padding: tokens.spacingVerticalS + ' ' + tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: '#fff3cd',
    color: '#664d03',
    border: '1px solid #ffecb5',
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.5',
  },
  scoreHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalXS + ' ' + tokens.spacingVerticalS,
    fontWeight: 'bold' as const,
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'monospace',
  },
  scoreCol: {
    minWidth: '70px',
    textAlign: 'right' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  scoreColActive: {
    minWidth: '70px',
    textAlign: 'right' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    fontWeight: 'bold' as const,
  },
});

// ── Atbash Tab ──
function AtbashTab() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const output = useMemo(() => (input ? atbash(input) : ''), [input]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
      }}
    >
      <Textarea
        placeholder="Enter text..."
        value={input}
        onChange={(_, data) => setInput(data.value)}
        resize="vertical"
      />
      {output && (
        <div className={styles.field}>
          <Label>Output</Label>
          <div className={styles.outputBox}>{output}</div>
        </div>
      )}
    </div>
  );
}

// ── Affine Tab ──
const AFFINE_STRATEGY_OPTIONS: Array<{ key: ScoringStrategy; label: string }> = [
  { key: 'chi-squared', label: 'Chi-Squared (Letter Frequency)' },
  { key: 'bigram', label: 'Bigram Fitness' },
  { key: 'word-recognition', label: 'Word Recognition' },
  { key: 'combined', label: 'Combined (Recommended)' },
];

interface AffineBruteResult {
  a: number;
  b: number;
  text: string;
  score: number;
  chi2: number;
  bigram: number;
  wordRec: number;
  combined: number;
}

function AffineTab() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [a, setA] = useState(AFFINE_VALID_A[0]);
  const [b, setB] = useState(0);
  const [output, setOutput] = useState('');
  const [bruteResults, setBruteResults] = useState<AffineBruteResult[]>([]);
  const [strategy, setStrategy] = useState<ScoringStrategy>('combined');

  const alphabetInfo = useMemo(() => {
    if (!input.trim()) return null;
    return analyzeAlphabet(input);
  }, [input]);

  const handleEncrypt = () => setOutput(affineEncrypt(input, a, b));
  const handleDecrypt = () => {
    const result = affineDecrypt(input, a, b);
    setOutput(result ?? 'Error: invalid a value');
  };

  const handleBruteForce = () => {
    if (!input.trim()) return;
    var results: AffineBruteResult[] = [];
    for (var ai = 0; ai < AFFINE_VALID_A.length; ai++) {
      var av = AFFINE_VALID_A[ai];
      for (var bv = 0; bv < 26; bv++) {
        var text = affineDecrypt(input, av, bv);
        if (text) {
          var sr = scoreCandidate(text, strategy, 'a=' + av + ' b=' + bv);
          results.push({
            a: av,
            b: bv,
            text: text,
            score: sr.primaryScore,
            chi2: sr.scores['chi-squared'],
            bigram: sr.scores['bigram'],
            wordRec: sr.scores['word-recognition'],
            combined: sr.scores['combined'],
          });
        }
      }
    }
    results.sort(function (x, y) {
      return x.score - y.score;
    });
    setBruteResults(results);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
      }}
    >
      <Textarea
        placeholder="Enter text..."
        value={input}
        onChange={(_, data) => setInput(data.value)}
        resize="vertical"
      />

      <div className={styles.strategyRow}>
        <div className={styles.strategyField}>
          <Label>Scoring Strategy</Label>
          <Dropdown
            value={
              AFFINE_STRATEGY_OPTIONS.filter(function (o) {
                return o.key === strategy;
              })[0].label
            }
            selectedOptions={[strategy]}
            onOptionSelect={function (_, data) {
              if (data.optionValue) setStrategy(data.optionValue as ScoringStrategy);
            }}
          >
            {AFFINE_STRATEGY_OPTIONS.map(function (opt) {
              return (
                <Option key={opt.key} value={opt.key} text={opt.label}>
                  {opt.label}
                </Option>
              );
            })}
          </Dropdown>
        </div>
      </div>

      {alphabetInfo && alphabetInfo.flatness < 1.5 && input.trim().length > 50 && (
        <div className={styles.alertBanner}>
          ⚠ Distribution appears flatter than normal English (flatness:{' '}
          {alphabetInfo.flatness.toFixed(2)}). Synonym substitution or homophonic cipher may be in
          use. Try Bigram or Combined scoring.
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <Label>a (multiplier)</Label>
          <Dropdown
            value={a.toString()}
            selectedOptions={[a.toString()]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) setA(Number(data.optionValue));
            }}
            style={{ minWidth: '80px' }}
          >
            {AFFINE_VALID_A.map((v) => (
              <Option key={v} value={v.toString()} text={v.toString()}>
                {v}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field} style={{ minWidth: '180px' }}>
          <Label>b (shift): {b}</Label>
          <Slider min={0} max={25} value={b} onChange={(_, data) => setB(data.value)} />
        </div>

        <Button appearance="primary" icon={<LockClosed24Regular />} onClick={handleEncrypt}>
          Encrypt
        </Button>
        <Button appearance="primary" icon={<LockOpen24Regular />} onClick={handleDecrypt}>
          Decrypt
        </Button>
        <Button appearance="secondary" icon={<Search24Regular />} onClick={handleBruteForce}>
          Brute Force
        </Button>
      </div>

      {output && (
        <div className={styles.field}>
          <Label>Output</Label>
          <div className={styles.outputBox}>{output}</div>
        </div>
      )}

      {bruteResults.length > 0 && (
        <div>
          <Label>
            Brute Force Results ({bruteResults.length} combinations, sorted by{' '}
            {
              AFFINE_STRATEGY_OPTIONS.filter(function (o) {
                return o.key === strategy;
              })[0].label
            }
            )
          </Label>
          <div className={styles.scoreHeaderRow}>
            <Text style={{ fontWeight: 'bold', minWidth: '80px' }}>Params</Text>
            <Text style={{ flex: 1 }}>Text</Text>
            <Text style={{ minWidth: '70px', textAlign: 'right' }}>χ²</Text>
            <Text style={{ minWidth: '70px', textAlign: 'right' }}>Bigram</Text>
            <Text style={{ minWidth: '70px', textAlign: 'right' }}>Word%</Text>
            <Text style={{ minWidth: '70px', textAlign: 'right' }}>Combined</Text>
          </div>
          <div className={styles.bruteList}>
            {bruteResults.slice(0, 30).map((r, i) => (
              <div
                key={`${r.a}-${r.b}`}
                className={`${styles.bruteRow} ${i === 0 ? styles.bestRow : ''}`}
              >
                <Text className={styles.bruteLabel}>
                  a={r.a} b={r.b}
                </Text>
                <Text className={styles.bruteText}>{r.text.slice(0, 80)}</Text>
                <Text
                  className={strategy === 'chi-squared' ? styles.scoreColActive : styles.scoreCol}
                >
                  {r.chi2.toFixed(1)}
                </Text>
                <Text className={strategy === 'bigram' ? styles.scoreColActive : styles.scoreCol}>
                  {r.bigram.toFixed(2)}
                </Text>
                <Text
                  className={
                    strategy === 'word-recognition' ? styles.scoreColActive : styles.scoreCol
                  }
                >
                  {((1 - r.wordRec) * 100).toFixed(0)}%
                </Text>
                <Text className={strategy === 'combined' ? styles.scoreColActive : styles.scoreCol}>
                  {r.combined.toFixed(1)}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Playfair Tab ──
function PlayfairTab() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');

  const grid = useMemo(() => generatePlayfairGrid(key), [key]);

  const handleEncrypt = () => setOutput(playfairEncrypt(input, key));
  const handleDecrypt = () => setOutput(playfairDecrypt(input, key));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
      }}
    >
      <Textarea
        placeholder="Enter text..."
        value={input}
        onChange={(_, data) => setInput(data.value)}
        resize="vertical"
      />

      <div className={styles.row}>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label>Key</Label>
          <Input value={key} onChange={(_, data) => setKey(data.value)} placeholder="KEYWORD" />
        </div>
        <Button appearance="primary" icon={<LockClosed24Regular />} onClick={handleEncrypt}>
          Encrypt
        </Button>
        <Button appearance="primary" icon={<LockOpen24Regular />} onClick={handleDecrypt}>
          Decrypt
        </Button>
      </div>

      <div className={styles.field}>
        <Label>5×5 Grid (J → I)</Label>
        <div className={styles.playfairGrid}>
          {grid.map((ch, i) => (
            <div key={i} className={styles.gridCell}>
              {ch}
            </div>
          ))}
        </div>
      </div>

      {output && (
        <div className={styles.field}>
          <Label>Output</Label>
          <div className={styles.outputBox}>{output}</div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export function ClassicalCiphers() {
  const styles = useStyles();
  const [tab, setTab] = useState<string>('atbash');

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <LockClosed24Regular />
              <Text weight="semibold" size={400}>
                Classical Ciphers
              </Text>
            </div>
          }
          description="Atbash, Affine, and Playfair ciphers"
        />

        <TabList
          selectedValue={tab}
          onTabSelect={(_, data) => setTab(data.value as string)}
          style={{ marginTop: tokens.spacingVerticalM }}
        >
          <Tab value="atbash">Atbash</Tab>
          <Tab value="affine">Affine</Tab>
          <Tab value="playfair">Playfair</Tab>
        </TabList>

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          {tab === 'atbash' && <AtbashTab />}
          {tab === 'affine' && <AffineTab />}
          {tab === 'playfair' && <PlayfairTab />}
        </div>
      </Card>
    </div>
  );
}
