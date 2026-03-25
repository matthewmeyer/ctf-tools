import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Button,
  Dropdown,
  Option,
  Label,
} from '@fluentui/react-components';
import { LockClosed24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { caesarShift } from '../utils/crypto';
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
  rotationList: {
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  rotationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  bestRow: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  rotLabel: {
    fontWeight: 'bold',
    minWidth: '60px',
    fontFamily: 'monospace',
  },
  rotText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rotScore: {
    minWidth: '80px',
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  fullTextBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflowY: 'auto',
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

const STRATEGY_OPTIONS: Array<{ key: ScoringStrategy; label: string }> = [
  { key: 'chi-squared', label: 'Chi-Squared (Letter Frequency)' },
  { key: 'bigram', label: 'Bigram Fitness' },
  { key: 'word-recognition', label: 'Word Recognition' },
  { key: 'combined', label: 'Combined (Recommended)' },
];

interface ScoredRotation {
  shift: number;
  text: string;
  chi2: number;
  bigram: number;
  wordRec: number;
  combined: number;
  primaryScore: number;
}

export function CaesarCipher() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<ScoringStrategy>('combined');

  const alphabetInfo = useMemo(() => {
    if (!input.trim()) return null;
    return analyzeAlphabet(input);
  }, [input]);

  const rotations = useMemo<ScoredRotation[]>(() => {
    if (!input.trim()) return [];
    var results: ScoredRotation[] = [];
    for (var shift = 0; shift < 26; shift++) {
      var text = caesarShift(input, shift);
      var sr = scoreCandidate(text, strategy, 'ROT-' + shift);
      results.push({
        shift: shift,
        text: text,
        chi2: sr.scores['chi-squared'],
        bigram: sr.scores['bigram'],
        wordRec: sr.scores['word-recognition'],
        combined: sr.scores['combined'],
        primaryScore: sr.primaryScore,
      });
    }
    results.sort(function (a, b) {
      return a.primaryScore - b.primaryScore;
    });
    return results;
  }, [input, strategy]);

  const bestShift = rotations.length > 0 ? rotations[0].shift : null;
  const selectedText = rotations.find((r) => r.shift === selectedShift)?.text;

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <LockClosed24Regular />
              <Text weight="semibold" size={400}>
                Caesar Cipher
              </Text>
            </div>
          }
          description="Brute-force all 26 rotations, ranked by selected scoring strategy"
        />

        <Textarea
          placeholder="Enter ciphertext..."
          value={input}
          onChange={(_, data) => setInput(data.value)}
          resize="vertical"
          style={{ marginTop: tokens.spacingVerticalM }}
        />

        <div className={styles.strategyRow} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.strategyField}>
            <Label>Scoring Strategy</Label>
            <Dropdown
              value={
                STRATEGY_OPTIONS.filter(function (o) {
                  return o.key === strategy;
                })[0].label
              }
              selectedOptions={[strategy]}
              onOptionSelect={function (_, data) {
                if (data.optionValue) setStrategy(data.optionValue as ScoringStrategy);
              }}
            >
              {STRATEGY_OPTIONS.map(function (opt) {
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
          <div className={styles.alertBanner} style={{ marginTop: tokens.spacingVerticalM }}>
            ⚠ Distribution appears flatter than normal English (flatness:{' '}
            {alphabetInfo.flatness.toFixed(2)}). Synonym substitution or homophonic cipher may be in
            use. Try Bigram or Combined scoring.
          </div>
        )}

        {rotations.length > 0 && (
          <>
            {selectedShift !== null && selectedText && (
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text weight="semibold" size={300}>
                    ROT-{selectedShift} Full Text:
                  </Text>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    size="small"
                    onClick={() => setSelectedShift(null)}
                  />
                </div>
                <div className={styles.fullTextBox}>{selectedText}</div>
              </div>
            )}

            <div className={styles.scoreHeaderRow}>
              <Text style={{ fontWeight: 'bold', minWidth: '60px' }}>Shift</Text>
              <Text style={{ flex: 1 }}>Text</Text>
              <Text style={{ minWidth: '70px', textAlign: 'right' }}>χ²</Text>
              <Text style={{ minWidth: '70px', textAlign: 'right' }}>Bigram</Text>
              <Text style={{ minWidth: '70px', textAlign: 'right' }}>Word%</Text>
              <Text style={{ minWidth: '70px', textAlign: 'right' }}>Combined</Text>
            </div>
            <div className={styles.rotationList} style={{ marginTop: tokens.spacingVerticalXS }}>
              {rotations.map((r) => (
                <div
                  key={r.shift}
                  className={`${styles.rotationRow} ${r.shift === bestShift ? styles.bestRow : ''}`}
                  onClick={() => setSelectedShift(r.shift)}
                >
                  <Text className={styles.rotLabel}>ROT-{r.shift}</Text>
                  <Text className={styles.rotText}>{r.text.slice(0, 80)}</Text>
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
                  <Text
                    className={strategy === 'combined' ? styles.scoreColActive : styles.scoreCol}
                  >
                    {r.combined.toFixed(1)}
                  </Text>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
