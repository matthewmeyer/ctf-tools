import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  TabList,
  Tab,
  Label,
} from '@fluentui/react-components';
import { DataBarVertical24Regular } from '@fluentui/react-icons';
import {
  letterFrequency,
  letterFrequencyPercent,
  ngramFrequency,
  ENGLISH_FREQUENCIES,
  ENGLISH_BIGRAMS,
  ENGLISH_TRIGRAMS,
} from '../utils/crypto';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEVIATION_THRESHOLD = 3; // percentage points

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
    minWidth: '100px',
  },
  chartsWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
  },
  chartColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    height: '18px',
  },
  letterLabel: {
    width: '16px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: tokens.fontSizeBase200,
    textAlign: 'center',
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: '14px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.borderRadiusSmall,
    transition: 'width 0.3s ease',
  },
  barValue: {
    width: '90px',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textAlign: 'right' as const,
    flexShrink: 0,
  },
  ngramTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  ngramRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  ngramRowHighlight: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  ngramCell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  ngramRank: {
    width: '40px',
    color: tokens.colorNeutralForeground3,
  },
});

type TabValue = 'letters' | 'bigrams' | 'trigrams';

export function FrequencyAnalysis() {
  const styles = useStyles();
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('letters');

  const counts = useMemo(() => letterFrequency(text), [text]);
  const percents = useMemo(() => letterFrequencyPercent(text), [text]);

  const totalLetters = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const uniqueChars = useMemo(() => new Set(text).size, [text]);

  const maxObservedPct = useMemo(() => Math.max(...Object.values(percents), 0), [percents]);
  const maxEnglishPct = Math.max(...Object.values(ENGLISH_FREQUENCIES));
  const maxPct = Math.max(maxObservedPct, maxEnglishPct, 1);

  const bigrams = useMemo(() => {
    const freq = ngramFrequency(text, 2);
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [text]);

  const trigrams = useMemo(() => {
    const freq = ngramFrequency(text, 3);
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [text]);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <DataBarVertical24Regular />
              <Text weight="semibold" size={400}>
                Frequency Analysis
              </Text>
            </div>
          }
          description="Analyze letter, bigram, and trigram frequencies and compare against English"
        />

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Label htmlFor="freq-input">Text to analyze</Label>
          <Textarea
            id="freq-input"
            value={text}
            onChange={(_, d) => setText(d.value)}
            placeholder="Paste ciphertext here..."
            resize="vertical"
            style={{ width: '100%', minHeight: '80px' }}
          />
        </div>

        <div className={styles.statsRow} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.statItem}>
            <Text size={200}>Total Letters</Text>
            <Text weight="bold" size={400}>
              {totalLetters}
            </Text>
          </div>
          <div className={styles.statItem}>
            <Text size={200}>Unique Characters</Text>
            <Text weight="bold" size={400}>
              {uniqueChars}
            </Text>
          </div>
        </div>

        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, d) => setActiveTab(d.value as TabValue)}
          style={{ marginTop: tokens.spacingVerticalM }}
        >
          <Tab value="letters">Letters</Tab>
          <Tab value="bigrams">Bigrams</Tab>
          <Tab value="trigrams">Trigrams</Tab>
        </TabList>

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          {activeTab === 'letters' && (
            <div className={styles.chartsWrapper}>
              {/* Observed frequencies */}
              <div className={styles.chartColumn}>
                <Text weight="semibold" size={300}>
                  Observed
                </Text>
                {LETTERS.map((letter) => {
                  const pct = percents[letter] || 0;
                  const expected = ENGLISH_FREQUENCIES[letter] || 0;
                  const deviant = Math.abs(pct - expected) > DEVIATION_THRESHOLD;
                  return (
                    <div key={letter} className={styles.barRow}>
                      <span className={styles.letterLabel}>{letter}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${(pct / maxPct) * 100}%`,
                            backgroundColor: deviant
                              ? tokens.colorPaletteRedBackground3
                              : tokens.colorBrandBackground,
                          }}
                        />
                      </div>
                      <span className={styles.barValue}>
                        {counts[letter]} &middot; {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* English expected frequencies */}
              <div className={styles.chartColumn}>
                <Text weight="semibold" size={300}>
                  English Expected
                </Text>
                {LETTERS.map((letter) => {
                  const pct = ENGLISH_FREQUENCIES[letter] || 0;
                  return (
                    <div key={letter} className={styles.barRow}>
                      <span className={styles.letterLabel}>{letter}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${(pct / maxPct) * 100}%`,
                            backgroundColor: tokens.colorNeutralForeground2,
                          }}
                        />
                      </div>
                      <span className={styles.barValue}>{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'bigrams' && (
            <NgramTable entries={bigrams} highlightSet={ENGLISH_BIGRAMS} styles={styles} />
          )}

          {activeTab === 'trigrams' && (
            <NgramTable entries={trigrams} highlightSet={ENGLISH_TRIGRAMS} styles={styles} />
          )}
        </div>
      </Card>
    </div>
  );
}

function NgramTable({
  entries,
  highlightSet,
  styles,
}: {
  entries: [string, number][];
  highlightSet: string[];
  styles: ReturnType<typeof useStyles>;
}) {
  const set = useMemo(() => new Set(highlightSet), [highlightSet]);

  return (
    <table className={styles.ngramTable}>
      <thead>
        <tr className={styles.ngramRow}>
          <th className={`${styles.ngramCell} ${styles.ngramRank}`}>#</th>
          <th className={styles.ngramCell}>N-gram</th>
          <th className={styles.ngramCell}>Count</th>
          <th className={styles.ngramCell}>Common?</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([gram, count], idx) => (
          <tr key={gram} className={set.has(gram) ? styles.ngramRowHighlight : styles.ngramRow}>
            <td className={`${styles.ngramCell} ${styles.ngramRank}`}>{idx + 1}</td>
            <td className={styles.ngramCell}>{gram}</td>
            <td className={styles.ngramCell}>{count}</td>
            <td className={styles.ngramCell}>{set.has(gram) ? '✓' : ''}</td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr className={styles.ngramRow}>
            <td className={styles.ngramCell} colSpan={4}>
              No data — enter text above
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
