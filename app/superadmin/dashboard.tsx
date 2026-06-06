import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import SuperAdminLayout from "../../src/components/layout/SuperAdminLayout";
import MetricCard from "../../src/components/ui/MetricCard";
import { supabase } from "../../src/lib/supabase";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    cities: 0,
    centers: 0,
    activeAdmins: 0,
    blockedAdmins: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: citiesData, error: citiesError } = await supabase
      .from("ciudades")
      .select("id_ciudad")
      .eq("active", true);

    const { data: centersData, error: centersError } = await supabase
      .from("centros")
      .select("id_centro")
      .eq("active", true);

    const { data: usersData, error: usersError } = await supabase
      .from("usuarios")
      .select(`
        id_estado_cuenta,
        roles(
          nombre_rol
        )
      `);

    if (citiesError || centersError || usersError) {
      console.log("Error cargando dashboard superadmin:", {
        citiesError,
        centersError,
        usersError,
      });

      setLoading(false);
      return;
    }

    const admins =
      usersData?.filter((user: any) => {
        const rol = user.roles?.nombre_rol;
        return rol === "admin";
      }) || [];

    setStats({
      cities: citiesData?.length || 0,
      centers: centersData?.length || 0,
      activeAdmins: admins.filter((admin: any) => admin.id_estado_cuenta === 2)
        .length,
      blockedAdmins: admins.filter((admin: any) => admin.id_estado_cuenta === 3)
        .length,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Superadmin">
        <Text className="text-gray-500">
          Cargando dashboard...
        </Text>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Superadmin">
      <Text className="text-gray-500 mb-6">
        Panel global de gestión de ciudades, centros y administradores.
      </Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Ciudades"
          value={stats.cities}
          subtitle="Activas"
          subtitleVariant="violet"
        />

        <MetricCard
          title="Centros"
          value={stats.centers}
          subtitle="Activos"
          subtitleVariant="indigo"
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Admins"
          value={stats.activeAdmins}
          subtitle="Activos"
          subtitleVariant="cyan"
        />

        <MetricCard
          title="Admins"
          value={stats.blockedAdmins}
          subtitle="Bloqueados"
          subtitleVariant="fuchsia"
        />
      </View>
    </SuperAdminLayout>
  );
}