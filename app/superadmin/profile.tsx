import { useState } from "react";
import { Text, View } from "react-native";

import SuperAdminLayout from "../../src/components/layout/SuperAdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { logout } from "../../src/lib/auth";

export default function SuperAdminProfile() {

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
  if (loggingOut) return;

  setLoggingOut(true);

  try {
    await logout();
  } catch (error) {
    console.log(error);
    setLoggingOut(false);
  }
}

  return (
    <SuperAdminLayout title="Perfil">
      <AppCard>
        <SectionTitle
          title="Superadministrador"
          subtitle="Gestión global del sistema"
        />

        <View className="bg-slate-50 rounded-2xl p-4 mb-6">
          <Text className="text-gray-700">
            Esta cuenta puede crear ciudades, centros y administradores.
          </Text>
        </View>

        <AppButton
          title={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          disabled={loggingOut}
          onPress={handleLogout}
        />
      </AppCard>
    </SuperAdminLayout>
  );
}