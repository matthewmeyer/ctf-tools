import type { FrequencyData, SeedFunction } from '../types';

/**
 * Calculate derived sequence using custom formula.
 * N = current value, M = next value, I = index
 */
export function calculateDerived(sequence: number[], formula: string): number[] {
  if (sequence.length < 2) return [];
  const result: number[] = [];

  try {
    // eslint-disable-next-line no-new-func
    const evalFormula = new Function('N', 'M', 'I', `return ${formula};`);

    for (let i = 0; i < sequence.length - 1; i++) {
      const N = sequence[i];
      const M = sequence[i + 1];
      const value = evalFormula(N, M, i);
      if (typeof value === 'number' && isFinite(value)) {
        result.push(value);
      }
    }
  } catch {
    for (let i = 1; i < sequence.length; i++) {
      result.push(sequence[i] - sequence[i - 1]);
    }
  }

  return result;
}

export function calculateSeed(sequence: number[], seedFn: SeedFunction): number {
  if (sequence.length === 0) return 0;
  switch (seedFn) {
    case 'min':
      return Math.min(...sequence);
    case 'max':
      return Math.max(...sequence);
    case 'avg':
      return sequence.reduce((a, b) => a + b, 0) / sequence.length;
    case 'zero':
      return 0;
    case 'one':
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculate ancestor sequence (inverse operation).
 * Given a sequence produced by applying formula to a parent,
 * reconstruct a possible parent sequence seeded with the specified function.
 */
export function calculateAncestor(
  sequence: number[],
  formula: string,
  seedFn: SeedFunction,
): number[] {
  if (sequence.length < 1) return [];

  const seed = calculateSeed(sequence, seedFn);
  const result: number[] = [seed];

  try {
    // eslint-disable-next-line no-new-func
    const testFormula = new Function('N', 'M', 'I', `return ${formula};`);
    const testResult = testFormula(5, 8, 0);

    if (Math.abs(testResult - 3) < 0.001) {
      for (let i = 0; i < sequence.length; i++) {
        result.push(result[i] + sequence[i]);
      }
    } else {
      const minVal = Math.min(...sequence);
      const maxVal = Math.max(...sequence);
      for (let i = 0; i < sequence.length; i++) {
        const N = result[i];
        const target = sequence[i];
        let lo = minVal - Math.abs(maxVal - minVal) * 10;
        let hi = maxVal + Math.abs(maxVal - minVal) * 10;
        let M = (lo + hi) / 2;

        for (let iter = 0; iter < 50; iter++) {
          const val = testFormula(N, M, i);
          if (Math.abs(val - target) < 0.001) break;
          if (val < target) lo = M;
          else hi = M;
          M = (lo + hi) / 2;
        }
        result.push(M);
      }
    }
  } catch {
    for (let i = 0; i < sequence.length; i++) {
      result.push(result[i] + sequence[i]);
    }
  }

  return result;
}

/** Calculate bucketed frequency distribution */
export function calculateBucketedFrequencies(
  numbers: number[],
  bucketCount: number,
): FrequencyData[] {
  if (numbers.length === 0) return [];

  const minVal = Math.min(...numbers);
  const maxVal = Math.max(...numbers);
  const range = maxVal - minVal;

  if (range === 0) {
    return [{ label: `${minVal}`, rangeStart: minVal, rangeEnd: minVal, count: numbers.length }];
  }

  const bucketSize = range / bucketCount;

  const buckets: FrequencyData[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const rangeStart = minVal + i * bucketSize;
    const rangeEnd = minVal + (i + 1) * bucketSize;
    const midpoint = (rangeStart + rangeEnd) / 2;
    buckets.push({
      label: bucketSize >= 1 ? `${Math.round(midpoint)}` : `${midpoint.toFixed(1)}`,
      rangeStart,
      rangeEnd,
      count: 0,
    });
  }

  for (const num of numbers) {
    const bucketIndex = Math.min(Math.floor((num - minVal) / bucketSize), bucketCount - 1);
    buckets[bucketIndex].count++;
  }

  return buckets;
}
