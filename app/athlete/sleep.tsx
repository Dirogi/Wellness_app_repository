import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const sleepMonthData = [
  7.2, 7.5, 6.8, 7.1, 7.9, 6.5, 7.0, 6.9, 7.3, 8.1,
  6.7, 7.4, 7.6, 7.2, 7.8, 8.0, 6.9, 7.1, 7.5, 7.7,
  8.2, 7.9, 6.8, 7.3, 8.1, 7.6, 7.4, 8.0, 7.5, 7.8,
];

const sleepQualityData = [
  6, 7, 6, 8, 7, 6, 7, 8, 7, 9,
  6, 7, 8, 7, 8, 9, 7, 6, 8, 7,
  8, 9, 7, 8, 9, 8, 7, 8, 9, 8,
];

const lastNight = {
  hours: 7.5,
  quality: 8,
  bedtime: "23:30",
  wakeTime: "07:00",
  awakenings: 3,
};

export default function SleepScreen() {
  const weeklyHours = sleepMonthData.slice(-7);
  const weeklyQuality = sleepQualityData.slice(-7);

  const weeklyAvgHours = average(weeklyHours);
  const weeklyAvgQuality = average(weeklyQuality);
  const weeklyTotalHours = sum(weeklyHours);

  const monthlyAvgHours = average(sleepMonthData);
  const monthlyAvgQuality = average(sleepQualityData);
  const daysOver7h = sleepMonthData.filter((hours) => hours >= 7).length;
  const monthlyTotalHours = sum(sleepMonthData);

  return (
    <AthleteLayout title="Sueño">
      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Horas anoche"
          value={formatHours(lastNight.hours)}
          subtitle="Bueno"
          status="good"
        />
        <MetricCard
          title="Calidad"
          value={`${lastNight.quality}/10`}
          subtitle="Alta"
          status="good"
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
            title="Horario"
            value={`${lastNight.bedtime} - ${lastNight.wakeTime}`}
            subtitle="Sueño nocturno"
            status="normal"
        />
        <MetricCard
          title="Despertares"
          value={lastNight.awakenings}
          subtitle="Normal"
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Horas de sueño"
          subtitle="Evolución durante el mes"
        />
        <SimpleBarChart data={sleepMonthData} maxValue={10} suffix="h" />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Calidad del sueño"
          subtitle="Evolución durante el mes"
        />
        <SimpleLineChart data={sleepQualityData} maxValue={10} />
      </AppCard>

      <View className="flex-row gap-3">
        <AppCard className="flex-1">
          <SectionTitle title="Resumen semanal" />

          <View className="gap-3">
            <StatRow label="Horas promedio" value={formatHours(weeklyAvgHours)} />
            <StatRow label="Calidad promedio" value={`${weeklyAvgQuality.toFixed(1)}/10`} />
            <StatRow label="Despertares promedio" value="2.4" />
            <StatRow label="Total semanal" value={formatHours(weeklyTotalHours)} />
          </View>
        </AppCard>

        <AppCard className="flex-1">
          <SectionTitle title="Resumen mensual" />

          <View className="gap-3">
            <StatRow label="Horas promedio" value={formatHours(monthlyAvgHours)} />
            <StatRow label="Calidad promedio" value={`${monthlyAvgQuality.toFixed(1)}/10`} />
            <StatRow label="Días +7h" value={`${daysOver7h} días`} />
            <StatRow label="Total mensual" value={formatHours(monthlyTotalHours)} />
          </View>
        </AppCard>
      </View>
    </AthleteLayout>
  );
}

function SimpleBarChart({
  data,
  maxValue,
  suffix,
}: {
  data: number[];
  maxValue: number;
  suffix?: string;
}) {
  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 flex-row items-end justify-between">
      {data.map((value, index) => {
        const height = (value / maxValue) * 120;

        return (
          <View key={`${value}-${index}`} className="items-center flex-1">
            <View
              className="w-2 bg-blue-500 rounded-t-xl"
              style={{ height }}
            />
            {index % 5 === 0 && (
              <Text className="text-[10px] text-gray-400 mt-2">
                {index + 1}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function SimpleLineChart({
  data,
  maxValue,
}: {
  data: number[];
  maxValue: number;
}) {
  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 justify-end">
      <View className="flex-row items-end justify-between h-32">
        {data.map((value, index) => {
          const height = (value / maxValue) * 120;

          return (
            <View key={`${value}-${index}`} className="items-center flex-1">
              <View
                className="w-2 h-2 bg-teal-500 rounded-full"
                style={{ marginBottom: height }}
              />
            </View>
          );
        })}
      </View>

      <Text className="text-xs text-gray-400 text-center mt-2">
        Calidad diaria del sueño
      </Text>
    </View>
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

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatHours(hours: number) {
  const h = Math.floor(hours);
  const minutes = Math.round((hours - h) * 60);

  if (minutes === 0) return `${h} h`;
  return `${h} h ${minutes} min`;
}