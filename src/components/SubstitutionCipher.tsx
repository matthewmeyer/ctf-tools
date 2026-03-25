import { useState, useMemo, useCallback } from 'react';
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
} from '@fluentui/react-components';
import { ArrowReset24Regular, TextT24Regular } from '@fluentui/react-icons';
import { letterFrequencyPercent, ENGLISH_FREQUENCIES } from '../utils/crypto';
import {
  extractWords,
  findPatternMatches,
  wordPattern,
  deriveMappingFromPair,
  isMappingConsistent,
  mergeMappings,
  findCribPositions,
  analyzeAlphabet,
} from '../utils/wordPatterns';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
  charts: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  chartSection: {
    flex: 1,
    minWidth: '300px',
  },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '180px',
    gap: '2px',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: '1px',
  },
  bar: {
    width: '100%',
    borderRadius: `${tokens.borderRadiusSmall} ${tokens.borderRadiusSmall} 0 0`,
    minHeight: '1px',
    transition: 'height 0.2s ease',
  },
  barCipher: {
    backgroundColor: tokens.colorBrandBackground,
  },
  barEnglish: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  barLabel: {
    fontSize: '10px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  barPct: {
    fontSize: '8px',
    fontFamily: 'monospace',
    color: tokens.colorNeutralForeground3,
  },
  mappingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  mappingCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  mappingCellSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  mappingCellMapped: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  mappingCellDisabled: {
    opacity: 0.3,
    cursor: 'default',
  },
  cipherLetter: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: tokens.fontSizeBase300,
  },
  plainLetter: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
    minHeight: '20px',
  },
  previewBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflowY: 'auto',
    lineHeight: '1.6',
  },
  wordPatternList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '400px',
    overflowY: 'auto',
  },
  wordPatternRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  wordPatternLabel: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    minWidth: '120px',
  },
  wordPatternSig: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    minWidth: '80px',
  },
  candidateChip: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  candidateConsistent: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    ':hover': {
      backgroundColor: tokens.colorPaletteGreenBackground2,
    },
  },
  candidateConflict: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
    },
  },
  cribPositionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  cribPositionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  cribMappingPreview: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
});

