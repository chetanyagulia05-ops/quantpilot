import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MiniChartProps {
  data: { value: number }[];
  color?: string;
  height?: number;
  width?: number;
}

export default function MiniChart({
  data,
  color,
  height = 40,
  width = 100,
}: MiniChartProps) {
  if (data.length < 2) return null;

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const defaultColor = lastValue >= firstValue ? '#10b981' : '#ef4444';
  const strokeColor = color ?? defaultColor;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
