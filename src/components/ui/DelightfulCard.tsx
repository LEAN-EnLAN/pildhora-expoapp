import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DelightfulCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  variant?: 'medication' | 'achievement' | 'celebration';
  medication?: {
    name: string;
    dosage: string;
    time?: string;
    taken?: boolean;
    streak?: number;
    level?: number;
    points?: number;
  };
}

export const DelightfulCard: React.FC<DelightfulCardProps> = ({ 
  children, 
  className = "", 
  onPress,
  variant = 'medication',
  medication
}) => {
  const [scaleValue] = React.useState(new Animated.Value(1));
  const [celebrateAnimation] = React.useState(new Animated.Value(0));
  
  const handlePress = () => {
    // Trigger delightful press animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(celebrateAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Trigger celebration animation for achievements
    if (variant === 'achievement' || (variant === 'celebration' || (medication?.taken && medication.streak && medication.streak % 7 === 0))) {
      celebrateAnimation.setValue(1);
      setTimeout(() => celebrateAnimation.setValue(0), 2000);
    }
  };
  
  const getCardStyle = (): Animated.WithAnimatedObject<ViewStyle> => {
    let backgroundColor = '#FFFFFF';
    let borderColor = '#E5E7EB';
    let shadowColor = '#000000';
    let iconColor = '#3B82F6';
    
    // Dynamic styling based on variant
    if (variant === 'achievement') {
      backgroundColor = '#FEF3C7';
      borderColor = '#F59E0B';
      shadowColor = '#D97706';
      iconColor = '#F59E0B';
    } else if (variant === 'celebration') {
      backgroundColor = '#F0FDF4';
      borderColor = '#FBBF24';
      shadowColor = '#F59E0B';
      iconColor = '#FBBF24';
    }
    
    return {
      backgroundColor,
      borderColor,
      shadowColor: {
        shadowColor,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
      transform: [{ scale: scaleValue }],
      borderRadius: 12,
      padding: 20,
      marginVertical: 12,
      borderWidth: 2,
    };
  };
  
  const getIconName = (): string => {
    if (variant === 'achievement') return 'trophy';
    if (variant === 'celebration') return 'star';
    return 'pill';
  };
  
  const getMotivationalMessage = (): string[] => {
    const messages = [
      "¡Excelente! Mantienes una racha de " + (medication.streak || 0) + " días.",
      "¡Sigue así! Tu dedicación está dando resultados.",
      "¡Cada día es una nueva oportunidad!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  return (
    <Animated.View style={getCardStyle()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Ionicons 
                name={getIconName()} 
                size={24} 
                color={iconColor} 
              />
              <View>
                <Text className="text-lg font-bold text-gray-900 mb-1">{medication.name}</Text>
                <Text className="text-gray-600 mb-1">{medication.dosage}</Text>
                {medication.time && (
                  <Text className="text-gray-600 mb-1">Próxima: {medication.time}</Text>
                )}
              </View>
            </View>
          </View>
            
          <View className="flex-row items-center">
            {variant === 'medication' && !medication.taken && (
              <TouchableOpacity 
                className="px-4 py-2 rounded-full bg-green-500 shadow-sm"
                onPress={() => {/* Mark as taken */}}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
              
            {variant === 'achievement' && (
              <View className="flex-row items-center">
                <View className="bg-yellow-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-yellow-800 font-bold text-sm">Nivel {medication.level || 1}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-1">Racha: {medication.streak || 0} días</Text>
                    <Text className="text-gray-600 text-sm mb-1">Puntos: {medication.points || 0}</Text>
                </View>
              </View>
            )}
              
            {variant === 'celebration' && (
              <View className="flex-row items-center">
                <Animated.View 
                  style={{
                    transform: [{ scale: celebrateAnimation }],
                    opacity: celebrateAnimation,
                  }}
                >
                  <Ionicons name="star" size={32} color="#FBBF24" />
                </Animated.View>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};