import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../src/lib/supabase";

export default function Index() {
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    const session = data.session;

    if (!session) {
      router.replace("/auth/login");
      return;
    }

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select(`
        id_usuario,
        roles(nombre_rol)
      `)
      .eq("id_usuario", session.user.id)
      .single();

    if (error || !usuario) {
      router.replace("/auth/login");
      return;
    }

    const roleData = Array.isArray(usuario.roles)
      ? usuario.roles[0]
      : usuario.roles;

    const rol = roleData?.nombre_rol;

    if (rol === "deportista") {
      router.replace("/athlete/dashboard");
    } else if (rol === "entrenador") {
      router.replace("/coach/dashboard");
    } else if (rol === "staff_medico") {
      router.replace("/medical-staff/dashboard");
    } else if (rol === "admin") {
      router.replace("/admin/dashboard");
    } else if (rol === "superadmin") {
      router.replace("/superadmin/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" />
    </View>
  );
}
