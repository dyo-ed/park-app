import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [login, setLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  const checkLoginStatus = useCallback(async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) {
        router.replace('/(tabs)/detect'); // redirect logged-in users
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }, [router]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // Handle login or signup
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter a valid email and password');
    }

    if (!login && password !== repeatPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    setLoading(true);

    try {
      // Simulate login/signup API
      // For demo, we just store the email in AsyncStorage
      await AsyncStorage.setItem('userEmail', email);

      // Redirect to detect screen
      router.replace('/(tabs)/detect');
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.subtitle}>Welcome to ParkAlert</Text>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {!login && (
          <TextInput
            style={styles.input}
            placeholder="Repeat Password"
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry
          />
        )}
        <Text>
          {login ? "Don't have an account? " : 'Already have an account? '}
          <Text
            style={{ color: 'blue' }}
            onPress={() => setLogin(!login)}
          >
            {login ? 'Sign Up' : 'Login'}
          </Text>
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Please wait...' : login ? 'Login' : 'Sign Up'}
          onPress={handleAuth}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(40, 76, 197, 0.1)',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    width: '100%',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    alignSelf: 'center',
    overflow: 'hidden',
    transform: [{ translateY: -40 }],
  },
});
