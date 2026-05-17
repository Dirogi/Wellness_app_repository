import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const heartWeekData = [
  { day: "Lun", hrv: 72, restingHr: 48 },
  { day: "Mar", hrv: 68, restingHr: 50 },
  { day: "Mié", hrv: 75, restingHr: 47 },
  { day: "Jue", hrv: 64, restingHr: 52 },
  { day: "Vie", hrv: 70, restingHr: 49 },
  { day: "Sáb", hrv: 78, restingHr: 46 },
  { day: "Dom", hrv: 74, restingHr: 44 },
];

export default function HeartRateScreen() {
  const latest = heartWeekData[heartWeekData.length - 1];

  return (
    <AthleteLayout title="Frecuencia cardiaca">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV actual"
          value={`${latest.hrv} ms`}
          subtitle="Bueno"
          status="good"
        />

        <MetricCard
          title="FC en reposo"
          value={`${latest.restingHr} bpm`}
          subtitle="Óptima"
          status="good"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Variabilidad de la frecuencia cardiaca"
          subtitle="Evolución semanal de la HRV"
        />

        <SimpleLineChart
          data={heartWeekData.map((item) => ({
            label: item.day,
            value: item.hrv,
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
          data={heartWeekData.map((item) => ({
            label: item.day,
            value: item.restingHr,
          }))}
          maxValue={80}
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