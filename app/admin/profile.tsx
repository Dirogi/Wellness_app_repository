import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import AdminLayout from "../../src/components/layout/AdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { logout } from "../../src/lib/auth";
import { supabase } from "../../src/lib/supabase";

type AdminData = {
  nombre_apellidos: string;
  correo_electronico: string;
};

export default function AdminProfile() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        nombre_apellidos,
        correo_electronico
      `)
      .eq("id_usuario", user.id)
      .single();

    if (error || !data) {
      console.log(error?.message);
      setLoading(false);
      return;
    }

    setAdminData(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <AdminLayout title="Perfil">
        <Text className="text-gray-500">Cargando perfil...</Text>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Perfil">
      <AppCard className="mb-6">
        <SectionTitle
          title="Administrador"
          subtitle="Información general de la cuenta"
        />

        <View className="gap-3">
          <View className="bg-slate-50 rounded-2xl p-4">
            <Text className="text-gray-500 text-sm">
              Nombre
            </Text>

            <Text className="text-gray-900 font-semibold mt-1">
              {adminData?.nombre_apellidos || "-"}
            </Text>
          </View>

          <View className="bg-slate-50 rounded-2xl p-4">
            <Text className="text-gray-500 text-sm">
              Correo electrónico
            </Text>

            <Text className="text-gray-900 font-semibold mt-1">
              {adminData?.correo_electronico || "-"}
            </Text>
          </View>

          <View className="bg-blue-50 rounded-2xl p-4">
            <Text className="text-blue-700 font-semibold">
              Rol administrador
            </Text>

            <Text className="text-blue-700 text-sm mt-1">
              Esta cuenta tiene permisos globales de gestión.
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppButton
          title="Cerrar sesión"
          onPress={logout}
        />
      </AppCard>
    </AdminLayout>
  );
}