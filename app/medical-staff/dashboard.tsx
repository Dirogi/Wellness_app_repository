import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type AthleteSummary = {
  id_deportista: number;
  name: string;
  discomfort?: {
    type: string;
    intensity: number;
  };
  hrv?: number;
  restingHr?: number;
};

export default function MedicalStaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) return;

    const { data: worker, error: workerError } = await supabase
      .from("trabajadores")
      .select("id_trabajador")
      .eq("id_usuario", userId)
      .single();

    if (workerError || !worker) {
      console.log("Error obteniendo staff médico:", workerError?.message);
      return;
    }

    const { data, error } = await supabase
      .from("asignaciones")
      .select(`
        id_deportista,
        deportistas(
          id_deportista,
          usuarios(
            nombre_apellidos
          ),
          registros_diarios(
            fecha,
            frecuencias_cardiacas(
              hrv,
              fc_reposo
            ),
            molestias(
              dolor,
              intensidad,
              tipo_molestia
            )
          )
        )
      `)
      .eq("id_trabajador", worker.id_trabajador)
      .eq("active", true);

    if (error) {
      console.log("Error cargando dashboard staff:", error.message);
      return;
    }

    const formatted =
      data?.map((item: any) => {
        const deportista = first(item.deportistas);
        const usuario = first(deportista?.usuarios);

        const registros = (deportista?.registros_diarios || []).sort(
          (a: any, b: any) => b.fecha.localeCompare(a.fecha)
        );

        const latestHeart = registros
          .map((registro: any) => first(registro.frecuencias_cardiacas))
          .find(Boolean);

        const latestDiscomfort = registros
          .map((registro: any) => first(registro.molestias))
          .find((molestia: any) => molestia?.dolor);

        return {
          id_deportista: deportista?.id_deportista,
          name: usuario?.nombre_apellidos || "Deportista",
          hrv: latestHeart?.hrv,
          restingHr: latestHeart?.fc_reposo,
          discomfort: latestDiscomfort
            ? {
                type: latestDiscomfort.tipo_molestia || "Molestia",
                intensity: latestDiscomfort.intensidad || 0,
              }
            : undefined,
        };
      }) || [];

    setAthletes(formatted);
    setLoading(false);
  }

  const athletesWithDiscomfort = athletes.filter((athlete) => athlete.discomfort);
  const hrvAlerts = athletes.filter((athlete) => (athlete.hrv || 0) >= 80);
  const restingHrAlerts = athletes.filter((athlete) => (athlete.restingHr || 0) >= 60);

  if (loading) {
    return (
      <MedicalStaffLayout title="Dashboard">
        <Text className="text-gray-500">Cargando dashboard...</Text>
      </MedicalStaffLayout>
    );
  }

  return (
    <MedicalStaffLayout title="Dashboard">
      <Text className="text-gray-500 mb-6">
        ¡Bienvenido/a, Staff médico!
      </Text>

      <View className="mb-6">
        <MetricCard
          title="Deportistas asignados"
          value={athletes.length}
          subtitle="Activos"
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Deportistas con molestias"
          subtitle="Molestias registradas recientemente"
        />

        <View className="gap-3">
          {athletesWithDiscomfort.length > 0 ? (
            athletesWithDiscomfort.map((athlete) => (
              <View
                key={athlete.id_deportista}
                className="bg-slate-50 rounded-2xl p-4"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-bold text-gray-900">
                    {athlete.name}
                  </Text>

                  <View className="bg-amber-100 rounded-full px-3 py-1">
                    <Text className="text-amber-700 text-xs font-bold">
                      {athlete.discomfort?.intensity}/10
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-500">
                  Molestia: {athlete.discomfort?.type}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay deportistas con molestias registradas.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Alertas de HRV alta"
          subtitle="Valores destacados en la última medición"
        />

        <View className="gap-3">
          {hrvAlerts.length > 0 ? (
            hrvAlerts.map((alert) => (
              <View
                key={alert.id_deportista}
                className="bg-yellow-50 rounded-2xl p-4 flex-row justify-between items-center"
              >
                <Text className="font-bold text-yellow-700">
                  {alert.name}
                </Text>

                <Text className="font-bold text-yellow-700">
                  {alert.hrv} ms
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay alertas de HRV actualmente.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas de FC en reposo"
          subtitle="Valores superiores al rango esperado"
        />

        <View className="gap-3">
          {restingHrAlerts.length > 0 ? (
            restingHrAlerts.map((alert) => (
              <View
                key={alert.id_deportista}
                className="bg-red-50 rounded-2xl p-4 flex-row justify-between items-center"
              >
                <Text className="font-bold text-red-700">
                  {alert.name}
                </Text>

                <Text className="font-bold text-red-700">
                  {alert.restingHr} bpm
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay alertas de FC en reposo actualmente.
            </Text>
          )}
        </View>
      </AppCard>
    </MedicalStaffLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}