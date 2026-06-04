import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { supabase } from "../../src/lib/supabase";

import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";

export default function ActivateAccountScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  async function handleActivateAccount() {
    if (!email || !password || !passwordCheck) {
      Alert.alert(
        "Campos incompletos",
        "Completa todos los campos."
      );
      return;
    }

    if (password !== passwordCheck) {
      Alert.alert(
        "Contraseñas diferentes",
        "Las contraseñas no coinciden."
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: preUser, error: preUserError } = await supabase
      .from("trabajadores_pre_registro")
      .select(`
        id_pre_registro,
        id_estado_cuenta,
        roles(
          nombre_rol
        )
      `)
      .eq("correo_electronico", normalizedEmail)
      .single();

    if (preUserError || !preUser) {
      console.log("Error buscando pre-registro:", preUserError?.message);
      console.log("Pre-registro encontrado:", preUser);

      Alert.alert(
        "Cuenta no encontrada",
        "No existe ninguna cuenta pendiente asociada a este correo."
      );
      return;
    }

    const rol = (preUser.roles as any)?.nombre_rol;

    if (rol !== "entrenador" && rol !== "staff_medico") {
      Alert.alert(
        "Cuenta no válida",
        "Solo los trabajadores pueden activar cuentas desde esta pantalla."
      );
      return;
    }

    if (preUser.id_estado_cuenta !== 1) {
      Alert.alert(
        "Cuenta no disponible",
        "Esta cuenta ya ha sido configurada o no está pendiente de activación."
      );
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

    if (authError || !authData.user) {
      Alert.alert(
        "Error",
        authError?.message || "No se ha podido crear la cuenta."
      );
      return;
    }

    const { error: activationError } = await supabase.rpc(
      "activar_trabajador_pre_registrado",
      {
        p_correo: normalizedEmail,
        p_id_usuario: authData.user.id,
      }
    );

    if (activationError) {
      console.log("Error activando trabajador:", activationError.message);

      Alert.alert(
        "Error",
        activationError.message
      );
      return;
    }

    Alert.alert(
      "Solicitud enviada",
      "Tu cuenta ha sido configurada correctamente. Ahora debe ser aprobada por el administrador antes de poder iniciar sesión."
    );

    router.replace("/auth/login");
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 90,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-4xl font-bold text-blue-600 text-center mb-2">
        Wellness App
      </Text>

      <Text className="text-gray-500 text-center mb-10">
        Activación de cuenta de trabajador
      </Text>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <SectionTitle
          title="Activar cuenta"
          subtitle="Crea tu contraseña para acceder a la aplicación"
        />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
        />

        <AppInput
          label="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Introduce tu nueva contraseña"
          secureTextEntry
        />

        <AppInput
          label="Confirmar contraseña"
          value={passwordCheck}
          onChangeText={setPasswordCheck}
          placeholder="Repite tu contraseña"
          secureTextEntry
        />

        <AppButton
          title="Activar cuenta"
          onPress={handleActivateAccount}
        />

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text className="text-center text-sm text-gray-500 mt-5">
            ¿Ya tienes tu cuenta activa?{" "}
            <Text className="text-blue-600 font-semibold">
              Inicia sesión
            </Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}