import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  const segments = useSegments();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    protectRoutes();
  }, [segments]);

  async function protectRoutes() {
    const currentGroup = segments[0];

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      if (currentGroup !== "auth") {
        router.replace("/auth/login");
      }

      setCheckingAuth(false);
      return;
    }

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select(`
        id_estado_cuenta,
        roles(nombre_rol)
      `)
      .eq("id_usuario", session.user.id)
      .single();

    if (error || !usuario || usuario.id_estado_cuenta !== 2) {
      await supabase.auth.signOut();
      router.replace("/auth/login");
      setCheckingAuth(false);
      return;
    }

    const roleData = Array.isArray(usuario.roles)
      ? usuario.roles[0]
      : usuario.roles;

    const rol = roleData?.nombre_rol;

    const allowedGroupByRole: Record<string, string> = {
      deportista: "athlete",
      entrenador: "coach",
      staff_medico: "medical-staff",
      admin: "admin",
      superadmin: "superadmin",
    };

    const allowedGroup = rol ? allowedGroupByRole[rol] : null;

    if (!allowedGroup) {
      await supabase.auth.signOut();
      router.replace("/auth/login");
      setCheckingAuth(false);
      return;
    }

    if (currentGroup === "auth") {
      router.replace(`/${allowedGroup}/dashboard` as never);
      setCheckingAuth(false);
      return;
    }

    if (currentGroup && currentGroup !== allowedGroup) {
      router.replace(`/${allowedGroup}/dashboard` as never);
      setCheckingAuth(false);
      return;
    }

    setCheckingAuth(false);
  }

  if (checkingAuth) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" />
        </View>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}