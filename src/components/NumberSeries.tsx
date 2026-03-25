import { useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Dropdown,
  Option,
  Label,
  Slider,
  Input,
} from '@fluentui/react-components';
import { ArrowSync24Regular, DataBarVertical24Regular } from '@fluentui/react-icons';
import type { SeedFunction } from '../types';
import {
  calculateDerived,
  calculateAncestor,
  calculateBucketedFrequencies,
} from '../utils/sequences';

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
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sequenceSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'stretch',
    height: '300px',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    gap: '1px',
    width: '100%',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    flex: 1,
    minWidth: 0,
  },
  bar: {
    width: '100%',
    maxWidth: '60px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
    transition: 'height 0.3s ease',
    minHeight: '2px',
  },
  barLabel: {
    fontWeight: 'bold',
    fontSize: tokens.fontSizeBase200,
  },
  barCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  statsContainer: {
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
    minWidth: '80px',
  },
  numbersPreview: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    maxHeight: '100px',
    overflowY: 'auto',
    wordBreak: 'break-all',
  },
  sequenceInfo: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalS,
  },
});

export function NumberSeries() {
  const styles = useStyles();
  // Sequences stored with index: 0 = original, positive = derived, negative = ancestors
  const [sequences, setSequences] = useState<Map<number, number[]>>(new Map());
  const [selectedIteration, setSelectedIteration] = useState<number>(0);
  const [bucketCount, setBucketCount] = useState<number>(20);
  const [formula, setFormula] = useState<string>('M - N');
  const [seedFn, setSeedFn] = useState<SeedFunction>('zero');

  const generateNumbers = useCallback(() => {
    // Generate 1000 random numbers between 0-10
    const original: number[] = [];
    for (let i = 0; i < 1000; i++) {
      original.push(Math.floor(Math.random() * 11));
    }

    const allSequences = new Map<number, number[]>();
    allSequences.set(0, original);

    // Generate positive iterations (N=1 to N=10)
    let current = original;
    for (let i = 1; i <= 10; i++) {
      const derived = calculateDerived(current, formula);
      if (derived.length < 2) break;
      allSequences.set(i, derived);
      current = derived;
    }

    // Generate negative iterations (N=-1 to N=-10) - ancestor sequences
    current = original;
    for (let i = -1; i >= -10; i--) {
      const ancestor = calculateAncestor(current, formula, seedFn);
      if (ancestor.length < 2) break;
      allSequences.set(i, ancestor);
      current = ancestor;
    }

    setSequences(allSequences);
    setSelectedIteration(0);
  }, [formula, seedFn]);

  // Get sorted indices for dropdown
  const sortedIndices = useMemo(
    () => Array.from(sequences.keys()).sort((a, b) => a - b),
    [sequences],
  );

  // Get current sequence and its frequencies
  const currentSequence = useMemo(
    () => sequences.get(selectedIteration) || [],
    [sequences, selectedIteration],
  );
  const frequencies = useMemo(
    () => calculateBucketedFrequencies(currentSequence, bucketCount),
    [currentSequence, bucketCount],
  );

  const maxCount = Math.max(...frequencies.map((f) => f.count), 1);
  const mean =
    currentSequence.length > 0
      ? (currentSequence.reduce((a, b) => a + b, 0) / currentSequence.length).toFixed(2)
      : '0';
  const minValue = currentSequence.length > 0 ? Math.min(...currentSequence) : 0;
  const maxValue = currentSequence.length > 0 ? Math.max(...currentSequence) : 0;
  const modeFreq =
    frequencies.length > 0 ? frequencies.reduce((a, b) => (a.count > b.count ? a : b)) : null;

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <DataBarVertical24Regular />
              <Text weight="semibold" size={400}>
                Number Series Explorer
              </Text>
            </div>
          }
          description="Generate 1000 random numbers (0-10), then explore derived and ancestor sequences using custom formulas"
        />

        <div className={styles.controls} style={{ marginTop: tokens.spacingVerticalM }}>
          <div className={styles.sequenceSelector}>
            <Label>Formula (N=current, M=next, I=index):</Label>
            <Input
              value={formula}
              onChange={(_, data) => setFormula(data.value)}
              placeholder="M - N"
              style={{ width: '180px' }}
            />
          </div>

          <div className={styles.sequenceSelector}>
            <Label>Ancestor Seed:</Label>
            <Dropdown
              value={
                seedFn === 'min'
                  ? 'min(x)'
                  : seedFn === 'max'
                    ? 'max(x)'
                    : seedFn === 'avg'
                      ? 'avg(x)'
                      : seedFn === 'zero'
                        ? '0'
                        : '1'
              }
              selectedOptions={[seedFn]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSeedFn(data.optionValue as SeedFunction);
              }}
              style={{ minWidth: '100px' }}
            >
              <Option value="zero" text="0">
                0
              </Option>
              <Option value="one" text="1">
                1
              </Option>
              <Option value="min" text="min(x)">
                min(x)
              </Option>
              <Option value="max" text="max(x)">
                max(x)
              </Option>
              <Option value="avg" text="avg(x)">
                avg(x)
              </Option>
            </Dropdown>
          </div>

          <Button appearance="primary" icon={<ArrowSync24Regular />} onClick={generateNumbers}>
            Generate Numbers
          </Button>

          {sequences.size > 0 && (
            <div className={styles.sequenceSelector}>
              <Label>Sequence:</Label>
              <Dropdown
                value={
                  selectedIteration === 0
                    ? 'Original (N=0)'
                    : selectedIteration > 0
                      ? `Derived N=${selectedIteration}`
                      : `Ancestor N=${selectedIteration}`
                }
                selectedOptions={[selectedIteration.toString()]}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) setSelectedIteration(parseInt(data.optionValue));
                }}
              >
                {sortedIndices.map((idx) => {
                  const seq = sequences.get(idx) || [];
                  const label =
                    idx === 0
                      ? 'Original (N=0)'
                      : idx > 0
                        ? `Derived N=${idx}`
                        : `Ancestor N=${idx}`;
                  return (
                    <Option key={idx} value={idx.toString()} text={label}>
                      {label} ({seq.length} items)
                    </Option>
                  );
                })}
              </Dropdown>
            </div>
          )}

          {sequences.size > 0 && (
            <div className={styles.sequenceSelector}>
              <Label>Buckets: {bucketCount}</Label>
              <Slider
                min={10}
                max={30}
                value={bucketCount}
                onChange={(_, data) => setBucketCount(data.value)}
                style={{ width: '150px' }}
              />
            </div>
          )}
        </div>

        {/* Sequence Info */}
        {sequences.size > 0 && (
          <div className={styles.sequenceInfo}>
            <Text size={200}>
              {selectedIteration === 0
                ? 'Original random sequence (values 0-10)'
                : selectedIteration > 0
                  ? `Derived iteration ${selectedIteration}: f(N,M) = ${formula}`
                  : `Ancestor iteration ${selectedIteration}: inverse of f(N,M) = ${formula}, seeded with ${seedFn === 'zero' ? '0' : seedFn === 'one' ? '1' : seedFn + '(x)'}`}
            </Text>
          </div>
        )}

        {/* Frequency Chart */}
        {frequencies.length > 0 && (
          <>
            <div className={styles.chartContainer} style={{ marginTop: tokens.spacingVerticalL }}>
              {frequencies.map((f, idx) => (
                <div key={idx} className={styles.barContainer}>
                  <Text className={styles.barCount}>{f.count}</Text>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(f.count / maxCount) * 220}px`,
                    }}
                  />
                  <Text className={styles.barLabel}>{f.label}</Text>
                </div>
              ))}
            </div>

            {/* Statistics */}
            <div className={styles.statsContainer} style={{ marginTop: tokens.spacingVerticalM }}>
              <div className={styles.statItem}>
                <Text size={200}>Length</Text>
                <Text weight="bold" size={400}>
                  {currentSequence.length}
                </Text>
              </div>
              <div className={styles.statItem}>
                <Text size={200}>Mean</Text>
                <Text weight="bold" size={400}>
                  {mean}
                </Text>
              </div>
              <div className={styles.statItem}>
                <Text size={200}>Mode Bucket</Text>
                <Text weight="bold" size={400}>
                  {modeFreq?.label || '-'}
                </Text>
              </div>
              <div className={styles.statItem}>
                <Text size={200}>Min Value</Text>
                <Text weight="bold" size={400}>
                  {minValue.toFixed(2)}
                </Text>
              </div>
              <div className={styles.statItem}>
                <Text size={200}>Max Value</Text>
                <Text weight="bold" size={400}>
                  {maxValue.toFixed(2)}
                </Text>
              </div>
              <div className={styles.statItem}>
                <Text size={200}>Buckets</Text>
                <Text weight="bold" size={400}>
                  {frequencies.length}
                </Text>
              </div>
            </div>

            {/* Numbers Preview */}
            <div style={{ marginTop: tokens.spacingVerticalM }}>
              <Text weight="semibold" size={300}>
                Sequence Values (first 200):
              </Text>
              <div className={styles.numbersPreview}>
                {currentSequence
                  .slice(0, 200)
                  .map((n) => (Number.isInteger(n) ? n : n.toFixed(2)))
                  .join(', ')}
                {currentSequence.length > 200 && '...'}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
