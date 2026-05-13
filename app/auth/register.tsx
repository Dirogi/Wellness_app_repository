import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [center, setCenter] = useState("");
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
        Monitoriza tu bienestar y rendimiento
      </Text>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <SectionTitle
          title="Crear cuenta"
          subtitle="Regístrate como deportista"
        />

        <AppInput
          label="Nombre y apellidos"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Introduce tu nombre completo"
        />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
        />

        <AppInput
          label="Ciudad"
          value={city}
          onChangeText={setCity}
          placeholder="Selecciona tu ciudad"
        />

        <AppInput
          label="Centro"
          value={center}
          onChangeText={setCenter}
          placeholder="Selecciona tu centro"
        />

        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Introduce tu contraseña"
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
          title="Registrarse"
          onPress={() => console.log("Register")}
        />

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text className="text-center text-sm text-gray-500 mt-5">
            ¿Ya tienes cuenta?{" "}
            <Text className="text-blue-600 font-semibold">Inicia sesión</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}