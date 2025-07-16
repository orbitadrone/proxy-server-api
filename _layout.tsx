import { Tabs } from "expo-router";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="(tabs)" options={{ headerShown: false }} />
      <Tabs.Screen name="map" options={{ title: "Mapa" }} />
    </Tabs>
  );
}