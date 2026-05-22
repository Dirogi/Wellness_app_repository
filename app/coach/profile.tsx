import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

export default function CoachProfileScreen() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    email: "entrenador@email.com",
    center: "Centro Alto Rendimiento Madrid",
    role: "Entrenador",
  });

  function updateField(key: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <CoachLayout title="Mi perfil">
      <AppCard className="mb-6">
        <View className="flex-row justify-between items-center mb-5">
          <SectionTitle title="Datos personales" />

          <TouchableOpacity
            onPress={() => setEditing(!editing)}
            className="bg-blue-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-semibold">
              {editing ? "Guardar" : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-6">
          <Text className="text-6xl">👤</Text>

          <Text className="font-bold text-xl mt-3 text-center">
            Entrenador Apellido1 Apellido2
          </Text>

          <Text className="text-gray-500">Entrenador</Text>
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
        <SectionTitle title="Eliminar cuenta" />

        <Text className="text-gray-500 mb-4">
          Esta acción deberá ser gestionada por un administrador del sistema.
        </Text>

        <AppButton
          title="Solicitar eliminación"
          variant="danger"
          onPress={() => console.log("Solicitar eliminación")}
        />
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
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3"
        />
      ) : (
        <View className="bg-slate-50 rounded-2xl p-4">
          <Text className="text-gray-700">{value}</Text>
        </View>
      )}
    </View>
  );
}