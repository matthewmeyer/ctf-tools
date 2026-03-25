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
  TabList,
  Tab,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { LockClosed24Regular, LockOpen24Regular, Search24Regular } from '@fluentui/react-icons';
import {
  vigenereEncrypt,
  vigenereDecrypt,
  kasiskiExamination,
  indexOfCoincidence,
  chiSquaredScore,
  caesarShift,
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
  kasiskiTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  tableHeader: {
    textAlign: 'left',
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontWeight: 'bold',
  },
  tableCell: {
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bestRow: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  crackResult: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  alertBox: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  alertWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  alertNormal: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  strategyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
});

function crackVigenereKey(ciphertext: string, keyLen: number): string {
  const upper = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const keyChars: string[] = [];

  for (let col = 0; col < keyLen; col++) {
    let column = '';
    for (let i = col; i < upper.length; i += keyLen) {
      column += upper[i];
    }
    // Try all 26 shifts, pick lowest chi-squared
    let bestShift = 0;
    let bestScore = Infinity;
    for (let s = 0; s < 26; s++) {
      const shifted = caesarShift(column, -s);
      const score = chiSquaredScore(shifted);
      if (score < bestScore) {
        bestScore = score;
        bestShift = s;
      }
    }
    keyChars.push(String.fromCharCode(65 + bestShift));
  }
  return keyChars.join('');
}

