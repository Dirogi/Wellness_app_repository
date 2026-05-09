import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="athlete/dashboard" />
        <Stack.Screen name="coach/dashboard" />
        <Stack.Screen name="medical/dashboard" />
        <Stack.Screen name="admin/dashboard" />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}
