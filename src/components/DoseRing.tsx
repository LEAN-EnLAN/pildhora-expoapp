import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { DoseSegment } from '../types';

interface DoseRingProps {
  size?: number;
  strokeWidth?: number;
  segments: DoseSegment[];
  // Optional accessibility label for screen readers
  accessibilityLabel?: string;
}

// Status to color mapping as specified in the documentation
const statusColors: Record<DoseSegment['status'], string> = {
  PENDING: '#9ca3af',     // gray
  DOSE_TAKEN: '#22c55e',  // green
  DOSE_MISSED: '#ef4444', // red
};

const DEFAULT_SEGMENT_COLOR = '#9ca3af';

const DoseRing: React.FC<DoseRingProps> = React.memo(({
  size = 200,
  strokeWidth = 20,
  segments,
  accessibilityLabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Memoize the arc paths calculation for performance
  const arcPaths = useMemo(() => {
    return segments.map((segment, index) => {
      const totalHours = 24;
      const startAngle = (segment.startHour / totalHours) * 360 - 90; // Start from top
      const endAngle = (segment.endHour / totalHours) * 360 - 90;
      const color = statusColors[segment.status] || DEFAULT_SEGMENT_COLOR;
      
      const getArcPath = (startAngle: number, endAngle: number): string => {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
      };

      return {
        key: index,
        path: getArcPath(startAngle, endAngle),
        color,
        status: segment.status
      };
    });
  }, [segments, radius, center]);

  // Generate accessibility description for screen readers
  const accessibilityDescription = useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;
    
    const statusCounts = segments.reduce((acc, segment) => {
      acc[segment.status] = (acc[segment.status] || 0) + 1;
      return acc;
    }, {} as Record<DoseSegment['status'], number>);
    
    const parts = [];
    if (statusCounts.PENDING) parts.push(`${statusCounts.PENDING} pending`);
    if (statusCounts.DOSE_TAKEN) parts.push(`${statusCounts.DOSE_TAKEN} taken`);
    if (statusCounts.DOSE_MISSED) parts.push(`${statusCounts.DOSE_MISSED} missed`);
    
    return `Dose ring with ${parts.join(', ')} doses`;
  }, [segments, accessibilityLabel]);

  return (
    <View
      style={{ width: size, height: size }}
      accessible={true}
      accessibilityLabel={accessibilityDescription}
      accessibilityRole="image"
    >
      <Svg width={size} height={size}>
        {/* Base track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#1E1E2E" // Dark base color
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Arc segments */}
        {arcPaths.map(({ key, path, color, status }) => (
          <Path
            key={key}
            d={path}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            accessibilityLabel={`Dose segment: ${status.toLowerCase().replace('_', ' ')}`}
          />
        ))}
      </Svg>
    </View>
  );
});

// Set display name for debugging
DoseRing.displayName = 'DoseRing';

export default DoseRing;