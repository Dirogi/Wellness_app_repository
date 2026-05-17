import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

type TrainingTab = "history" | "trends" | "monthly";

const trainingData = [
  { day: "Lunes", type: "Fuerza", duration: 60, intensity: 7, load: 420 },
  { day: "Martes", type: "Carrera", duration: 45, intensity: 4, load: 180 },
  { day: "Miércoles", type: "Fuerza", duration: 70, intensity: 8, load: 560 },
  { day: "Jueves", type: "Movilidad", duration: 30, intensity: 3, load: 90 },
  { day: "Viernes", type: "Fuerza", duration: 65, intensity: 7, load: 455 },
];

const weeklyLoad = [
  { week: "S1", value: 1200 },
  { week: "S2", value: 1500 },
  { week: "S3", value: 1850 },
  { week: "S4", value: 1650 },
];

export default function TrainingScreen() {
  const [activeTab, setActiveTab] = useState<TrainingTab>("history");

  const totalSessions = trainingData.length;
  const totalMinutes = trainingData.reduce((sum, item) => sum + item.duration, 0);
  const averageLoad = Math.round(
    trainingData.reduce((sum, item) => sum + item.load, 0) / totalSessions
  );
  const averageIntensity = Math.round(
    trainingData.reduce((sum, item) => sum + item.intensity, 0) / totalSessions
  );

  const totalTime = formatMinutes(totalMinutes);

  const typeDistribution = useMemo(() => {
    const result: Record<string, number> = {};

    trainingData.forEach((item) => {
      result[item.type] = (result[item.type] || 0) + 1;
    });

    return Object.entries(result);
  }, []);

  return (
    <AthleteLayout title="Entrenamiento">
      <View className="flex-row gap-3 mb-3">
        <MetricCard title="Total sesiones" value={totalSessions} />
        <MetricCard title="Horas totales" value={totalTime} />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard title="Carga promedio" value={averageLoad} />
        <MetricCard title="Intensidad media" value={averageIntensity} />
      </View>

      <View className="flex-row bg-white rounded-full p-1 mb-6 border border-gray-100">
        <TabButton
          title="Historial"
          active={activeTab === "history"}
          onPress={() => setActiveTab("history")}
        />
        <TabButton
          title="Tendencias"
          active={activeTab === "trends"}
          onPress={() => setActiveTab("trends")}
        />
        <TabButton
          title="Vista mensual"
          active={activeTab === "monthly"}
          onPress={() => setActiveTab("monthly")}
        />
      </View>

      {activeTab === "history" && (
        <AppCard>
          <SectionTitle
            title="Historial de entrenamientos"
            subtitle="Sesiones registradas esta semana"
          />

          <View className="gap-3">
            {trainingData.map((item, index) => (
              <View
                key={`${item.day}-${index}`}
                className="bg-slate-50 rounded-2xl p-4 flex-row justify-between items-center"
              >
                <View>
                  <Text className="font-bold text-gray-900">{item.day}</Text>
                  <Text className="text-gray-500 text-sm">{item.type}</Text>
                </View>

                <View className="items-end">
                  <Text className="font-bold text-blue-600">
                    {item.duration} min
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {item.load} AU
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AppCard>
      )}

      {activeTab === "trends" && (
        <View className="gap-5">
          <AppCard>
            <SectionTitle title="Evolución de carga" subtitle="Carga diaria" />
            <SimpleBarChart
              data={trainingData.map((item) => ({
                label: item.day.slice(0, 3),
                value: item.load,
              }))}
            />
          </AppCard>

          <AppCard>
            <SectionTitle title="Duración" subtitle="Minutos por sesión" />
            <SimpleBarChart
              data={trainingData.map((item) => ({
                label: item.day.slice(0, 3),
                value: item.duration,
              }))}
            />
          </AppCard>

          <AppCard>
            <SectionTitle title="Intensidad" subtitle="RPE por sesión" />
            <SimpleBarChart
              data={trainingData.map((item) => ({
                label: item.day.slice(0, 3),
                value: item.intensity,
              }))}
            />
          </AppCard>
        </View>
      )}

      {activeTab === "monthly" && (
        <View className="gap-5">
          <AppCard>
            <SectionTitle
              title="Resumen mensual"
              subtitle="Carga de entrenamiento por semana"
            />
            <SimpleBarChart
                data={weeklyLoad.map((item) => ({
                    label: item.week,
                    value: item.value,
                }))}
            />
          </AppCard>

          <AppCard>
            <SectionTitle title="Distribución por tipo" />

            <View className="gap-3">
              {typeDistribution.map(([type, count]) => (
                <View
                  key={type}
                  className="flex-row justify-between bg-emerald-50 rounded-2xl p-3"
                >
                  <Text className="font-semibold text-emerald-700">{type}</Text>
                  <Text className="font-bold text-emerald-700">
                    {count} sesiones
                  </Text>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard>
            <SectionTitle title="Estadísticas mensuales" />

            <View className="gap-3">
              <StatRow label="Sesiones" value={`${totalSessions}`} />
              <StatRow
                label="Carga total"
                value={`${trainingData.reduce((sum, item) => sum + item.load, 0)} AU`}
              />
              <StatRow label="Tiempo total" value={totalTime} />
            </View>
          </AppCard>
        </View>
      )}
    </AthleteLayout>
  );
}

function TabButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 rounded-full items-center ${
        active ? "bg-blue-600" : "bg-transparent"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-gray-600"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function SimpleBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 flex-row items-end justify-between">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 110;

        return (
          <View key={`${item.label}-${index}`} className="items-center flex-1">
            <View
              className="w-7 bg-blue-500 rounded-t-xl"
              style={{ height }}
            />
            <Text className="text-xs text-gray-500 mt-2">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between bg-slate-50 rounded-2xl p-3">
      <Text className="text-gray-600 font-medium">{label}</Text>
      <Text className="text-gray-900 font-bold">{value}</Text>
    </View>
  );
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;

  return `${hours} h ${mins} min`;
}