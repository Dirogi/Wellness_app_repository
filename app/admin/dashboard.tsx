import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import AdminLayout from "../../src/components/layout/AdminLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    pendingWorkers: 0,
    activeWorkers: 0,
    activeAthletes: 0,
    blockedAccounts: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from("usuarios")
      .select("id_centro")
      .eq("id_usuario", user.id)
      .single();

    if (adminError || !adminData) {
      console.log("Error obteniendo admin:", adminError?.message);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id_usuario,
        id_estado_cuenta,
        id_centro,
        roles(
          nombre_rol
        )
      `)
      .eq("id_centro", adminData.id_centro);

    if (error) {
      console.log("Error cargando dashboard admin:", error.message);
      setLoading(false);
      return;
    }

    const users = data || [];

    const pendingWorkers = users.filter((user: any) => {
      const rol = (user.roles as any)?.nombre_rol;

      return (
        user.id_estado_cuenta === 4 &&
        (rol === "entrenador" || rol === "staff_medico")
      );
    }).length;

    const activeWorkers = users.filter((user: any) => {
      const rol = (user.roles as any)?.nombre_rol;

      return (
        user.id_estado_cuenta === 2 &&
        (rol === "entrenador" || rol === "staff_medico")
      );
    }).length;

    const activeAthletes = users.filter((user: any) => {
      const rol = (user.roles as any)?.nombre_rol;

      return (
        user.id_estado_cuenta === 2 &&
        rol === "deportista"
      );
    }).length;

    const blockedAccounts = users.filter(
      (user: any) => user.id_estado_cuenta === 3
    ).length;

    setStats({
      pendingWorkers,
      activeWorkers,
      activeAthletes,
      blockedAccounts,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <AdminLayout title="Admin">
        <Text className="text-gray-500">Cargando dashboard...</Text>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin. Dashboard">
      <Text className="text-gray-500 mb-6">
        Panel de administración general de usuarios y cuentas.
      </Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Pendientes"
          value={stats.pendingWorkers}
          subtitle="Trabajadores"
          subtitleVariant="violet"
        />

        <MetricCard
          title="Trabajadores"
          value={stats.activeWorkers}
          subtitle="Activos"
          subtitleVariant="indigo"
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Deportistas"
          value={stats.activeAthletes}
          subtitle="Activos"
          subtitleVariant="cyan"
        />

        <MetricCard
          title="Bloqueadas"
          value={stats.blockedAccounts}
          subtitle="Cuentas"
          subtitleVariant="fuchsia"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Solicitudes pendientes"
          subtitle="Trabajadores esperando activación"
        />

        {stats.pendingWorkers > 0 ? (
          <View className="bg-amber-50 rounded-2xl p-4">
            <Text className="text-amber-700 font-semibold">
              Hay {stats.pendingWorkers} trabajador
              {stats.pendingWorkers === 1 ? "" : "es"} pendiente
              {stats.pendingWorkers === 1 ? "" : "s"} de revisión.
            </Text>

            <Text className="text-amber-700 text-sm mt-1">
              Revisa las solicitudes para aprobar o rechazar el acceso.
            </Text>
          </View>
        ) : (
          <View className="bg-emerald-50 rounded-2xl p-4">
            <Text className="text-emerald-700 font-semibold">
              No hay solicitudes pendientes.
            </Text>

            <Text className="text-emerald-700 text-sm mt-1">
              Todos los trabajadores registrados han sido revisados.
            </Text>
          </View>
        )}
      </AppCard>

    </AdminLayout>
  );
}