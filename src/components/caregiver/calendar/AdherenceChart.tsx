import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/tokens';

export interface AdherenceDay {
  day: string; // e.g. 'Lun'
  percentage: number; // 0-100
  status: 'good' | 'warning' | 'bad' | 'future';
  dateStr: string; // 'YYYY-MM-DD' for key
}

interface AdherenceChartProps {
  weeklyStats: AdherenceDay[];
  loading?: boolean;
}

export const AdherenceChart: React.FC<AdherenceChartProps> = ({
  weeklyStats = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  const getBarColor = (status: AdherenceDay['status']) => {
    switch (status) {
      case 'good': return colors.success[500];
      case 'warning': return colors.warning[500];
      case 'bad': return colors.error[500];
      case 'future': return colors.gray[200];
      default: return colors.gray[300];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={20} color={colors.primary[600]} />
          <Text style={styles.title}>Adherencia Semanal</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.chartContainer}>
        {weeklyStats.length > 0 ? (
          weeklyStats.map((day) => (
            <View key={day.dateStr} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      height: `${Math.max(day.percentage, 5)}%`,
                      backgroundColor: getBarColor(day.status) 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No hay datos suficientes para esta semana</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 8,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barContainer: {
    width: 8,
    height: '80%',
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: colors.gray[500],
    width: '100%',
    marginTop: 40,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.gray[500],
    padding: 20,
  },
});
