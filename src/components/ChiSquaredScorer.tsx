import { useState, useMemo, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Button,
  Label,
} from '@fluentui/react-components';
import { DataBarVertical24Regular, Play24Regular } from '@fluentui/react-icons';
import { chiSquaredScore } from '../utils/crypto';

const CHI_THRESHOLD = 50;

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
  resultTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  rowBase: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
  },
  rowBest: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    cursor: 'pointer',
  },
  cell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    verticalAlign: 'top' as const,
  },
  rankCell: {
    width: '40px',
    color: tokens.colorNeutralForeground3,
  },
  scoreCell: {
    width: '90px',
    fontWeight: 'bold',
  },
  expandedText: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  thresholdNote: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  thresholdDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  preview: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '600px',
  },
});

interface ScoredLine {
  index: number;
  text: string;
  score: number;
}

export function ChiSquaredScorer() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ScoredLine[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const scoreAll = useCallback(() => {
    const lines = input
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const scored: ScoredLine[] = lines.map((line, idx) => ({
      index: idx,
      text: line,
      score: chiSquaredScore(line),
    }));

    scored.sort((a, b) => a.score - b.score);
    setResults(scored);
    setExpandedIndex(null);
  }, [input]);

  const bestScore = useMemo(() => (results.length > 0 ? results[0].score : Infinity), [results]);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <DataBarVertical24Regular />
              <Text weight="semibold" size={400}>
                Chi-Squared Scorer
              </Text>
            </div>
          }
          description="Paste multiple candidate decryptions (one per line) and rank them by English-likeness"
        />

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Label htmlFor="chi-input">Candidate texts (one per line)</Label>
          <Textarea
            id="chi-input"
            value={input}
            onChange={(_, d) => setInput(d.value)}
            placeholder={
              'Paste candidate decryptions here, one per line...\nLine 1: KHOOR ZRUOG\nLine 2: HELLO WORLD\nLine 3: GDKKN VNQKC'
            }
            resize="vertical"
            style={{ width: '100%', minHeight: '120px' }}
          />
        </div>

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="primary" icon={<Play24Regular />} onClick={scoreAll}>
            Score All
          </Button>
        </div>

        {results.length > 0 && (
          <>
            {/* Threshold legend */}
            <div className={styles.thresholdNote} style={{ marginTop: tokens.spacingVerticalM }}>
              <span
                className={styles.thresholdDot}
                style={{
                  backgroundColor: tokens.colorPaletteGreenBackground3,
                }}
              />
              <Text size={200}>χ² &lt; {CHI_THRESHOLD} → likely English</Text>
              <span
                className={styles.thresholdDot}
                style={{
                  backgroundColor: tokens.colorNeutralBackground5,
                }}
              />
              <Text size={200}>χ² ≥ {CHI_THRESHOLD} → unlikely English</Text>
            </div>

            <table className={styles.resultTable} style={{ marginTop: tokens.spacingVerticalS }}>
              <thead>
                <tr className={styles.rowBase}>
                  <th className={`${styles.cell} ${styles.rankCell}`}>Rank</th>
                  <th className={`${styles.cell} ${styles.scoreCell}`}>χ² Score</th>
                  <th className={styles.cell}>Text</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, rank) => {
                  const isBest = r.score === bestScore;
                  const isExpanded = expandedIndex === r.index;
                  return (
                    <tr
                      key={r.index}
                      className={isBest ? styles.rowBest : styles.rowBase}
                      onClick={() => setExpandedIndex(isExpanded ? null : r.index)}
                    >
                      <td className={`${styles.cell} ${styles.rankCell}`}>{rank + 1}</td>
                      <td className={`${styles.cell} ${styles.scoreCell}`}>
                        <span
                          style={{
                            color:
                              r.score < CHI_THRESHOLD
                                ? tokens.colorPaletteGreenForeground1
                                : tokens.colorNeutralForeground3,
                          }}
                        >
                          {r.score === Infinity ? '∞' : r.score.toFixed(2)}
                        </span>
                      </td>
                      <td className={styles.cell}>
                        {isExpanded ? (
                          <div className={styles.expandedText}>{r.text}</div>
                        ) : (
                          <div className={styles.preview}>
                            {r.text.length > 80 ? r.text.slice(0, 80) + '…' : r.text}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
