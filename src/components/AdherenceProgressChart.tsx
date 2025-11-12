import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';

interface AdherenceProgressChartProps {
  progress: number; // 0 to 1
  size?: number;
}

const AdherenceProgressChart: React.FC<AdherenceProgressChartProps> = ({ progress, size = 220 }) => {
  const chartData = {
    data: [progress > 1 ? 1 : progress < 0 ? 0 : progress]
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity: number, index?: number) => {
        const p = chartData.data[index ?? 0];
        if (p < 0.5) return `rgba(239, 68, 68, ${opacity})`;
        if (p < 0.8) return `rgba(245, 158, 11, ${opacity})`;
        return `rgba(34, 197, 94, ${opacity})`;
    },
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ProgressChart
        data={chartData}
        width={size}
        height={size}
        strokeWidth={18}
        radius={(size / 2) - 20}
        chartConfig={chartConfig}
        hideLegend={true}
      />
      <View style={styles.labelContainer}>
         <Text style={styles.progressText}>{`${Math.round(Math.max(0, Math.min(progress, 1)) * 100)}%`}</Text>
         <Text style={styles.adherenceLabel}>Adherencia</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1f2937'
    },
    adherenceLabel: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: -5,
    }
})

export default AdherenceProgressChart;
