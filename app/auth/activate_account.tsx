import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";

export default function ActivateAccountScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

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
          onPress={() => console.log("Activar cuenta")}
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