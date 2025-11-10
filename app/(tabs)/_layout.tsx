import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Button } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userId');

      router.replace('/');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to logout: ' + err.message);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <Button title="Logout" onPress={handleLogout} />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: '#fff',
          borderRadius: 25,
          height: 60,
          elevation: 5, // Android shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5, // iOS shadow
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen name="detect" options={{ title: 'Park Alert' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>

  );
}