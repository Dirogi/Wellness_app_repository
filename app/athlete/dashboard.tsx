import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type TrainingItem = {
  tipo_entrenamiento: string | null;
  duracion: number | null;
  intensidad_percibida: number | null;
  carga_de_entrenamiento: number | null;
};

export default function AthleteDashboard() {
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    name: "Usuario",
    totalLoad: 0,
    sleepHours: "-",
    hrv: "-",
    mood: "-",
    generalStatus: "-",
    restingHr: "-",
    sleepSubtitle: "Sin datos",
    loadSubtitle: "Sin datos",
    moodSubtitle: "Sin datos",
    hrvSubtitle: "Sin datos",
  });

  const [recentTrainings, setRecentTrainings] = useState<TrainingItem[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) return;

    const { data: userData } = await supabase
      .from("usuarios")
      .select("nombre_apellidos")
      .eq("id_usuario", userId)
      .single();

    const { data: athleteData } = await supabase
      .from("deportistas")
      .select("id_deportista")
      .eq("id_usuario", userId)
      .single();

    if (!athleteData) return;

    const { data: registers, error } = await supabase
      .from("registros_diarios")
      .select(`
        fecha,
        entrenamientos(
          tipo_entrenamiento,
          duracion,
          intensidad_percibida,
          carga_de_entrenamiento
        ),
        suenos(
          horas_de_sueno,
          calidad_sueno
        ),
        frecuencias_cardiacas(
          hrv,
          fc_reposo
        ),
        autopercepciones(
          motivacion,
          estres,
          irritabilidad,
          fatiga_general,
          nivel_energia
        ),
        molestias(
          dolor,
          intensidad,
          tipo_molestia
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .limit(7);

    if (error) {
      console.log("Error cargando dashboard:", error.message);
      return;
    }

    const rows = registers || [];

    const trainings = rows
      .map((r: any) => first(r.entrenamientos))
      .filter(Boolean);

    const sleeps = rows
      .map((r: any) => first(r.suenos))
      .filter(Boolean);

    const hearts = rows
      .map((r: any) => first(r.frecuencias_cardiacas))
      .filter(Boolean);

    const perceptions = rows
      .map((r: any) => first(r.autopercepciones))
      .filter(Boolean);

    const discomforts = rows
      .map((r: any) => first(r.molestias))
      .filter((m: any) => m?.dolor);

    const totalLoad = trainings.reduce(
      (sum: number, item: any) => sum + (item.carga_de_entrenamiento || 0),
      0
    );

    const latestSleep = sleeps[0];
    const latestHeart = hearts[0];
    const latestPerception = perceptions[0];

    const moodScore = latestPerception
      ? calculateMood(
          latestPerception.motivacion,
          latestPerception.estres,
          latestPerception.irritabilidad
        )
      : null;

    const generalStatus =
      moodScore && latestSleep?.horas_de_sueno
        ? Math.round((moodScore + Number(latestSleep.horas_de_sueno)) / 2)
        : moodScore || null;

    setSummary({
      name: userData?.nombre_apellidos || "Usuario",
      totalLoad,
      sleepHours: latestSleep?.horas_de_sueno
        ? `${latestSleep.horas_de_sueno} h`
        : "-",
      hrv: latestHeart?.hrv ? `${latestHeart.hrv} ms` : "-",
      restingHr: latestHeart?.fc_reposo ? `${latestHeart.fc_reposo} bpm` : "-",
      mood: moodScore ? `${moodScore}/10` : "-",
      generalStatus: generalStatus ? `${generalStatus}/10` : "-",
      loadSubtitle: totalLoad >= 600 ? "Alta" : totalLoad > 0 ? "Normal" : "Sin datos",
      sleepSubtitle:
        latestSleep?.horas_de_sueno >= 7
          ? "Bueno"
          : latestSleep
          ? "Mejorable"
          : "Sin datos",
      hrvSubtitle: latestHeart?.hrv ? "Normal" : "Sin datos",
      moodSubtitle: moodScore && moodScore >= 7 ? "Bueno" : moodScore ? "Mejorable" : "Sin datos",
    });

    setRecentTrainings(trainings.slice(0, 3));
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Dashboard">
        <Text className="text-gray-500">Cargando datos...</Text>
      </AthleteLayout>
    );
  }

  return (
    <AthleteLayout title="Dashboard">
      <Text className="text-gray-500 mb-6">
        ¡Bienvenido/a, {summary.name}!
      </Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Carga"
          value={`${summary.totalLoad} AU`}
          subtitle={summary.loadSubtitle}
          status={summary.totalLoad >= 600 ? "warning" : "normal"}
        />

        <MetricCard
          title="Sueño"
          value={summary.sleepHours}
          subtitle={summary.sleepSubtitle}
          status={summary.sleepSubtitle === "Bueno" ? "good" : "normal"}
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV"
          value={summary.hrv}
          subtitle={summary.hrvSubtitle}
          status="normal"
        />

        <MetricCard
          title="Ánimo"
          value={summary.mood}
          subtitle={summary.moodSubtitle}
          status={summary.moodSubtitle === "Bueno" ? "good" : "normal"}
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado general"
          subtitle="Resumen calculado a partir de sueño, fatiga, HRV y estado de ánimo"
        />

        <View className="items-center justify-center py-4">
          <Text className="text-5xl font-bold text-emerald-600">
            {summary.generalStatus}
          </Text>
          <Text className="text-gray-500 mt-2">
            Estado calculado con los últimos registros
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Tendencia de frecuencia cardiaca"
          subtitle="Últimos 7 días"
        />

        <View className="h-36 bg-blue-50 rounded-2xl items-center justify-center">
          <Text className="text-blue-600 font-semibold">
            Gráfico HRV / FC reposo
          </Text>
          <Text className="text-blue-500 text-sm mt-1">
            Pendiente de librería de gráficos
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle title="Tendencia de sueño" subtitle="Últimos 7 días" />

        <View className="h-36 bg-teal-50 rounded-2xl items-center justify-center">
          <Text className="text-teal-600 font-semibold">
            Gráfico de sueño
          </Text>
          <Text className="text-teal-500 text-sm mt-1">
            Pendiente de librería de gráficos
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Entrenamientos recientes"
          subtitle="Últimas sesiones registradas"
        />

        <View className="gap-3">
          {recentTrainings.length > 0 ? (
            recentTrainings.map((training, index) => (
              <View
                key={`${training.tipo_entrenamiento}-${index}`}
                className={`flex-row justify-between ${
                  index !== recentTrainings.length - 1
                    ? "border-b border-gray-100 pb-3"
                    : ""
                }`}
              >
                <View>
                  <Text className="font-semibold text-gray-900">
                    {training.tipo_entrenamiento || "Entrenamiento"}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {training.duracion || 0} min · RPE{" "}
                    {training.intensidad_percibida || "-"}
                  </Text>
                </View>

                <Text className="font-bold text-blue-600">
                  {training.carga_de_entrenamiento || 0} AU
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              Todavía no hay entrenamientos registrados.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas"
          subtitle="Indicadores destacados del día"
        />

        <View className="gap-3">
          {summary.totalLoad >= 600 && (
            <View className="bg-amber-50 rounded-2xl p-3">
              <Text className="text-amber-700 font-semibold">
                Carga de entrenamiento elevada
              </Text>
              <Text className="text-amber-700 text-sm mt-1">
                Se recomienda revisar la recuperación antes de aumentar la intensidad.
              </Text>
            </View>
          )}

          {summary.sleepSubtitle === "Bueno" && (
            <View className="bg-emerald-50 rounded-2xl p-3">
              <Text className="text-emerald-700 font-semibold">
                Sueño adecuado
              </Text>
              <Text className="text-emerald-700 text-sm mt-1">
                La duración del sueño se encuentra dentro de un rango positivo.
              </Text>
            </View>
          )}

          {summary.totalLoad < 600 && summary.sleepSubtitle !== "Bueno" && (
            <Text className="text-gray-500">
              No hay alertas destacadas por el momento.
            </Text>
          )}
        </View>
      </AppCard>
    </AthleteLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function calculateMood(motivation: number, stress: number, irritability: number) {
  const stressInv = 11 - stress;
  const irritabilityInv = 11 - irritability;

  return Math.round(
    0.4 * motivation + 0.35 * stressInv + 0.25 * irritabilityInv
  );
}