import { Stack, Link } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignInWithOauth from '~/components/SignInWithOauth';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 justify-end p-6">
          <SignInWithOauth />
        </View>
      </SafeAreaView>
    </>
  );
}
