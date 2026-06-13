import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type Ciudad = {
  id_ciudad: number;
  nombre_ciudad: string;
};

type Centro = {
  id_centro: number;
  id_ciudad: number;
  nombre_centro: string;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [selectedCiudad, setSelectedCiudad] = useState<Ciudad | null>(null);
  const [selectedCentro, setSelectedCentro] = useState<Centro | null>(null);
  const [showCiudades, setShowCiudades] = useState(false);
  const [showCentros, setShowCentros] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  useEffect(() => {
    async function fetchCiudades() {
      const { data, error } = await supabase
        .from("ciudades")
        .select("id_ciudad, nombre_ciudad")
        .order("nombre_ciudad");

      if (error) {
        console.log("Error cargando ciudades:", error.message);
        return;
      }

      setCiudades(data || []);
    }

    fetchCiudades();
  }, []);

  useEffect(() => {
    async function fetchCentros() {
      if (!selectedCiudad) {
        setCentros([]);
        setSelectedCentro(null);
        return;
      }

      const { data, error } = await supabase
        .from("centros")
        .select("id_centro, id_ciudad, nombre_centro")
        .eq("id_ciudad", selectedCiudad.id_ciudad)
        .order("nombre_centro");

      if (error) {
        console.log("Error cargando centros:", error.message);
        return;
      }

      setCentros(data || []);
      setSelectedCentro(null);
    }

    fetchCentros();
  }, [selectedCiudad]);

  async function handleRegister() {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedName = fullName.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanedName || !normalizedEmail || !password || !passwordCheck) {
      Alert.alert(
        "Campos obligatorios",
        "Completa nombre, correo y contraseña."
      );
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert(
        "Correo no válido",
        "Introduce un correo electrónico válido."
      );
      return;
    }

    if (!selectedCiudad || !selectedCentro) {
      Alert.alert(
        "Centro obligatorio",
        "Selecciona tu ciudad y centro."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña demasiado corta",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== passwordCheck) {
      Alert.alert(
        "Contraseñas distintas",
        "Las contraseñas no coinciden."
      );
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      Alert.alert(
        "Error de registro",
        "No se ha podido crear la cuenta."
      );
      return;
    }

    const { data: rol } = await supabase
      .from("roles")
      .select("id_rol")
      .eq("nombre_rol", "deportista")
      .single();

    const { data: estado } = await supabase
      .from("estados_cuenta")
      .select("id_estado_cuenta")
      .eq("nombre_estado", "activa")
      .single();

    if (!rol || !estado) {
      Alert.alert(
        "Error",
        "No se ha podido completar el registro."
      );
      return;
    }

    const { error: userError } = await supabase.from("usuarios").insert({
      id_usuario: authData.user.id,
      nombre_apellidos: cleanedName,
      correo_electronico: normalizedEmail,
      id_rol: rol.id_rol,
      id_estado_cuenta: estado.id_estado_cuenta,
      id_ciudad: selectedCiudad.id_ciudad,
      id_centro: selectedCentro.id_centro,
    });

    if (userError) {
      Alert.alert(
        "Error",
        "No se ha podido guardar el usuario."
      );
      return;
    }

    const { error: athleteError } = await supabase.from("deportistas").insert({
      id_usuario: authData.user.id,
    });

    if (athleteError) {
      Alert.alert(
        "Error",
        "No se ha podido crear el perfil de deportista."
      );
      return;
    }

    router.replace("/athlete/dashboard");
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
          onChangeText={(value) => setFullName(value.slice(0, 100))}
          placeholder="Introduce tu nombre completo"
          maxLength={100}
        />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={(value) => setEmail(value.slice(0, 100))}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
        />

        <SelectBox
          label="Ciudad"
          value={selectedCiudad?.nombre_ciudad || ""}
          placeholder="Selecciona tu ciudad"
          open={showCiudades}
          onToggle={() => setShowCiudades(!showCiudades)}
          options={ciudades.map((ciudad) => ({
            label: ciudad.nombre_ciudad,
            onPress: () => {
              setSelectedCiudad(ciudad);
              setShowCiudades(false);
            },
          }))}
        />

        <SelectBox
          label="Centro"
          value={selectedCentro?.nombre_centro || ""}
          placeholder={
            selectedCiudad ? "Selecciona tu centro" : "Selecciona primero una ciudad"
          }
          disabled={!selectedCiudad}
          open={showCentros}
          onToggle={() => {
            if (selectedCiudad) setShowCentros(!showCentros);
          }}
          options={centros.map((centro) => ({
            label: centro.nombre_centro,
            onPress: () => {
              setSelectedCentro(centro);
              setShowCentros(false);
            },
          }))}
        />

        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={(value) => setPassword(value.slice(0, 100))}
          placeholder="Introduce tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
        />

        <AppInput
          label="Confirmar contraseña"
          value={passwordCheck}
          onChangeText={(value) => setPasswordCheck(value.slice(0, 100))}
          placeholder="Repite tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
        />

        <AppButton
          title="Registrarse"
          onPress={handleRegister}
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

function SelectBox({
  label,
  value,
  placeholder,
  open,
  onToggle,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  options: { label: string; onPress: () => void }[];
  disabled?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        className={`h-12 border rounded-2xl px-4 justify-center ${
          disabled
            ? "bg-gray-100 border-gray-200"
            : "bg-white border-gray-200"
        }`}
      >
        <Text className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </Text>
      </Pressable>

      {open && !disabled && (
        <View className="bg-white border border-gray-100 rounded-2xl mt-2 overflow-hidden">
          {options.map((option) => (
            <Pressable
              key={option.label}
              onPress={option.onPress}
              className="px-4 py-3 border-b border-gray-100"
            >
              <Text className="text-gray-700">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}