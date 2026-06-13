import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import AdminLayout from "../../src/components/layout/AdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type AdminData = {
  id_ciudad: number;
  id_centro: number;
};

export default function PreRegisterWorker() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"entrenador" | "staff_medico">(
    "entrenador"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("id_ciudad, id_centro")
      .eq("id_usuario", user.id)
      .single();

    if (error || !data) {
      console.log("Error cargando admin:", error?.message);
      return;
    }

    setAdminData(data);
  }

  async function handlePreRegister() {
    if (saving) return;

    const cleanedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!adminData) {
      Alert.alert(
        "Error",
        "No se han podido obtener los datos del administrador."
      );
      return;
    }

    if (!cleanedName || !normalizedEmail) {
      Alert.alert(
        "Campos incompletos",
        "Introduce nombre y correo electrónico."
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

    setSaving(true);

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id_rol")
      .eq("nombre_rol", selectedRole)
      .single();

    if (roleError || !roleData) {
      Alert.alert(
        "Error",
        "No se ha podido obtener el rol seleccionado."
      );
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("trabajadores_pre_registro")
      .insert({
        nombre_apellidos: cleanedName,
        correo_electronico: normalizedEmail,
        id_rol: roleData.id_rol,
        id_ciudad: adminData.id_ciudad,
        id_centro: adminData.id_centro,
        id_estado_cuenta: 1,
      });

    if (error) {
      console.log("Error pre-registro:", error.message);

      Alert.alert(
        "Error",
        error.message
      );

      setSaving(false);
      return;
    }

    Alert.alert(
      "Trabajador pre-registrado",
      "El trabajador ya puede activar su cuenta desde la pantalla de activación."
    );

    setName("");
    setEmail("");
    setSelectedRole("entrenador");
    setSaving(false);
  }

  return (
    <AdminLayout title="Nuevo trabajador">
      <Text className="text-gray-500 mb-6">
        Pre-registra trabajadores de tu centro para que puedan configurar sus credenciales.
      </Text>

      <AppCard>
        <SectionTitle
          title="Datos del trabajador"
          subtitle="Introduce la información inicial de la cuenta"
        />

        <AppInput
          label="Nombre y apellidos"
          value={name}
          onChangeText={(value) => setName(value.slice(0, 100))}
          placeholder="Ej. Diego Gastón"
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

        <Text className="text-gray-700 font-semibold mb-2">
          Rol
        </Text>

        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => setSelectedRole("entrenador")}
            className={`flex-1 rounded-2xl p-3 items-center ${
              selectedRole === "entrenador"
                ? "bg-blue-100"
                : "bg-slate-100"
            }`}
          >
            <Text
              className={`font-bold ${
                selectedRole === "entrenador"
                  ? "text-blue-700"
                  : "text-gray-600"
              }`}
            >
              Entrenador
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedRole("staff_medico")}
            className={`flex-1 rounded-2xl p-3 items-center ${
              selectedRole === "staff_medico"
                ? "bg-blue-100"
                : "bg-slate-100"
            }`}
          >
            <Text
              className={`font-bold ${
                selectedRole === "staff_medico"
                  ? "text-blue-700"
                  : "text-gray-600"
              }`}
            >
              Staff médico
            </Text>
          </Pressable>
        </View>

        <AppButton
          title={saving ? "Pre-registrando..." : "Pre-registrar trabajador"}
          disabled={saving}
          onPress={handlePreRegister}
        />
      </AppCard>
    </AdminLayout>
  );
}