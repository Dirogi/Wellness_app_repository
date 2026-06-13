import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import CoachLayout from "../../src/components/layout/CoachLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { logout } from "../../src/lib/auth";
import { supabase } from "../../src/lib/supabase";

export default function CoachProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [idUsuario, setIdUsuario] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    center: "",
    role: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      Alert.alert("Error", "No se ha podido cargar el perfil.");
      return;
    }

    setIdUsuario(userId);

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id_usuario,
        nombre_apellidos,
        correo_electronico,
        centros(nombre_centro),
        trabajadores(
          tipos_trabajador(tipo)
        )
      `)
      .eq("id_usuario", userId)
      .single();

    if (error || !data) {
      console.log("Error cargando perfil coach:", error?.message);
      return;
    }

    const centro = Array.isArray(data.centros)
      ? data.centros[0]
      : data.centros;

    const trabajador = Array.isArray(data.trabajadores)
      ? data.trabajadores[0]
      : data.trabajadores;

    const tipoTrabajador = Array.isArray(trabajador?.tipos_trabajador)
      ? trabajador?.tipos_trabajador[0]
      : trabajador?.tipos_trabajador;

    setProfile({
      fullName: data.nombre_apellidos || "",
      email: data.correo_electronico || "",
      center: centro?.nombre_centro || "Sin centro asignado",
      role: tipoTrabajador?.tipo || "Entrenador",
    });
  }

  async function handleSave() {
    if (!idUsuario) return;

    const normalizedEmail = profile.email.trim().toLowerCase();

    if (!profile.email.trim()) {
      Alert.alert(
        "Correo obligatorio",
        "Introduce un correo electrónico."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert(
        "Correo no válido",
        "Introduce un correo electrónico válido."
      );
      return;
    }

    const { error } = await supabase
      .from("usuarios")
      .update({
        correo_electronico: profile.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id_usuario", idUsuario);

    if (error) {
      console.log("Error actualizando perfil coach:", error.message);
      return;
    }

    setEditing(false);
    console.log("Perfil coach actualizado correctamente");
  }

  function updateField(key: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleDeleteAccount() {
    if (!idUsuario) return;

    Alert.alert(
      "Eliminar cuenta",
      "Esta acción desactivará tu cuenta, eliminará tus asignaciones activas y cerrará la sesión. ¿Seguro que quieres continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error: asignacionesError } = await supabase.rpc(
                "desactivar_asignaciones_trabajador",
                {
                  p_id_usuario: idUsuario,
                }
              );

              if (asignacionesError) {
                Alert.alert(
                  "Error",
                  "No se han podido desactivar las asignaciones."
                );
                return;
              }

              const { error } = await supabase
                .from("usuarios")
                .update({
                  id_estado_cuenta: 3,
                })
                .eq("id_usuario", idUsuario);

              if (error) {
                Alert.alert(
                  "Error",
                  "No se ha podido eliminar la cuenta."
                );
                return;
              }

              await logout();
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Error",
                "Ha ocurrido un error inesperado."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <CoachLayout title="Mi perfil">
      <AppCard className="mb-6">
        <View className="flex-row justify-between items-center mb-5">
          <SectionTitle title="Datos personales" />

          <TouchableOpacity
            onPress={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            className="bg-blue-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-semibold">
              {editing ? "Guardar" : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-6">
           <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
           <Ionicons
              name="person-outline"
              size={50}
              color="#2563EB"
            />
        </View>

          <Text className="font-bold text-xl mt-3 text-center">
            {profile.fullName || "Entrenador"}
          </Text>

          <Text className="text-gray-500">
            {profile.role || "Entrenador"}
          </Text>
        </View>

        <ProfileField
          label="Correo electrónico"
          value={profile.email}
          editing={editing}
          keyboardType="email-address"
          onChange={(v: string) => updateField("email", v)}
        />

        <ProfileField
          label="Centro"
          value={profile.center}
          editing={false}
          onChange={() => {}}
        />

        <ProfileField
          label="Rol profesional"
          value={profile.role}
          editing={false}
          onChange={() => {}}
        />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle title="Privacidad y seguridad" />

        <View className="bg-slate-50 p-4 rounded-2xl">
          <Text className="font-bold text-gray-900 mb-2">
            Visibilidad de datos
          </Text>

          <Text className="text-gray-700 mb-1">
            • Solo puedes ver información de entrenamiento y molestias.
          </Text>

          <Text className="text-gray-700 mb-1">
            • No puedes consultar datos médicos sensibles.
          </Text>

          <Text className="text-gray-700">
            • Solo puedes acceder a deportistas asignados de tu centro.
          </Text>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="Cuenta" />

        <Text className="text-gray-500 mb-4">
          La eliminación de cuenta deberá ser gestionada por un administrador del sistema.
        </Text>

        <View className="gap-4">
          <AppButton
            title="Cerrar sesión"
            onPress={logout}
          />

          <AppButton
            title="Eliminar cuenta"
            variant="danger"
            onPress={handleDeleteAccount}
          />
        </View>
      </AppCard>
    </CoachLayout>
  );
}

function ProfileField({
  label,
  value,
  editing,
  onChange,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View className="mb-4">
      <Text className="font-semibold mb-2">{label}</Text>

      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          maxLength={100}
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3"
        />
      ) : (
        <View className="bg-slate-50 rounded-2xl p-4">
          <Text className="text-gray-700">
            {value || "Sin completar"}
          </Text>
        </View>
      )}
    </View>
  );
}