export function VigenereCipher() {
  const styles = useStyles();
  const [tab, setTab] = useState<string>('encdec');

  // Encrypt/Decrypt state
  const [edInput, setEdInput] = useState('');
  const [edKey, setEdKey] = useState('');
  const [edOutput, setEdOutput] = useState('');

  // Crack state
  const [crackInput, setCrackInput] = useState('');
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategy>('combined');
  const [crackResults, setCrackResults] = useState<
    {
      keyLen: number;
      ioc: number;
      kasiskiCount: number;
      key: string;
      preview: string;
      strategyScore: number;
    }[]
  >([]);

  // Distribution analysis
  const crackAlphabetAnalysis = useMemo(() => {
    if (!crackInput.trim()) return null;
    return analyzeAlphabet(crackInput);
  }, [crackInput]);

  const handleEncrypt = () => setEdOutput(vigenereEncrypt(edInput, edKey));
  const handleDecrypt = () => setEdOutput(vigenereDecrypt(edInput, edKey));

  const handleCrack = () => {
    if (!crackInput.trim()) return;
    const kasiski = kasiskiExamination(crackInput);
    const upper = crackInput.toUpperCase().replace(/[^A-Z]/g, '');
    const results: typeof crackResults = [];

    for (let keyLen = 1; keyLen <= 20; keyLen++) {
      // Average IoC across columns
      let iocSum = 0;
      for (let col = 0; col < keyLen; col++) {
        let column = '';
        for (let i = col; i < upper.length; i += keyLen) column += upper[i];
        iocSum += indexOfCoincidence(column);
      }
      const avgIoc = iocSum / keyLen;
      const kasiskiCount = kasiski.get(keyLen) || 0;
      const key = crackVigenereKey(crackInput, keyLen);
      const decrypted = vigenereDecrypt(crackInput, key);

      const scored = scoreCandidate(decrypted, scoringStrategy, 'key=' + key);

      results.push({
        keyLen,
        ioc: avgIoc,
        kasiskiCount,
        key,
        preview: decrypted.slice(0, 80),
        strategyScore: scored.primaryScore,
      });
    }

    // Sort: combine Kasiski signal with strategy score
    // Normalize Kasiski count (higher = better) and strategy score (lower = better)
    const maxKasiski = Math.max.apply(
      null,
      results
        .map(function (r) {
          return r.kasiskiCount;
        })
        .concat([1]),
    );
    results.sort(function (a, b) {
      // Kasiski rank: higher count = lower rank value (better)
      var aKasiskiNorm = 1 - a.kasiskiCount / maxKasiski;
      var bKasiskiNorm = 1 - b.kasiskiCount / maxKasiski;
      // Strategy score: already lower = better
      // Combined: weight both signals
      var aCombo = aKasiskiNorm * 0.4 + a.strategyScore * 0.6;
      var bCombo = bKasiskiNorm * 0.4 + b.strategyScore * 0.6;
      return aCombo - bCombo;
    });

    setCrackResults(results);
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <LockClosed24Regular />
              <Text weight="semibold" size={400}>
                Vigenère Cipher
              </Text>
            </div>
          }
          description="Encrypt, decrypt, and crack Vigenère ciphers"
        />

        <TabList
          selectedValue={tab}
          onTabSelect={(_, data) => setTab(data.value as string)}
          style={{ marginTop: tokens.spacingVerticalM }}
        >
          <Tab value="encdec">Encrypt / Decrypt</Tab>
          <Tab value="crack">Crack</Tab>
        </TabList>

        {tab === 'encdec' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacingVerticalM,
              marginTop: tokens.spacingVerticalM,
            }}
          >
            <Textarea
              placeholder="Enter text..."
              value={edInput}
              onChange={(_, data) => setEdInput(data.value)}
              resize="vertical"
            />
            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Key</Label>
                <Input
                  value={edKey}
                  onChange={(_, data) => setEdKey(data.value)}
                  placeholder="SECRET"
                />
              </div>
              <Button appearance="primary" icon={<LockClosed24Regular />} onClick={handleEncrypt}>
                Encrypt
              </Button>
              <Button appearance="primary" icon={<LockOpen24Regular />} onClick={handleDecrypt}>
                Decrypt
              </Button>
            </div>
            {edOutput && (
              <div className={styles.field}>
                <Label>Output</Label>
                <div className={styles.outputBox}>{edOutput}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'crack' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacingVerticalM,
              marginTop: tokens.spacingVerticalM,
            }}
          >
            <Textarea
              placeholder="Enter ciphertext to crack..."
              value={crackInput}
              onChange={(_, data) => setCrackInput(data.value)}
              resize="vertical"
            />

            {/* Distribution Alert */}
            {crackAlphabetAnalysis && (
              <div
                className={`${styles.alertBox} ${crackAlphabetAnalysis.possibleHomophonic ? styles.alertWarning : styles.alertNormal}`}
              >
                <Text size={200} weight="semibold">
                  Distribution: {crackAlphabetAnalysis.expectedFlatness}
                </Text>
                <Text size={200}>
                  (flatness: {crackAlphabetAnalysis.flatness.toFixed(2)},{' '}
                  {crackAlphabetAnalysis.alphaChars} alpha chars,{' '}
                  {crackAlphabetAnalysis.nonAlphaSymbols} symbols)
                </Text>
              </div>
            )}

            <div className={styles.strategyRow}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS }}
              >
                <Label>Scoring Strategy</Label>
                <Dropdown
                  value={
                    scoringStrategy === 'chi-squared'
                      ? 'Chi-Squared'
                      : scoringStrategy === 'bigram'
                        ? 'Bigram'
                        : scoringStrategy === 'word-recognition'
                          ? 'Word Recognition'
                          : 'Combined'
                  }
                  onOptionSelect={function (_, data) {
                    var val = data.optionValue as ScoringStrategy;
                    setScoringStrategy(val);
                  }}
                >
                  <Option value="chi-squared">Chi-Squared</Option>
                  <Option value="bigram">Bigram</Option>
                  <Option value="word-recognition">Word Recognition</Option>
                  <Option value="combined">Combined</Option>
                </Dropdown>
              </div>
              <Button
                appearance="primary"
                icon={<Search24Regular />}
                onClick={handleCrack}
                style={{ alignSelf: 'flex-end' }}
              >
                Run Kasiski + Frequency Analysis
              </Button>
            </div>

            {crackResults.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.kasiskiTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Key Len</th>
                      <th className={styles.tableHeader}>Kasiski</th>
                      <th className={styles.tableHeader}>Avg IoC</th>
                      <th className={styles.tableHeader}>
                        {scoringStrategy === 'chi-squared'
                          ? 'χ² Score'
                          : scoringStrategy === 'bigram'
                            ? 'Bigram'
                            : scoringStrategy === 'word-recognition'
                              ? 'Word Rec.'
                              : 'Combined'}
                      </th>
                      <th className={styles.tableHeader}>Key</th>
                      <th className={styles.tableHeader}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crackResults.map((r, i) => (
                      <tr key={r.keyLen} className={i === 0 ? styles.bestRow : ''}>
                        <td className={styles.tableCell}>{r.keyLen}</td>
                        <td className={styles.tableCell}>{r.kasiskiCount}</td>
                        <td className={styles.tableCell}>{r.ioc.toFixed(4)}</td>
                        <td className={styles.tableCell}>{r.strategyScore.toFixed(2)}</td>
                        <td className={styles.tableCell}>{r.key}</td>
                        <td className={styles.tableCell}>{r.preview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
