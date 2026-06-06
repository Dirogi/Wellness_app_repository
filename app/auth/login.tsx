import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.log("Error login:", error?.message);
      return;
    }

    const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select(`
      id_usuario,
      nombre_apellidos,
      id_estado_cuenta,
      roles(
        nombre_rol
      )
    `)
    .eq("id_usuario", data.user.id)
    .single();

    if (userError || !usuario) {
      console.log(userError?.message);
      return;
    }

    if (usuario.id_estado_cuenta !== 2) {
      await supabase.auth.signOut();

      Alert.alert(
        "Cuenta no disponible",
        "Esta cuenta no está activa. Contacta con el administrador."
      );

      return;
    }

    const rol = (usuario.roles as any)?.nombre_rol;

    if (rol === "deportista") {
      router.replace("/athlete/dashboard");
    } else if (rol === "entrenador") {
      router.replace("/coach/dashboard");
    } else if (rol === "staff_medico") {
      router.replace("/medical-staff/dashboard");
    } else if (rol === "admin") {
      router.replace("/admin/dashboard");
    } else if (rol === "superadmin") {
      router.replace("/superadmin/dashboard" as never);
    }
  }

  return (
    <View className="flex-1 justify-center bg-slate-50 px-6">
      <Text className="text-4xl font-bold text-blue-600 text-center mb-2">
        Wellness App
      </Text>

      <Text className="text-gray-500 text-center mb-10">
        Monitoriza tu bienestar y rendimiento
      </Text>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <SectionTitle
          title="Iniciar sesión"
          subtitle="Accede a tu cuenta para continuar"
        />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
        />

        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Introduce tu contraseña"
          secureTextEntry
        />

        <AppButton title="Entrar" onPress={handleLogin} />

        <Pressable onPress={() => router.push("/auth/register")}>
          <Text className="text-center text-sm text-gray-500 mt-5">
            ¿No tienes cuenta?{" "}
            <Text className="text-blue-600 font-semibold">Regístrate aquí</Text>
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/auth/activate_account")}>
          <Text className="text-center text-sm text-gray-500 mt-5">
            ¿Eres trabajador?{" "}
            <Text className="text-blue-600 font-semibold">Activa tu cuenta</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}