import React, { useState, useEffect } from 'react';
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loader } from '~/lib/icons/Loader';
import { Text } from '~/components/ui/text';
import { AntDesign } from '@expo/vector-icons';
import { View } from 'react-native';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '132318484622-fp2skre0um17cvgr1u77erefn87oc4mp.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export default function SignInWithOauth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing user on component mount
  useEffect(() => {
    checkForExistingUser();
  }, []);

  const checkForExistingUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error reading user from storage:', error);
    }
  };

  const saveUserToStorage = async (userData) => {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
      throw error;
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userData = {
          id: response.data.user.id,
          username: response.data.user.name,
          image: response.data.user.photo,
          email: response.data.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_synced: false,
        };

        // Save to state and storage
        await saveUserToStorage(userData);
        setCurrentUser(userData);

        // Navigate or perform additional actions
        router.push('/(tabs)'); // Or wherever you want to navigate after sign in
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign in is already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Google Play Services is not available';
            break;
          default:
            errorMessage = error.message || 'Sign in failed';
        }
      }

      setError(errorMessage);
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('currentUser');
      setCurrentUser(null);
      router.push('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!currentUser ? (
        <Button
          onPress={signIn}
          disabled={isLoading}
          className="w-full flex-row items-center justify-center gap-2">
          {isLoading ? (
            <View className="flex flex-row gap-2 ">
              <Loader size={18} className=" text-primary-foreground" />
              <Text className="text-primary-foreground">Loading</Text>
            </View>
          ) : (
            <View className="flex flex-row gap-2 ">
              <AntDesign name="google" size={18} color={'white'} />
              <Text className="text-primary-foreground">Sign in with Google</Text>
            </View>
          )}
        </Button>
      ) : (
        <Button
          onPress={signOut}
          variant="outline"
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl">
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Text>Sign Out</Text>}
        </Button>
      )}

      {error && <Text className="mt-2 text-sm text-destructive">{error}</Text>}
    </>
  );
}
