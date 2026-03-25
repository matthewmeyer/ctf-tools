export interface FrequencyData {
  label: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

export type SeedFunction = 'min' | 'max' | 'avg' | 'zero' | 'one';

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'encoding' | 'ciphers' | 'analysis';
  icon: string;
}
