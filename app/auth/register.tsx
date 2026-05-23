import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    if (!selectedCiudad || !selectedCentro) {
      console.log("Debes seleccionar ciudad y centro");
      return;
    }

    if (!email || !password || !fullName) {
      console.log("Faltan campos obligatorios");
      return;
    }

    if (password !== passwordCheck) {
      console.log("Las contraseñas no coinciden");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.log("Error registro:", authError?.message);
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

    const { error: userError } = await supabase.from("usuarios").insert({
      id_usuario: authData.user.id,
      nombre_apellidos: fullName,
      correo_electronico: email,
      id_rol: rol?.id_rol,
      id_estado_cuenta: estado?.id_estado_cuenta,
      id_ciudad: selectedCiudad.id_ciudad,
      id_centro: selectedCentro.id_centro,
    });

    if (userError) {
      console.log("Error usuario:", userError.message);
      return;
    }

    const { error: athleteError } = await supabase.from("deportistas").insert({
      id_usuario: authData.user.id,
    });

    if (athleteError) {
      console.log("Error deportista:", athleteError.message);
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