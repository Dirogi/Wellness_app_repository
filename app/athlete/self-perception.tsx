import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const weeklySelfData = [
  { day: "Lun", motivation: 7, stress: 3, irritability: 2, physicalFatigue: 3, mentalFatigue: 4, energy: 7, readiness: 5 },
  { day: "Mar", motivation: 6, stress: 5, irritability: 4, physicalFatigue: 4, mentalFatigue: 5, energy: 6, readiness: 3 },
  { day: "Mié", motivation: 8, stress: 2, irritability: 3, physicalFatigue: 5, mentalFatigue: 6, energy: 8, readiness: 5 },
  { day: "Jue", motivation: 5, stress: 6, irritability: 5, physicalFatigue: 6, mentalFatigue: 6, energy: 5, readiness: 2 },
  { day: "Vie", motivation: 7, stress: 4, irritability: 3, physicalFatigue: 4, mentalFatigue: 5, energy: 7, readiness: 4 },
  { day: "Sáb", motivation: 8, stress: 3, irritability: 2, physicalFatigue: 3, mentalFatigue: 4, energy: 8, readiness: 4 },
  { day: "Dom", motivation: 7, stress: 4, irritability: 3, physicalFatigue: 4, mentalFatigue: 5, energy: 7, readiness: 4 },
];

export default function SelfPerceptionScreen() {
  const latest = weeklySelfData[weeklySelfData.length - 1];

  const moodScore = calculateMood(
    latest.motivation,
    latest.stress,
    latest.irritability
  );

  const fatigueScore = Math.round(
    (latest.physicalFatigue + latest.mentalFatigue) / 2
  );

  return (
    <AthleteLayout title="Autopercepción">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Estado de ánimo"
          value={`${moodScore}/10`}
          subtitle="Actual"
          status="good"
        />
        <MetricCard
          title="Fatiga"
          value={`${fatigueScore}/10`}
          subtitle="Media"
          status="normal"
        />
      </View>

      <View className="mb-6">
        <MetricCard
          title="Preparación para entrenar"
          value={`${latest.readiness}/5`}
          subtitle="Última medición"
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo actual"
          subtitle="Motivación, estrés e irritabilidad"
        />

        <RadarMock
          motivation={latest.motivation}
          stress={latest.stress}
          irritability={latest.irritability}
        />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado de ánimo semanal"
          subtitle="Evolución de los últimos 7 días"
        />

        <GroupedBars
          data={weeklySelfData.map((item) => ({
            label: item.day,
            values: [
              { name: "Motivación", value: item.motivation },
              { name: "Estrés", value: item.stress },
              { name: "Irritabilidad", value: item.irritability },
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
          data={weeklySelfData.map((item) => ({
            label: item.day,
            values: [
              { name: "Física", value: item.physicalFatigue },
              { name: "Mental", value: item.mentalFatigue },
              {
                name: "Media",
                value: Math.round(
                  (item.physicalFatigue + item.mentalFatigue) / 2
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
          {weeklySelfData.map((item) => (
            <View
              key={item.day}
              className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3"
            >
              <Text className="font-semibold text-gray-700">{item.day}</Text>

              <View className="flex-1 mx-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-3 bg-emerald-500 rounded-full"
                  style={{ width: `${item.energy * 10}%` }}
                />
              </View>

              <Text className="font-bold text-emerald-700">
                {item.energy}/10
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Preparación semanal"
          subtitle="Preparación percibida para entrenar"
        />

        <SimpleBarChart
          data={weeklySelfData.map((item) => ({
            label: item.day,
            value: item.readiness,
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