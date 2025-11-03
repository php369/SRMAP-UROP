import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedBarChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  chartId?: string;
  variant?: 'default' | 'gradient';
}

export function AnimatedBarChart({
  data,
  className,
  height = 300,
  color = '#6366f1',
  showGrid = true,
  showTooltip = true,
  animate = true,
  chartId = 'barChart',
  variant = 'default',
}: AnimatedBarChartProps) {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animate) {
      setAnimatedData(data);
      return;
    }

    if (isVisible) {
      // Animate data points in sequence
      data.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, data[index]]);
        }, index * 100);
      });
    }
  }, [data, animate, isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`chart-${chartId}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [chartId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="text-sm font-medium text-text mb-1">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            Value: <span className="font-medium">{payload[0].value}</span>
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const getBarColor = (entry: DataPoint, index: number) => {
    if (entry.color) return entry.color;
    if (variant === 'gradient') {
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
      return colors[index % colors.length];
    }
    return color;
  };

  return (
    <motion.div
      id={`chart-${chartId}`}
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={animate ? animatedData : data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          )}
          
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            animationDuration={animate ? 1500 : 0}
            animationEasing="ease-out"
          >
            {(animate ? animatedData : data).map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={variant === 'gradient' ? `url(#barGradient-${chartId})` : getBarColor(entry, index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}