export function SubstitutionCipher() {
  const styles = useStyles();
  const [input, setInput] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selectedCipher, setSelectedCipher] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [crib, setCrib] = useState('');

  const cipherFreqs = useMemo(() => letterFrequencyPercent(input), [input]);

  const presentLetters = useMemo(() => {
    const set: Record<string, boolean> = {};
    const upper = input.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      if (ch >= 'A' && ch <= 'Z') set[ch] = true;
    }
    return set;
  }, [input]);

  const maxCipher = Math.max(...Object.values(cipherFreqs), 1);
  const maxEnglish = Math.max(...Object.values(ENGLISH_FREQUENCIES), 1);

  const handleCellClick = useCallback(
    (letter: string) => {
      if (selectedCipher === null) {
        setSelectedCipher(letter);
      } else if (selectedCipher === letter) {
        setSelectedCipher(null);
      } else {
        setMapping((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            if (next[k] === letter) delete next[k];
          }
          next[selectedCipher] = letter;
          return next;
        });
        setSelectedCipher(null);
      }
    },
    [selectedCipher],
  );

  const handleReset = () => {
    setMapping({});
    setSelectedCipher(null);
  };

  const preview = useMemo(() => {
    return input
      .split('')
      .map((ch) => {
        const upper = ch.toUpperCase();
        if (upper >= 'A' && upper <= 'Z') {
          const mapped = mapping[upper];
          if (mapped) {
            return ch === upper ? mapped : mapped.toLowerCase();
          }
          return '·';
        }
        return ch;
      })
      .join('');
  }, [input, mapping]);

  // Word pattern analysis
  const cipherWords = useMemo(() => extractWords(input), [input]);
  const patternMatches = useMemo(
    () =>
      findPatternMatches(
        cipherWords.map(function (w) {
          return w.word;
        }),
      ),
    [cipherWords],
  );

  // Deduped word list with patterns
  const uniqueWords = useMemo(() => {
    var seen: Record<string, boolean> = {};
    var result: Array<{ word: string; pattern: string; candidates: string[] }> = [];
    for (var i = 0; i < cipherWords.length; i++) {
      var w = cipherWords[i].word;
      if (!seen[w]) {
        seen[w] = true;
        result.push({
          word: w,
          pattern: wordPattern(w),
          candidates: patternMatches.get(w) || [],
        });
      }
    }
    // Sort by fewest candidates first (most constrained)
    result.sort(function (a, b) {
      return a.candidates.length - b.candidates.length;
    });
    return result;
  }, [cipherWords, patternMatches]);

  const handleApplyCandidate = useCallback(
    (cipherWord: string, plainWord: string) => {
      var derived = deriveMappingFromPair(cipherWord, plainWord);
      if (!derived) return;
      var merged = mergeMappings(mapping, derived);
      if (merged) {
        setMapping(merged);
      }
    },
    [mapping],
  );

  const handleAutoSolve = useCallback(() => {
    var currentMapping: Record<string, string> = { ...mapping };
    // Iterate words sorted by fewest candidates (most constrained first)
    for (var i = 0; i < uniqueWords.length; i++) {
      var entry = uniqueWords[i];
      if (entry.candidates.length === 0) continue;
      for (var j = 0; j < entry.candidates.length; j++) {
        var candidate = entry.candidates[j];
        var derived = deriveMappingFromPair(entry.word, candidate);
        if (derived && isMappingConsistent(currentMapping, derived)) {
          var merged = mergeMappings(currentMapping, derived);
          if (merged) {
            currentMapping = merged;
            break;
          }
        }
      }
    }
    setMapping(currentMapping);
  }, [mapping, uniqueWords]);

  // Crib drag analysis
  const cribPositions = useMemo(() => {
    if (!crib.trim() || !input.trim()) return [];
    return findCribPositions(input, crib);
  }, [input, crib]);

  // Distribution analysis
  const alphabetAnalysis = useMemo(() => {
    if (!input.trim()) return null;
    return analyzeAlphabet(input);
  }, [input]);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <div className={styles.header}>
              <TextT24Regular />
              <Text weight="semibold" size={400}>
                Substitution Cipher
              </Text>
            </div>
          }
          description="Manual frequency-analysis-based substitution cipher solver"
        />

        <Textarea
          placeholder="Enter ciphertext..."
          value={input}
          onChange={(_, data) => setInput(data.value)}
          resize="vertical"
          style={{ marginTop: tokens.spacingVerticalM }}
        />

        {input.trim() && (
          <>
            {/* Distribution Alert */}
            {alphabetAnalysis && (
              <div
                className={`${styles.alertBox} ${alphabetAnalysis.possibleHomophonic ? styles.alertWarning : styles.alertNormal}`}
                style={{ marginTop: tokens.spacingVerticalM }}
              >
                <Text size={200} weight="semibold">
                  Distribution: {alphabetAnalysis.expectedFlatness}
                </Text>
                <Text size={200}>
                  (flatness: {alphabetAnalysis.flatness.toFixed(2)}, {alphabetAnalysis.alphaChars}{' '}
                  alpha chars, {alphabetAnalysis.nonAlphaSymbols} symbols)
                </Text>
              </div>
            )}

            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as string)}
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              <Tab value="manual">Manual</Tab>
              <Tab value="wordpatterns">Word Patterns</Tab>
              <Tab value="cribdrag">Crib Drag</Tab>
            </TabList>

            {activeTab === 'manual' && (
              <>
                {/* Frequency charts side-by-side */}
                <div className={styles.charts} style={{ marginTop: tokens.spacingVerticalM }}>
                  <div className={styles.chartSection}>
                    <Label>Ciphertext Frequencies</Label>
                    <div className={styles.barChart}>
                      {ALPHA.map((ch) => (
                        <div key={ch} className={styles.barCol}>
                          <Text className={styles.barPct}>
                            {cipherFreqs[ch]?.toFixed(1) ?? '0'}
                          </Text>
                          <div
                            className={`${styles.bar} ${styles.barCipher}`}
                            style={{
                              height: `${((cipherFreqs[ch] || 0) / maxCipher) * 140}px`,
                            }}
                          />
                          <Text className={styles.barLabel}>{ch}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.chartSection}>
                    <Label>English Expected</Label>
                    <div className={styles.barChart}>
                      {ALPHA.map((ch) => (
                        <div key={ch} className={styles.barCol}>
                          <Text className={styles.barPct}>
                            {ENGLISH_FREQUENCIES[ch].toFixed(1)}
                          </Text>
                          <div
                            className={`${styles.bar} ${styles.barEnglish}`}
                            style={{
                              height: `${(ENGLISH_FREQUENCIES[ch] / maxEnglish) * 140}px`,
                            }}
                          />
                          <Text className={styles.barLabel}>{ch}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mapping grid */}
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Label>
                      Letter Mapping{' '}
                      {selectedCipher
                        ? `(selected: ${selectedCipher} → click target letter)`
                        : '(click cipher letter, then plain letter)'}
                    </Label>
                    <Button
                      appearance="subtle"
                      icon={<ArrowReset24Regular />}
                      size="small"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </div>
                  <div className={styles.mappingGrid}>
                    {ALPHA.map((ch) => {
                      const isMapped = ch in mapping;
                      const isSelected = selectedCipher === ch;
                      const isPresent = presentLetters[ch];
                      return (
                        <div
                          key={ch}
                          className={`${styles.mappingCell} ${!isPresent ? styles.mappingCellDisabled : ''} ${isSelected ? styles.mappingCellSelected : ''} ${isMapped && !isSelected ? styles.mappingCellMapped : ''}`}
                          onClick={() => {
                            // Non-present letters can only be clicked as target (when a cipher letter is already selected)
                            if (!isPresent && selectedCipher === null) return;
                            handleCellClick(ch);
                          }}
                        >
                          <Text className={styles.cipherLetter}>{ch}</Text>
                          <Text className={styles.plainLetter}>{mapping[ch] || '·'}</Text>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <Label>Decoded Preview</Label>
                  <div className={styles.previewBox}>{preview}</div>
                </div>
              </>
            )}

            {activeTab === 'wordpatterns' && (
              <>
                <div
                  style={{
                    marginTop: tokens.spacingVerticalM,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Label>
                    Cipher Words &amp; Pattern Matches ({uniqueWords.length} unique words)
                  </Label>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Button appearance="primary" size="small" onClick={handleAutoSolve}>
                      Auto-solve
                    </Button>
                    <Button
                      appearance="subtle"
                      icon={<ArrowReset24Regular />}
                      size="small"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <div className={styles.wordPatternList}>
                  {uniqueWords.map(function (entry) {
                    return (
                      <div key={entry.word} className={styles.wordPatternRow}>
                        <Text className={styles.wordPatternLabel}>{entry.word}</Text>
                        <Text className={styles.wordPatternSig}>{entry.pattern}</Text>
                        <div
                          style={{
                            display: 'flex',
                            gap: tokens.spacingHorizontalXS,
                            flexWrap: 'wrap',
                            flex: 1,
                          }}
                        >
                          {entry.candidates.length === 0 && (
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              No matches
                            </Text>
                          )}
                          {entry.candidates.map(function (candidate) {
                            var derived = deriveMappingFromPair(entry.word, candidate);
                            var consistent = derived
                              ? isMappingConsistent(mapping, derived)
                              : false;
                            return (
                              <button
                                key={candidate}
                                className={`${styles.candidateChip} ${consistent ? styles.candidateConsistent : styles.candidateConflict}`}
                                onClick={function () {
                                  handleApplyCandidate(entry.word, candidate);
                                }}
                                disabled={!consistent}
                                title={
                                  consistent
                                    ? 'Click to apply this mapping'
                                    : 'Conflicts with current mapping'
                                }
                              >
                                <span>{consistent ? '✓' : '✗'}</span>
                                {candidate}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shared preview */}
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <Label>Decoded Preview</Label>
                  <div className={styles.previewBox}>{preview}</div>
                </div>
              </>
            )}

            {activeTab === 'cribdrag' && (
              <>
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <Label>Known plaintext (crib)</Label>
                  <Input
                    value={crib}
                    onChange={function (_, data) {
                      setCrib(data.value);
                    }}
                    placeholder="e.g. FLAG{, THE , etc."
                    style={{ width: '100%', marginTop: tokens.spacingVerticalXS }}
                  />
                </div>

                {crib.trim() && cribPositions.length > 0 && (
                  <div
                    style={{
                      marginTop: tokens.spacingVerticalM,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: tokens.spacingVerticalS,
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    <Label>
                      Found {cribPositions.length} possible position
                      {cribPositions.length !== 1 ? 's' : ''}
                    </Label>
                    {cribPositions.map(function (pos) {
                      var consistent = isMappingConsistent(mapping, pos.mapping);
                      var mergedPreview = mergeMappings(mapping, pos.mapping);
                      var posPreview: string;
                      if (mergedPreview) {
                        var mp = mergedPreview;
                        posPreview = input
                          .split('')
                          .map(function (ch) {
                            var upper = ch.toUpperCase();
                            if (upper >= 'A' && upper <= 'Z') {
                              var mapped = mp[upper];
                              if (mapped) return ch === upper ? mapped : mapped.toLowerCase();
                              return '·';
                            }
                            return ch;
                          })
                          .join('');
                      } else {
                        posPreview = preview;
                      }
                      var mappingStr = Object.entries(pos.mapping)
                        .map(function (pair) {
                          return pair[0] + '→' + pair[1];
                        })
                        .join(' ');
                      return (
                        <div key={pos.position} className={styles.cribPositionRow}>
                          <div className={styles.cribPositionHeader}>
                            <Text weight="semibold" size={200}>
                              Position {pos.position}: &quot;
                              {input.slice(pos.position, pos.position + crib.length).toUpperCase()}
                              &quot; → &quot;{crib.toUpperCase()}&quot;
                            </Text>
                            <Button
                              appearance="primary"
                              size="small"
                              disabled={!consistent}
                              onClick={function () {
                                var merged = mergeMappings(mapping, pos.mapping);
                                if (merged) setMapping(merged);
                              }}
                            >
                              {consistent ? 'Apply' : 'Conflicts'}
                            </Button>
                          </div>
                          <Text className={styles.cribMappingPreview}>Mapping: {mappingStr}</Text>
                          <div
                            className={styles.previewBox}
                            style={{ maxHeight: '80px', fontSize: tokens.fontSizeBase200 }}
                          >
                            {posPreview}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {crib.trim() && cribPositions.length === 0 && (
                  <Text
                    size={200}
                    style={{
                      marginTop: tokens.spacingVerticalM,
                      color: tokens.colorNeutralForeground3,
                    }}
                  >
                    No valid positions found for this crib.
                  </Text>
                )}

                {/* Shared preview */}
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Label>Decoded Preview</Label>
                    <Button
                      appearance="subtle"
                      icon={<ArrowReset24Regular />}
                      size="small"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </div>
                  <div className={styles.previewBox}>{preview}</div>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
