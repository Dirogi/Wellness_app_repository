import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const menstrualData = [
  {
    day: "Día 1",
    active: true,
    bleeding: 5,
    pain: 4,
    physicalSymptoms: ["Dolor abdominal", "Hinchazón"],
    emotionalSymptoms: ["Irritabilidad"],
  },
  {
    day: "Día 2",
    active: true,
    bleeding: 7,
    pain: 7,
    physicalSymptoms: ["Calambres", "Dolor lumbar"],
    emotionalSymptoms: ["Cambios de humor"],
  },
  {
    day: "Día 3",
    active: true,
    bleeding: 6,
    pain: 8,
    physicalSymptoms: ["Dolor de cabeza"],
    emotionalSymptoms: ["Cansancio emocional"],
  },
  {
    day: "Día 4",
    active: true,
    bleeding: 4,
    pain: 4,
    physicalSymptoms: ["Hinchazón"],
    emotionalSymptoms: ["Baja motivación"],
  },
  {
    day: "Día 5",
    active: true,
    bleeding: 3,
    pain: 2,
    physicalSymptoms: ["Sensibilidad mamaria"],
    emotionalSymptoms: ["Estrés"],
  },
  {
    day: "Día 6",
    active: true,
    bleeding: 1,
    pain: 1,
    physicalSymptoms: ["Dolor de cabeza"],
    emotionalSymptoms: ["Baja motivación"],
  },
];

export default function MenstrualCycleScreen() {
  const latest = menstrualData[menstrualData.length - 1];

  const activePeriodData = menstrualData.filter((item) => item.active);

  const latestBleeding = latest.active ? latest.bleeding : 0;
  const latestPain = latest.active ? latest.pain : 0;

  const currentPhysicalSymptoms = latest.active ? latest.physicalSymptoms : [];
  const currentEmotionalSymptoms = latest.active ? latest.emotionalSymptoms : [];

  return (
    <AthleteLayout title="Ciclo menstrual">
        <View className="flex-row gap-3 mb-6">
            <MetricCard
                title="Menstruación activa"
                value={latest.active ? "Sí" : "No"}
                subtitle="Última medición"
                status={latest.active ? "warning" : "normal"}
            />

            <AppCard className="flex-1 min-h-[130px] items-center">
                <Text className="text-gray-500 text-sm font-medium text-center mb-3">
                    Sangrado
                </Text>
                <BloodDropIndicator value={latestBleeding} />
            </AppCard>

            <MetricCard
                title="Dolor menstrual"
                value={`${latestPain}/10`}
                subtitle="Última medición"
                status={latestPain >= 6 ? "danger" : latestPain >= 3 ? "warning" : "good"}
            />
        </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Sangrado durante menstruación"
          subtitle="Solo días con menstruación activa"
        />

        <SimpleBarChart
          data={activePeriodData.map((item) => ({
            label: item.day.replace("Día ", "D"),
            value: item.bleeding,
          }))}
          maxValue={10}
        />
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle title="Síntomas físicos" />

        {currentPhysicalSymptoms.length > 0 ? (
          <View className="gap-3">
            {currentPhysicalSymptoms.map((symptom) => (
              <View
                key={symptom}
                className="bg-slate-50 rounded-2xl p-3"
              >
                <Text className="text-gray-800 font-semibold">{symptom}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500">
            Actualmente no hay síntomas físicos.
          </Text>
        )}
      </AppCard>

      <AppCard>
        <SectionTitle title="Síntomas emocionales" />

        {currentEmotionalSymptoms.length > 0 ? (
          <View className="gap-3">
            {currentEmotionalSymptoms.map((symptom) => (
              <View
                key={symptom}
                className="bg-slate-50 rounded-2xl p-3"
              >
                <Text className="text-gray-800 font-semibold">{symptom}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500">
            Actualmente no hay síntomas emocionales.
          </Text>
        )}
      </AppCard>
    </AthleteLayout>
  );
}

function BloodDropIndicator({ value }: { value: number }) {
  return (
    <View className="w-24">
      {[0, 1].map((row) => (
        <View key={row} className="flex-row justify-center gap-1">
          {Array.from({ length: 5 }, (_, index) => row * 5 + index + 1).map(
            (number) => (
              <Text
                key={number}
                className="text-lg"
                style={{
                  opacity: number <= value ? 1 : 0.25,
                }}
              >
                🩸
              </Text>
            )
          )}
        </View>
      ))}
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
              className="w-8 bg-red-400 rounded-t-xl"
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