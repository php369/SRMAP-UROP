export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  color?: string;
}

export interface LineConfig {
  dataKey: string;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
}

export default ChartDataPoint;
