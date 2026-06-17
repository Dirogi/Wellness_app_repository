import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import { dayOnly } from "../../src/utils/date";

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

  const today = new Date();

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getStartDate() {
    const date = new Date(today);
    date.setDate(today.getDate() - 7);
    return date;
  }

  function fillWeeklySelfData(data: SelfItem[]) {
    const days = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(getStartDate());
      date.setDate(getStartDate().getDate() + index);

      const dateString = formatDate(date);

      const existing = data.find((item) => item.fecha === dateString);

      return {
        fecha: dateString,
        motivacion: existing?.motivacion ?? null,
        estres: existing?.estres ?? null,
        irritabilidad: existing?.irritabilidad ?? null,
        fatiga_fisica: existing?.fatiga_fisica ?? null,
        fatiga_mental: existing?.fatiga_mental ?? null,
        fatiga_general: existing?.fatiga_general ?? null,
        sensacion_recuperacion: existing?.sensacion_recuperacion ?? null,
        preparacion_entrenar: existing?.preparacion_entrenar ?? null,
        nivel_energia: existing?.nivel_energia ?? null,
      };
    });

    const maxEmptyDays = 4;
    let cutIndex = 0;
    let emptyStreak = 0;

    for (let i = 0; i < days.length; i++) {
      const isEmpty =
        days[i].motivacion === null &&
        days[i].estres === null &&
        days[i].irritabilidad === null &&
        days[i].fatiga_general === null;

      if (isEmpty) {
        emptyStreak++;

        if (emptyStreak >= maxEmptyDays) {
          cutIndex = i + 1;
        }
      } else {
        emptyStreak = 0;
      }
    }

    return days.slice(cutIndex);
  }

  async function loadSelfData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: athleteData } = await supabase
      .from("deportistas")
      .select("id_deportista")
      .eq("id_usuario", userId)
      .single();

    if (!athleteData) {
      setLoading(false);
      return;
    }

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
      .gte("fecha", formatDate(getStartDate()))
      .lte("fecha", formatDate(today))
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error cargando autopercepción:", error.message);
      setLoading(false);
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

    setSelfData(fillWeeklySelfData(formattedData as SelfItem[]));
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Autopercepción">
        <Text className="text-gray-500">Cargando autopercepción...</Text>
      </AthleteLayout>
    );
  }

  const latest = selfData
    .slice()
    .reverse()
    .find(
      (item) =>
        item.motivacion !== null ||
        item.estres !== null ||
        item.irritabilidad !== null ||
        item.fatiga_general !== null
    );

  const weeklyData = selfData;

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
          subtitleVariant="indigo"
        />

        <MetricCard
          title="Fatiga"
          value={latest ? `${fatigueScore}/10` : "-"}
          subtitle="Media"
          subtitleVariant="cyan"
        />

      </View>

      <View className="mb-6">
        <MetricCard
          title="Preparación para entrenar"
          value={latest ? `${latest.preparacion_entrenar || 0}/5` : "-"}
          subtitle="Última medición"
          subtitleVariant="violet"
        />
      </View>
      

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo actual"
          subtitle="Perfil actual de autopercepción"
        />

        {latest ? (
          <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
            <BarChart
              data={[
                {
                  value: latest.motivacion || 0,
                  label: "Mot.",
                  frontColor: "#3B82F6",
                },
                {
                  value: latest.estres || 0,
                  label: "Estrés",
                  frontColor: "#F59E0B",
                },
                {
                  value: latest.irritabilidad || 0,
                  label: "Irrit.",
                  frontColor: "#EF4444",
                },
              ]}
              height={180}
              barWidth={40}
              spacing={35}
              roundedTop
              maxValue={10}
              noOfSections={5}
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
            />
          </View>
        ) : (
          <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center">
            <Text className="text-gray-500">
              Sin datos suficientes
            </Text>
          </View>
        )}
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo semanal"
          subtitle="Evolución de los últimos 7 días"
        />

        {weeklyData.length > 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 overflow-hidden">
            <BarChart
              data={weeklyData
                .flatMap((item) => [
                  {
                    value: item.motivacion || 0,
                    label: dayOnly(item.fecha),
                    frontColor: "#3B82F6",
                    spacing: 2,
                  },
                  {
                    value: item.estres || 0,
                    frontColor: "#F59E0B",
                    spacing: 2,
                  },
                  {
                    value: item.irritabilidad || 0,
                    frontColor: "#EF4444",
                    spacing: 14,
                  },
                ])}
              height={180}
              barWidth={10}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              maxValue={10}
              noOfSections={5}
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
            />

            <View className="flex-row justify-center gap-4 mt-4">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-xs text-gray-600">Motivación</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                <Text className="text-xs text-gray-600">Estrés</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <Text className="text-xs text-gray-600">Irritabilidad</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center">
            <Text className="text-gray-500">
              Sin datos suficientes
            </Text>
          </View>
        )}
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Fatiga percibida semanal"
          subtitle="Fatiga física, mental y media"
        />

        {weeklyData.length > 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 overflow-hidden">
            <BarChart
              data={weeklyData
                .flatMap((item) => {
                  const fatigaFisica = item.fatiga_fisica || 0;
                  const fatigaMental = item.fatiga_mental || 0;
                  const fatigueValues = [
                    item.fatiga_fisica,
                    item.fatiga_mental,
                  ].filter((value) => value !== null) as number[];

                  const fatigaMedia =
                    fatigueValues.length > 0
                      ? Math.round(
                          fatigueValues.reduce((sum, value) => sum + value, 0) /
                            fatigueValues.length
                        )
                      : 0;

                  return [
                    {
                      value: fatigaFisica,
                      label: dayOnly(item.fecha),
                      frontColor: "#3B82F6",
                      spacing: 2,
                    },
                    {
                      value: fatigaMental,
                      frontColor: "#e512de",
                      spacing: 2,
                    },
                    {
                      value: fatigaMedia,
                      frontColor: "#8B5CF6",
                      spacing: 14,
                    },
                  ];
                })}
              height={180}
              barWidth={10}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              maxValue={10}
              noOfSections={5}
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 8,
              }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
            />

            <View className="flex-row justify-center gap-4 mt-4">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-xs text-gray-600">Física</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-pink-500 mr-2" />
                <Text className="text-xs text-gray-600">Mental</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-violet-500 mr-2" />
                <Text className="text-xs text-gray-600">Media</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center">
            <Text className="text-gray-500">
              Sin datos suficientes
            </Text>
          </View>
        )}
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
                    className="h-3 bg-yellow-500 rounded-full"
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

       {weeklyData.length > 0 ? (
          <View className="bg-emerald-50 rounded-2xl p-4 overflow-hidden">
            <BarChart
              data={weeklyData.map((item) => ({
                value: item.preparacion_entrenar || 0,
                label: dayOnly(item.fecha),
              }))}
              height={180}
              barWidth={18}
              spacing={22}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              frontColor="#059669"
              maxValue={5}
              noOfSections={5}
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 8,
              }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
              yAxisLabelWidth={35}
            />
          </View>
        ) : (
          <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center">
            <Text className="text-gray-500">
              Sin datos suficientes
            </Text>
          </View>
        )}
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

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}