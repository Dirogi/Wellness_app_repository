import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
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
  load: number;
};

export default function CoachDashboard() {
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
      console.log("Error obteniendo entrenador:", workerError?.message);
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
            entrenamientos(
              carga_de_entrenamiento
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
      console.log("Error cargando dashboard coach:", error.message);
      return;
    }

    const formatted =
      data?.map((item: any) => {
        const deportista = first(item.deportistas);
        const usuario = first(deportista?.usuarios);

        const registros = deportista?.registros_diarios || [];

        const totalLoad = registros.reduce((sum: number, registro: any) => {
          const training = first(registro.entrenamientos);
          return sum + (training?.carga_de_entrenamiento || 0);
        }, 0);

        const latestDiscomfort = registros
          .map((registro: any) => first(registro.molestias))
          .find((molestia: any) => molestia?.dolor);

        return {
          id_deportista: deportista?.id_deportista,
          name: usuario?.nombre_apellidos || "Deportista",
          load: totalLoad,
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
  const trainingLoadAlerts = athletes.filter((athlete) => athlete.load >= 600);

  if (loading) {
    return (
      <CoachLayout title="Dashboard">
        <Text className="text-gray-500">Cargando dashboard...</Text>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="Dashboard">
      <Text className="text-gray-500 mb-6">
        ¡Bienvenido/a, Entrenador!
      </Text>

      <View className="mb-6">
        <MetricCard
          title="Deportistas asignados"
          value={athletes.length}
          subtitle="Activos"
          subtitleVariant="fuchsia"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Deportistas con molestias"
          subtitle="Molestias registradas recientemente"
        />

        <View className="gap-3">
          {athletesWithDiscomfort.length > 0 ? (
            athletesWithDiscomfort.map((athlete) => {
              const intensity = athlete.discomfort?.intensity || 0;
              const intensityStyle = getIntensityColor(intensity);

              return (
                <View
                  key={athlete.id_deportista}
                  className="bg-slate-50 rounded-2xl p-4"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-bold text-gray-900">
                      {athlete.name}
                    </Text>

                    <View className={`${intensityStyle.bg} rounded-full px-3 py-1`}>
                      <Text className={`${intensityStyle.text} text-xs font-bold`}>
                        {intensity}/10
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-500">
                    Molestia: {athlete.discomfort?.type}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="text-gray-500">
              No hay deportistas con molestias registradas.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas de carga"
          subtitle="Deportistas con carga de entrenamiento elevada"
        />

        <View className="gap-3">
          {trainingLoadAlerts.length > 0 ? (
            trainingLoadAlerts.map((alert) => (
              <View
                key={alert.id_deportista}
                className="bg-red-50 rounded-2xl p-4 flex-row justify-between items-center"
              >
                <Text className="font-bold text-red-700">
                  {alert.name}
                </Text>

                <Text className="font-bold text-red-700">
                  {alert.load} AU
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay alertas de carga actualmente.
            </Text>
          )}
        </View>
      </AppCard>
    </CoachLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getIntensityColor(intensity: number) {
  if (intensity <= 4) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    };
  }

  if (intensity <= 7) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
    };
  }

  return {
    bg: "bg-red-100",
    text: "text-red-700",
  };
}