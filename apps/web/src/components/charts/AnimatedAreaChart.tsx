import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DataPoint {
  name: string;
  value: number;
  value2?: number;
}

interface AnimatedAreaChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
  color?: string;
  color2?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  gradientId?: string;
}

export function AnimatedAreaChart({
  data,
  className,
  height = 300,
  color = '#6366f1',
  color2,
  showGrid = true,
  showTooltip = true,
  animate = true,
  gradientId = 'colorGradient',
}: AnimatedAreaChartProps) {
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

    const element = document.getElementById(`chart-${gradientId}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [gradientId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="text-sm font-medium text-text mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      id={`chart-${gradientId}`}
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={animate ? animatedData : data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            {color2 && (
              <linearGradient id={`${gradientId}2`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color2} stopOpacity={0} />
              </linearGradient>
            )}
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
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={animate ? 1500 : 0}
            animationEasing="ease-out"
          />
          
          {color2 && (
            <Area
              type="monotone"
              dataKey="value2"
              stroke={color2}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId}2)`}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
