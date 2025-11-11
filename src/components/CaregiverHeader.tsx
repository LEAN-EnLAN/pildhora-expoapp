import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CaregiverHeaderProps {
  title: string;
  showScreenTitle: boolean;
  onLogout: () => void;
}

export default function CaregiverHeader({ title, showScreenTitle, onLogout }: CaregiverHeaderProps) {
  // This is a placeholder for the actual emergency logic
  const handleEmergency = () => console.log('Emergency pressed');

  return (
    <View style={{ paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 10 }} className="flex-row items-center justify-between bg-white px-4 border-b border-gray-200">
      <View>
        <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
        {showScreenTitle && (
          <Text className="text-lg text-blue-600 font-bold">{title}</Text>
        )}
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-red-500 items-center justify-center shadow-sm"
          onPress={handleEmergency}
        >
          <Ionicons name="alert" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center shadow-sm"
          onPress={onLogout}
        >
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
