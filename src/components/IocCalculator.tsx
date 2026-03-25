import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Textarea,
  Label,
} from '@fluentui/react-components';
import { DataBarVertical24Regular } from '@fluentui/react-icons';
import { indexOfCoincidence } from '../utils/crypto';

const IOC_RANDOM = 0.0385;
const IOC_ENGLISH = 0.0667;

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
  bigNumber: {
    fontFamily: 'monospace',
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    padding: tokens.spacingVerticalM,
  },
  gaugeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
  gaugeTrack: {
    position: 'relative' as const,
    height: '24px',
    borderRadius: tokens.borderRadiusMedium,
    background: `linear-gradient(to right, ${tokens.colorPaletteRedBackground3}, ${tokens.colorPaletteYellowBackground3}, ${tokens.colorPaletteGreenBackground3})`,
    overflow: 'visible',
  },
  gaugeMarker: {
    position: 'absolute' as const,
    top: '-4px',
    width: '4px',
    height: '32px',
    backgroundColor: tokens.colorNeutralForeground1,
    borderRadius: '2px',
    transform: 'translateX(-50%)',
  },
  gaugeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  refRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  refItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    minWidth: '140px',
  },
  periodTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  periodRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  periodRowBest: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  periodCell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  periodBar: {
    height: '12px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground,
    transition: 'width 0.3s ease',
  },
});

export function IocCalculator() {
  const styles = useStyles();
  const [text, setText] = useState('');

  const ioc = useMemo(() => indexOfCoincidence(text), [text]);

  // Gauge position: map IoC range [0.02 .. 0.08] to [0% .. 100%]
  const gaugeMin = 0.02;
  const gaugeMax = 0.08;
  const gaugePos = Math.min(100, Math.max(0, ((ioc - gaugeMin) / (gaugeMax - gaugeMin)) * 100));

  // Period analysis: for each period 1-20, split text into columns and average IoC
  const periodIocs = useMemo(() => {
    const upper = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (upper.length < 2) return [];

    const results: { period: number; avgIoc: number }[] = [];
    for (let p = 1; p <= 20; p++) {
      const columns: string[] = Array.from({ length: p }, () => '');
      for (let i = 0; i < upper.length; i++) {
        columns[i % p] += upper[i];
      }
      const colIocs = columns.filter((c) => c.length > 1).map((c) => indexOfCoincidence(c));
      const avg = colIocs.length > 0 ? colIocs.reduce((a, b) => a + b, 0) / colIocs.length : 0;
      results.push({ period: p, avgIoc: avg });
    }
    return results;
  }, [text]);

  const bestPeriod = useMemo(() => {
    if (periodIocs.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < periodIocs.length; i++) {
      if (periodIocs[i].avgIoc > periodIocs[best].avgIoc) best = i;
    }
    return periodIocs[best].period;
  }, [periodIocs]);

  const maxPeriodIoc = useMemo(
    () => Math.max(...periodIocs.map((p) => p.avgIoc), 0.001),
    [periodIocs],
  );

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <DataBarVertical24Regular />
              <Text weight="semibold" size={400}>
                Index of Coincidence
              </Text>
            </div>
          }
          description="Calculate IoC to distinguish English from random text and determine Vigenère key length"
        />

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Label htmlFor="ioc-input">Text to analyze</Label>
          <Textarea
            id="ioc-input"
            value={text}
            onChange={(_, d) => setText(d.value)}
            placeholder="Paste ciphertext here..."
            resize="vertical"
            style={{ width: '100%', minHeight: '80px' }}
          />
        </div>

        {/* Big IoC display */}
        <div className={styles.bigNumber}>{ioc.toFixed(6)}</div>

        {/* Gauge */}
        <div className={styles.gaugeWrapper}>
          <div className={styles.gaugeTrack}>
            <div className={styles.gaugeMarker} style={{ left: `${gaugePos}%` }} />
          </div>
          <div className={styles.gaugeLabels}>
            <span>Random (~{IOC_RANDOM})</span>
            <span>English (~{IOC_ENGLISH})</span>
          </div>
        </div>

        {/* Reference values */}
        <div className={styles.refRow} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.refItem}>
            <Text size={200}>English Text</Text>
            <Text weight="bold" size={400}>
              ~{IOC_ENGLISH}
            </Text>
          </div>
          <div className={styles.refItem}>
            <Text size={200}>Random Text</Text>
            <Text weight="bold" size={400}>
              ~{IOC_RANDOM}
            </Text>
          </div>
          <div className={styles.refItem}>
            <Text size={200}>Your Text</Text>
            <Text weight="bold" size={400}>
              {ioc.toFixed(4)}
            </Text>
          </div>
        </div>

        {/* Period IoC table */}
        {periodIocs.length > 0 && (
          <div style={{ marginTop: tokens.spacingVerticalL }}>
            <Text weight="semibold" size={300}>
              Average IoC by Period Length (Vigenère key length detection)
            </Text>
            <table className={styles.periodTable} style={{ marginTop: tokens.spacingVerticalS }}>
              <thead>
                <tr className={styles.periodRow}>
                  <th className={styles.periodCell}>Period</th>
                  <th className={styles.periodCell}>Avg IoC</th>
                  <th className={styles.periodCell} style={{ width: '60%' }}>
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {periodIocs.map(({ period, avgIoc }) => (
                  <tr
                    key={period}
                    className={period === bestPeriod ? styles.periodRowBest : styles.periodRow}
                  >
                    <td className={styles.periodCell}>
                      {period}
                      {period === bestPeriod ? ' ★' : ''}
                    </td>
                    <td className={styles.periodCell}>{avgIoc.toFixed(6)}</td>
                    <td className={styles.periodCell}>
                      <div
                        className={styles.periodBar}
                        style={{
                          width: `${(avgIoc / maxPeriodIoc) * 100}%`,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
