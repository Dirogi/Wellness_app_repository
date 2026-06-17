import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type HeartItem = {
  fecha: string;
  hrv: number | null;
  fc_reposo: number | null;
};

export default function HeartRateScreen() {
  const [loading, setLoading] = useState(true);
  const [heartData, setHeartData] = useState<HeartItem[]>([]);

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

  function fillWeeklyHeartData(data: HeartItem[]) {
    const days = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(getStartDate());
      date.setDate(getStartDate().getDate() + index);

      const dateString = formatDate(date);

      const existing = data.find((item) => item.fecha === dateString);

      return {
        fecha: dateString,
        hrv: existing?.hrv ?? null,
        fc_reposo: existing?.fc_reposo ?? null,
      };
    });

    const maxEmptyDays = 4;
    let cutIndex = 0;
    let emptyStreak = 0;

    for (let i = 0; i < days.length; i++) {
      const isEmpty =
        days[i].hrv === null && days[i].fc_reposo === null;

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

  useEffect(() => {
    loadHeartData();
  }, []);

  async function loadHeartData() {
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
        frecuencias_cardiacas(
          hrv,
          fc_reposo
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .gte("fecha", formatDate(getStartDate()))
      .lte("fecha", formatDate(today))
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error cargando frecuencia cardiaca:", error.message);
      setLoading(false);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const heart = first(item.frecuencias_cardiacas);
          if (!heart) return null;

          return {
            fecha: item.fecha,
            hrv: heart.hrv,
            fc_reposo: heart.fc_reposo,
          };
        })
        .filter(Boolean) || [];

    setHeartData(fillWeeklyHeartData(formattedData as HeartItem[]));
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Frecuencia cardiaca">
        <Text className="text-gray-500">Cargando frecuencia cardiaca...</Text>
      </AthleteLayout>
    );
  }

  const latest = heartData
    .slice()
    .reverse()
    .find((item) => item.hrv !== null || item.fc_reposo !== null);

  const chartData = heartData;

  return (
    <AthleteLayout title="Frecuencia cardiaca">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV actual"
          value={latest?.hrv ? `${latest.hrv} ms` : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          subtitleVariant="violet"
        />

        <MetricCard
          title="FC en reposo"
          value={latest?.fc_reposo ? `${latest.fc_reposo} bpm` : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          subtitleVariant="violet"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Variabilidad de la frecuencia cardiaca"
          subtitle="Evolución semanal de la HRV"
        />

        {chartData.length > 0 ? (
          <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
            <LineChart
              data={chartData.map((item) => ({
                value: item.hrv || 0,
                label: shortDate(item.fecha),
              }))}
              height={170}
              areaChart
              initialSpacing={12}
              endSpacing={12}
              startFillColor="#3B82F6"
              endFillColor="#DBEAFE"
              startOpacity={0.4}
              endOpacity={0.05}
              color="#2563EB"
              thickness={3}
              dataPointsColor="#2563EB"
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              yAxisLabelSuffix=" ms"
              yAxisThickness={1}
              xAxisThickness={1}
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 9,
              }}
              noOfSections={5}
              maxValue={100}
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

      <AppCard>
        <SectionTitle
          title="Frecuencia cardiaca en reposo"
          subtitle="Evolución semanal"
        />

        {chartData.length > 0 ? (
          <View className="bg-red-50 rounded-2xl p-4 overflow-hidden">
            <LineChart
              data={chartData.map((item) => ({
                value: item.fc_reposo || 0,
                label: shortDate(item.fecha),
              }))}
              height={170}
              areaChart
              initialSpacing={12}
              endSpacing={12}
              startFillColor="#EF4444"
              endFillColor="#FEE2E2"
              startOpacity={0.4}
              endOpacity={0.05}
              color="#DC2626"
              thickness={3}
              dataPointsColor="#DC2626"
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              yAxisLabelSuffix=" bpm"
              yAxisThickness={1}
              xAxisThickness={1}
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 8,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 9,
              }}
              noOfSections={5}
              maxValue={100}
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


function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}