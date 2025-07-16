import { Redirect, Stack } from 'expo-router';
import '@/constants/firebaseConfig'; // Importa el archivo de configuración de Firebase
// import auth from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const [user, setUser] = useState({ uid: 'mock_user_id' }); // Mock user for now
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    // const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    // return subscriber; // unsubscribe on unmount
    setInitializing(false); // Directly set to false since auth is mocked
  }, []);

  if (initializing) return null; // Show a loading splash screen

  // if (!user) {
  //   return <Redirect href="/auth" />;
  // }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}