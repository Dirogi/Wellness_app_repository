import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import { currentMonthName, dayOnly } from "../../src/utils/date";

type SleepItem = {
  fecha: string;
  horas_de_sueno: number | null;
  calidad_sueno: number | null;
  hora_acostarse: string | null;
  hora_levantarse: string | null;
  numero_despertares: number | null;
};

export default function SleepScreen() {
  const [loading, setLoading] = useState(true);
  const [sleepData, setSleepData] = useState<SleepItem[]>([]);

  const today = new Date();

  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  function formatDate(date: Date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function fillMonthSleepData(data: SleepItem[]) {
    const daysInRange = today.getDate();

    return Array.from({ length: daysInRange }, (_, index) => {
      const day = index + 1;

      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        day
      );

      const dateString = formatDate(date);

      const existing = data.find(
        (item) => item.fecha === dateString
      );

      return {
        fecha: dateString,
        horas_de_sueno: existing?.horas_de_sueno ?? 0,
        calidad_sueno: existing?.calidad_sueno ?? 0,
        hora_acostarse: existing?.hora_acostarse ?? null,
        hora_levantarse: existing?.hora_levantarse ?? null,
        numero_despertares: existing?.numero_despertares ?? null,
      };
    });
  }

  useEffect(() => {
    loadSleepData();
  }, []);

  async function loadSleepData() {
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
        suenos(
          horas_de_sueno,
          calidad_sueno,
          hora_acostarse,
          hora_levantarse,
          numero_despertares
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .gte("fecha", formatDate(startOfMonth))
      .lte("fecha", formatDate(today))
      .order("fecha", { ascending: false })

    if (error) {
      console.log("Error cargando sueño:", error.message);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const sleep = first(item.suenos);
          if (!sleep) return null;

          return {
            fecha: item.fecha,
            horas_de_sueno: sleep.horas_de_sueno,
            calidad_sueno: sleep.calidad_sueno,
            hora_acostarse: sleep.hora_acostarse,
            hora_levantarse: sleep.hora_levantarse,
            numero_despertares: sleep.numero_despertares,
          };
        })
        .filter(Boolean) || [];

    setSleepData(formattedData as SleepItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Sueño">
        <Text className="text-gray-500">Cargando sueño...</Text>
      </AthleteLayout>
    );
  }

  const latest = sleepData[0];

  const weeklyData = sleepData.slice(0, 7);
  const monthlyData = fillMonthSleepData(sleepData);

  const weeklyAvgHours = average(
    weeklyData.map((item) => item.horas_de_sueno || 0)
  );

  const weeklyAvgQuality = average(
    weeklyData.map((item) => item.calidad_sueno || 0)
  );

  const weeklyAvgWakeups = average(
    weeklyData.map((item) => item.numero_despertares || 0)
  );

  const weeklyTotalHours = sum(
    weeklyData.map((item) => item.horas_de_sueno || 0)
  );

  const monthlyAvgHours = average(
    monthlyData.map((item) => item.horas_de_sueno || 0)
  );

  const monthlyAvgQuality = average(
    monthlyData.map((item) => item.calidad_sueno || 0)
  );

  const daysOver7h = monthlyData.filter(
    (item) => (item.horas_de_sueno || 0) >= 7
  ).length;

  const monthlyTotalHours = sum(
    monthlyData.map((item) => item.horas_de_sueno || 0)
  );

  return (
    <AthleteLayout title="Sueño">
      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Horas anoche"
          value={latest ? formatHours(latest.horas_de_sueno || 0) : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          subtitleVariant="violet"
        />

        <MetricCard
          title="Calidad"
          value={latest?.calidad_sueno ? `${latest.calidad_sueno}/10` : "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          subtitleVariant="violet"
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Horario"
          value={
            latest
              ? `${formatTime(latest.hora_acostarse)} - ${formatTime(
                  latest.hora_levantarse
                )}`
              : "-"
          }
          subtitle="Sueño nocturno"
        />

        <MetricCard
          title="Despertares"
          value={latest?.numero_despertares ?? "-"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          subtitleVariant="violet"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Horas de sueño"
          subtitle={`Evolución durante el mes (${currentMonthName()})`}
        />

        {monthlyData.length > 0 ? (
          <View className="bg-teal-50 rounded-2xl p-4 overflow-hidden">
            <BarChart
              data={monthlyData
                .map((item) => ({
                  value: item.horas_de_sueno || 0,
                  label: dayOnly(item.fecha),
                }))}
              height={170}
              barWidth={10}
              spacing={7}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              frontColor="#14B8A6"
              maxValue={10}
              noOfSections={5}
              yAxisLabelSuffix=" h"
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 7,
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
            <Text className="text-gray-500">Sin datos suficientes</Text>
          </View>
        )}
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Calidad del sueño"
          subtitle={`Evolución durante el mes (${currentMonthName()})`}
        />

        {monthlyData.length > 0 ? (
          <View className="bg-purple-50 rounded-2xl p-4 overflow-hidden">
            <LineChart
              data={monthlyData
                .map((item) => ({
                  value: item.calidad_sueno || 0,
                  label: dayOnly(item.fecha),
                }))}
              height={170}
              hideDataPoints={false}
              dataPointsColor="#7C3AED"
              dataPointsRadius={4}
              thickness={2}
              color="#7C3AED"
              initialSpacing={12}
              endSpacing={12}
              maxValue={10}
              noOfSections={5}
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 7,
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
            <Text className="text-gray-500">Sin datos suficientes</Text>
          </View>
        )}
      </AppCard>

      <View className="flex-row gap-3">
        <AppCard className="flex-1">
          <SectionTitle title="Resumen semanal" />

          <View className="gap-3">
            <StatRow label="Horas promedio" value={formatHours(weeklyAvgHours)} />
            <StatRow
              label="Calidad promedio"
              value={`${weeklyAvgQuality.toFixed(1)}/10`}
            />
            <StatRow
              label="Despertares promedio"
              value={weeklyAvgWakeups.toFixed(1)}
            />
            <StatRow label="Total semanal" value={formatHours(weeklyTotalHours)} />
          </View>
        </AppCard>

        <AppCard className="flex-1">
          <SectionTitle title="Resumen mensual" />

          <View className="gap-3">
            <StatRow label="Horas promedio" value={formatHours(monthlyAvgHours)} />
            <StatRow
              label="Calidad promedio"
              value={`${monthlyAvgQuality.toFixed(1)}/10`}
            />
            <StatRow label="Días +7h" value={`${daysOver7h} días`} />
            <StatRow label="Total mensual" value={formatHours(monthlyTotalHours)} />
          </View>
        </AppCard>
      </View>
    </AthleteLayout>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-purple-100 rounded-xl p-3">
      <Text className="text-purple-800 text-xs font-semibold">{label}</Text>
      <Text className="text-purple-900 font-bold mt-1">{value}</Text>
    </View>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatHours(hours: number) {
  const h = Math.floor(hours);
  const minutes = Math.round((hours - h) * 60);

  if (!hours) return "-";
  if (minutes === 0) return `${h} h`;
  return `${h} h ${minutes} min`;
}

function formatTime(time: string | null) {
  if (!time) return "--:--";
  return time.slice(0, 5);
}
