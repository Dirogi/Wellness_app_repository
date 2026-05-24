import { useEffect, useState } from "react";
import { Text, View } from "react-native";
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

  useEffect(() => {
    loadHeartData();
  }, []);

  async function loadHeartData() {
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
        frecuencias_cardiacas(
          hrv,
          fc_reposo
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .limit(7);

    if (error) {
      console.log("Error cargando frecuencia cardiaca:", error.message);
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

    setHeartData(formattedData as HeartItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Frecuencia cardiaca">
        <Text className="text-gray-500">Cargando frecuencia cardiaca...</Text>
      </AthleteLayout>
    );
  }

  const latest = heartData[0];
  const chartData = heartData.slice().reverse();

  return (
    <AthleteLayout title="Frecuencia cardiaca">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV actual"
          value={latest?.hrv ? `${latest.hrv} ms` : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          status="normal"
        />

        <MetricCard
          title="FC en reposo"
          value={latest?.fc_reposo ? `${latest.fc_reposo} bpm` : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Variabilidad de la frecuencia cardiaca"
          subtitle="Evolución semanal de la HRV"
        />

        <SimpleLineChart
          data={chartData.map((item) => ({
            label: shortDate(item.fecha),
            value: item.hrv || 0,
          }))}
          maxValue={100}
          color="blue"
          unit="ms"
        />
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Frecuencia cardiaca en reposo"
          subtitle="Evolución semanal"
        />

        <SimpleLineChart
          data={chartData.map((item) => ({
            label: shortDate(item.fecha),
            value: item.fc_reposo || 0,
          }))}
          maxValue={100}
          color="red"
          unit="bpm"
        />
      </AppCard>
    </AthleteLayout>
  );
}

function SimpleLineChart({
  data,
  maxValue,
  color,
  unit,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  color: "blue" | "red";
  unit: string;
}) {
  if (data.length === 0) {
    return (
      <View className="h-48 bg-slate-50 rounded-2xl p-4 items-center justify-center">
        <Text className="text-gray-500">Sin datos suficientes</Text>
      </View>
    );
  }

  const colorClass = color === "blue" ? "bg-blue-500" : "bg-red-500";

  return (
    <View className="h-48 bg-slate-50 rounded-2xl p-4">
      <View className="flex-row items-end justify-between h-32">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 120;

          return (
            <View key={`${item.label}-${index}`} className="items-center flex-1">
              <View
                className={`w-3 h-3 rounded-full ${colorClass}`}
                style={{ marginBottom: height }}
              />

              <Text className="text-[10px] text-gray-400 mt-2">
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between mt-3">
        <Text className="text-xs text-gray-400">0 {unit}</Text>
        <Text className="text-xs text-gray-400">
          {maxValue} {unit}
        </Text>
      </View>
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