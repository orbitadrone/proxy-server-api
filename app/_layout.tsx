import { Redirect, Stack } from 'expo-router';
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
    setInitializing(false); // Directly set to false since auth is mocked
  }, []);

  if (initializing) return null; // Show a loading splash screen

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}