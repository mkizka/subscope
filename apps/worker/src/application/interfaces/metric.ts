export interface IMetric {
  increment: (config: { name: string; help: string }) => void;
}
