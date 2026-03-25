import {
  calculateDerived,
  calculateAncestor,
  calculateSeed,
  calculateBucketedFrequencies,
} from './sequences';

describe('calculateDerived', () => {
  it('returns empty array for sequences shorter than 2', () => {
    expect(calculateDerived([], 'M - N')).toEqual([]);
    expect(calculateDerived([5], 'M - N')).toEqual([]);
  });

  it('calculates differences with default M - N formula', () => {
    expect(calculateDerived([1, 3, 6, 10], 'M - N')).toEqual([2, 3, 4]);
  });

  it('calculates sums with M + N formula', () => {
    expect(calculateDerived([1, 2, 3], 'M + N')).toEqual([3, 5]);
  });

  it('falls back to simple difference on invalid formula', () => {
    expect(calculateDerived([1, 3, 6], '???invalid')).toEqual([2, 3]);
  });

  it('uses index variable I in formula', () => {
    expect(calculateDerived([10, 20, 30], 'M - N + I')).toEqual([10, 11]);
  });
});

describe('calculateSeed', () => {
  it('returns 0 for empty sequence', () => {
    expect(calculateSeed([], 'zero')).toBe(0);
  });

  it('returns min of sequence', () => {
    expect(calculateSeed([3, 1, 4, 1, 5], 'min')).toBe(1);
  });

  it('returns max of sequence', () => {
    expect(calculateSeed([3, 1, 4, 1, 5], 'max')).toBe(5);
  });

  it('returns average of sequence', () => {
    expect(calculateSeed([2, 4, 6], 'avg')).toBeCloseTo(4);
  });

  it('returns 0 for zero seed', () => {
    expect(calculateSeed([10, 20], 'zero')).toBe(0);
  });

  it('returns 1 for one seed', () => {
    expect(calculateSeed([10, 20], 'one')).toBe(1);
  });
});

describe('calculateAncestor', () => {
  it('returns empty array for empty sequence', () => {
    expect(calculateAncestor([], 'M - N', 'zero')).toEqual([]);
  });

  it('reconstructs parent via cumulative sum for M - N', () => {
    // If derived = [2, 3, 4] with seed 0, ancestor should be [0, 2, 5, 9]
    expect(calculateAncestor([2, 3, 4], 'M - N', 'zero')).toEqual([0, 2, 5, 9]);
  });

  it('uses seed function for initial value', () => {
    const result = calculateAncestor([2, 3, 4], 'M - N', 'one');
    expect(result[0]).toBe(1);
    expect(result).toEqual([1, 3, 6, 10]);
  });
});

describe('calculateBucketedFrequencies', () => {
  it('returns empty array for empty input', () => {
    expect(calculateBucketedFrequencies([], 10)).toEqual([]);
  });

  it('returns single bucket when all values are the same', () => {
    const result = calculateBucketedFrequencies([5, 5, 5], 10);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it('distributes values across buckets', () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateBucketedFrequencies(numbers, 5);
    expect(result).toHaveLength(5);
    const totalCount = result.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(10);
  });

  it('respects bucket count parameter', () => {
    const numbers = [0, 5, 10];
    const result = calculateBucketedFrequencies(numbers, 2);
    expect(result).toHaveLength(2);
  });
});
