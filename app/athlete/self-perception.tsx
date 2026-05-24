import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type SelfItem = {
  fecha: string;
  motivacion: number | null;
  estres: number | null;
  irritabilidad: number | null;
  fatiga_fisica: number | null;
  fatiga_mental: number | null;
  fatiga_general: number | null;
  sensacion_recuperacion: number | null;
  preparacion_entrenar: number | null;
  nivel_energia: number | null;
};

export default function SelfPerceptionScreen() {
  const [loading, setLoading] = useState(true);
  const [selfData, setSelfData] = useState<SelfItem[]>([]);

  useEffect(() => {
    loadSelfData();
  }, []);

  async function loadSelfData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) return;

    const { data: athleteData } = await supabase
      .from("deportistas")
      .select("id_deportista")
      .eq("id_usuario", userId)
      .single();

    if (!athleteData) return;

    const { data, error } = await supabase
      .from("registros_diarios")
      .select(`
        fecha,
        autopercepciones(
          motivacion,
          estres,
          irritabilidad,
          fatiga_fisica,
          fatiga_mental,
          fatiga_general,
          sensacion_recuperacion,
          preparacion_entrenar,
          nivel_energia
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .limit(7);

    if (error) {
      console.log("Error cargando autopercepción:", error.message);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const self = first(item.autopercepciones);
          if (!self) return null;

          return {
            fecha: item.fecha,
            motivacion: self.motivacion,
            estres: self.estres,
            irritabilidad: self.irritabilidad,
            fatiga_fisica: self.fatiga_fisica,
            fatiga_mental: self.fatiga_mental,
            fatiga_general: self.fatiga_general,
            sensacion_recuperacion: self.sensacion_recuperacion,
            preparacion_entrenar: self.preparacion_entrenar,
            nivel_energia: self.nivel_energia,
          };
        })
        .filter(Boolean) || [];

    setSelfData(formattedData as SelfItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Autopercepción">
        <Text className="text-gray-500">Cargando autopercepción...</Text>
      </AthleteLayout>
    );
  }

  const latest = selfData[0];
  const weeklyData = selfData.slice().reverse();

  const moodScore = latest
    ? calculateMood(
        latest.motivacion || 0,
        latest.estres || 0,
        latest.irritabilidad || 0
      )
    : 0;

  const fatigueScore = latest?.fatiga_general
    ? Math.round(latest.fatiga_general)
    : latest
    ? Math.round(((latest.fatiga_fisica || 0) + (latest.fatiga_mental || 0)) / 2)
    : 0;

  return (
    <AthleteLayout title="Autopercepción">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Estado de ánimo"
          value={latest ? `${moodScore}/10` : "-"}
          subtitle="Actual"
          status="normal"
        />

        <MetricCard
          title="Fatiga"
          value={latest ? `${fatigueScore}/10` : "-"}
          subtitle="Media"
          status="normal"
        />
      </View>

      <View className="mb-6">
        <MetricCard
          title="Preparación para entrenar"
          value={latest ? `${latest.preparacion_entrenar || 0}/5` : "-"}
          subtitle="Última medición"
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo actual"
          subtitle="Motivación, estrés e irritabilidad"
        />

        {latest ? (
          <RadarMock
            motivation={latest.motivacion || 0}
            stress={latest.estres || 0}
            irritability={latest.irritabilidad || 0}
          />
        ) : (
          <EmptyBox text="Sin datos de autopercepción" />
        )}
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo semanal"
          subtitle="Evolución de los últimos 7 días"
        />

        <GroupedBars
          data={weeklyData.map((item) => ({
            label: shortDate(item.fecha),
            values: [
              { name: "Motivación", value: item.motivacion || 0 },
              { name: "Estrés", value: item.estres || 0 },
              { name: "Irritabilidad", value: item.irritabilidad || 0 },
            ],
          }))}
        />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Fatiga percibida semanal"
          subtitle="Fatiga física, mental y media"
        />

        <GroupedBars
          data={weeklyData.map((item) => ({
            label: shortDate(item.fecha),
            values: [
              { name: "Física", value: item.fatiga_fisica || 0 },
              { name: "Mental", value: item.fatiga_mental || 0 },
              {
                name: "Media",
                value:
                  item.fatiga_general ||
                  Math.round(
                    ((item.fatiga_fisica || 0) + (item.fatiga_mental || 0)) / 2
                  ),
              },
            ],
          }))}
        />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Energía semanal"
          subtitle="Últimas 7 mediciones"
        />

        <View className="gap-3">
          {weeklyData.length > 0 ? (
            weeklyData.map((item) => (
              <View
                key={item.fecha}
                className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3"
              >
                <Text className="font-semibold text-gray-700">
                  {shortDate(item.fecha)}
                </Text>

                <View className="flex-1 mx-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-3 bg-emerald-500 rounded-full"
                    style={{ width: `${(item.nivel_energia || 0) * 10}%` }}
                  />
                </View>

                <Text className="font-bold text-emerald-700">
                  {item.nivel_energia || 0}/10
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Sin datos suficientes</Text>
          )}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Preparación semanal"
          subtitle="Preparación percibida para entrenar"
        />

        <SimpleBarChart
          data={weeklyData.map((item) => ({
            label: shortDate(item.fecha),
            value: item.preparacion_entrenar || 0,
          }))}
          maxValue={5}
        />
      </AppCard>
    </AthleteLayout>
  );
}

function calculateMood(motivation: number, stress: number, irritability: number) {
  const stressInv = 11 - stress;
  const irritabilityInv = 11 - irritability;

  return Math.round(
    0.4 * motivation + 0.35 * stressInv + 0.25 * irritabilityInv
  );
}

function RadarMock({
  motivation,
  stress,
  irritability,
}: {
  motivation: number;
  stress: number;
  irritability: number;
}) {
  return (
    <View className="bg-slate-50 rounded-2xl p-5 items-center">
      <Text className="text-sm text-gray-500 mb-4">
        Distribución de variables
      </Text>

      <View className="items-center justify-center">
        <Text className="text-blue-600 font-bold">
          Motivación: {motivation}/10
        </Text>
        <Text className="text-red-500 font-bold mt-2">
          Estrés: {stress}/10
        </Text>
        <Text className="text-amber-600 font-bold mt-2">
          Irritabilidad: {irritability}/10
        </Text>
      </View>
    </View>
  );
}

function GroupedBars({
  data,
}: {
  data: {
    label: string;
    values: { name: string; value: number }[];
  }[];
}) {
  if (data.length === 0) {
    return <EmptyBox text="Sin datos suficientes" />;
  }

  return (
    <View className="h-52 bg-slate-50 rounded-2xl p-4">
      <View className="flex-row items-end justify-between flex-1">
        {data.map((item) => (
          <View key={item.label} className="items-center flex-1">
            <View className="flex-row items-end gap-1 h-36">
              {item.values.map((metric, index) => (
                <View
                  key={`${item.label}-${metric.name}`}
                  className={`w-2 rounded-t-xl ${
                    index === 0
                      ? "bg-blue-500"
                      : index === 1
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                  style={{ height: metric.value * 12 }}
                />
              ))}
            </View>
            <Text className="text-[10px] text-gray-400 mt-2">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SimpleBarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
}) {
  if (data.length === 0) {
    return <EmptyBox text="Sin datos suficientes" />;
  }

  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 flex-row items-end justify-between">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 120;

        return (
          <View key={`${item.label}-${index}`} className="items-center flex-1">
            <View
              className="w-7 bg-blue-500 rounded-t-xl"
              style={{ height }}
            />
            <Text className="text-[10px] text-gray-400 mt-2">
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 items-center justify-center">
      <Text className="text-gray-500">{text}</Text>
    </View>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}