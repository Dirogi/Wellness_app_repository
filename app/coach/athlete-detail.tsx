import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

type MainTab = "training" | "discomfort";
type TrainingTab = "history" | "trends" | "monthly";

const trainingData = [
  { day: "Lunes", type: "Fuerza", duration: 60, intensity: 7, load: 420, comment: "Buena sesión de fuerza." },
  { day: "Martes", type: "Carrera", duration: 45, intensity: 4, load: 180, comment: "Sesión suave sin molestias." },
  { day: "Miércoles", type: "Fuerza", duration: 70, intensity: 8, load: 560, comment: "Alta intensidad en tren inferior." },
  { day: "Jueves", type: "Movilidad", duration: 30, intensity: 3, load: 90, comment: "Trabajo de recuperación." },
  { day: "Viernes", type: "Fuerza", duration: 65, intensity: 7, load: 455, comment: "Carga correcta." },
];

const weeklyLoad = [
  { label: "S1", value: 1200 },
  { label: "S2", value: 1500 },
  { label: "S3", value: 1850 },
  { label: "S4", value: 1650 },
];

const discomfortData = [
  { date: "12/04/2026", area: "Lumbar", intensity: 2, type: "Sobrecarga" },
  { date: "10/04/2026", area: "Rodilla izquierda", intensity: 3, type: "Dolor" },
  { date: "03/04/2026", area: "Gemelo derecho", intensity: 1, type: "Pinchazo" },
];

export default function CoachAthleteDetailScreen() {
  const [mainTab, setMainTab] = useState<MainTab>("training");
  const [trainingTab, setTrainingTab] = useState<TrainingTab>("history");

  const totalSessions = trainingData.length;
  const totalMinutes = trainingData.reduce((sum, item) => sum + item.duration, 0);
  const totalLoad = trainingData.reduce((sum, item) => sum + item.load, 0);

  const averageLoad = Math.round(totalLoad / totalSessions);
  const averageIntensity = Math.round(
    trainingData.reduce((sum, item) => sum + item.intensity, 0) / totalSessions
  );

  const typeDistribution = useMemo(() => {
    const result: Record<string, number> = {};

    trainingData.forEach((item) => {
      result[item.type] = (result[item.type] || 0) + 1;
    });

    return Object.entries(result);
  }, []);

  return (
    <CoachLayout title="Laura Martín">
      <Text className="text-gray-500 mb-6">
        Vista del deportista asignado
      </Text>

      <View className="flex-row bg-white rounded-full p-1 mb-6 border border-gray-100">
        <MainTabButton
          title="Entrenamiento"
          active={mainTab === "training"}
          onPress={() => setMainTab("training")}
        />
        <MainTabButton
          title="Molestias"
          active={mainTab === "discomfort"}
          onPress={() => setMainTab("discomfort")}
        />
      </View>

      {mainTab === "training" && (
        <>
          <View className="flex-row gap-3 mb-3">
            <MetricCard title="Total sesiones" value={totalSessions} />
            <MetricCard title="Horas totales" value={formatMinutes(totalMinutes)} />
          </View>

          <View className="flex-row gap-3 mb-6">
            <MetricCard title="Carga promedio" value={averageLoad} />
            <MetricCard title="Intensidad media" value={averageIntensity} />
          </View>

          <View className="flex-row bg-white rounded-full p-1 mb-6 border border-gray-100">
            <MainTabButton
              title="Historial"
              active={trainingTab === "history"}
              onPress={() => setTrainingTab("history")}
            />
            <MainTabButton
              title="Tendencias"
              active={trainingTab === "trends"}
              onPress={() => setTrainingTab("trends")}
            />
            <MainTabButton
              title="Vista mensual"
              active={trainingTab === "monthly"}
              onPress={() => setTrainingTab("monthly")}
            />
          </View>

          {trainingTab === "history" && (
            <>
              <AppCard className="mb-6">
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

              <AppCard>
                <SectionTitle
                  title="Comentarios de entrenamiento"
                  subtitle="Últimos comentarios registrados"
                />

                <View className="gap-3">
                  {trainingData.slice(0, 4).map((item, index) => (
                    <View
                      key={`${item.day}-comment-${index}`}
                      className="bg-slate-50 rounded-2xl p-4"
                    >
                      <Text className="font-bold text-gray-900">{item.day}</Text>
                      <Text className="text-gray-600 mt-1">{item.comment}</Text>
                    </View>
                  ))}
                </View>
              </AppCard>
            </>
          )}

          {trainingTab === "trends" && (
            <View className="gap-5">
              <AppCard>
                <SectionTitle title="Evolución de carga" />
                <SimpleBarChart
                  data={trainingData.map((item) => ({
                    label: item.day.slice(0, 3),
                    value: item.load,
                  }))}
                  maxValue={700}
                />
              </AppCard>

              <AppCard>
                <SectionTitle title="Duración" />
                <SimpleBarChart
                  data={trainingData.map((item) => ({
                    label: item.day.slice(0, 3),
                    value: item.duration,
                  }))}
                  maxValue={90}
                />
              </AppCard>

              <AppCard>
                <SectionTitle title="Intensidad" />
                <SimpleBarChart
                  data={trainingData.map((item) => ({
                    label: item.day.slice(0, 3),
                    value: item.intensity,
                  }))}
                  maxValue={10}
                />
              </AppCard>
            </View>
          )}

          {trainingTab === "monthly" && (
            <AppCard>
              <SectionTitle
                title="Resumen mensual"
                subtitle="Carga, distribución y estadísticas"
              />

              <SimpleBarChart data={weeklyLoad} maxValue={2000} />

              <View className="mt-5 gap-4">
                <View className="bg-slate-50 rounded-2xl p-4">
                  <Text className="font-bold text-gray-900 mb-3">
                    Distribución por tipo
                  </Text>

                  <View className="gap-3">
                    {typeDistribution.map(([type, count]) => (
                      <View
                        key={type}
                        className="flex-row justify-between bg-emerald-50 rounded-2xl p-3"
                      >
                        <Text className="font-semibold text-emerald-700">
                          {type}
                        </Text>
                        <Text className="font-bold text-emerald-700">
                          {count} sesiones
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-4">
                  <Text className="font-bold text-gray-900 mb-3">
                    Estadísticas mensuales
                  </Text>

                  <View className="gap-3">
                    <StatRow label="Sesiones" value={`${totalSessions}`} />
                    <StatRow label="Carga total" value={`${totalLoad} AU`} />
                    <StatRow label="Tiempo total" value={formatMinutes(totalMinutes)} />
                  </View>
                </View>
              </View>
            </AppCard>
          )}
        </>
      )}

      {mainTab === "discomfort" && (
            <>
                <View className="flex-row gap-3 mb-3">
                    <MetricCard title="Total mes" value={discomfortData.length} />
                    <MetricCard title="Últimos 7 días" value={3} />
                </View>

                <View className="flex-row gap-3 mb-6">
                    <MetricCard title="Intensidad media" value="4/10" />
                    <MetricCard title="Zonas afectadas" value="4" />
                </View>

                <AppCard className="mb-6">
                    <SectionTitle
                        title="Molestias recientes"
                        subtitle="Últimos registros del deportista"
                    />

                    <View className="gap-3">
                        {discomfortData.map((item, index) => (
                        <View
                            key={`${item.area}-${index}`}
                            className="bg-slate-50 rounded-2xl p-4"
                        >
                            <View className="flex-row justify-between mb-1">
                                <Text className="font-bold text-gray-900">{item.area}</Text>

                                <View className="bg-emerald-100 rounded-full px-3 py-1">
                                    <Text className="text-emerald-700 text-xs font-bold">
                                    {item.intensity}/10
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-gray-500">{item.date}</Text>
                            <Text className="text-blue-600 font-semibold mt-1">
                                {item.type}
                            </Text>
                        </View>
                        ))}
                    </View>
                </AppCard>

                <AppCard className="mb-6">
                <SectionTitle
                    title="Zonas más afectadas"
                    subtitle="Frecuencia acumulada"
                />

                <View className="gap-3">
                    {Object.entries(countBy(discomfortData.map((item) => item.area))).map(
                    ([area, count], index) => (
                        <View
                            key={area}
                            className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3"
                        >
                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                                <Text className="font-bold text-gray-500">{index + 1}</Text>
                            </View>

                            <Text className="font-semibold text-gray-800">{area}</Text>
                        </View>

                        <Text className="text-gray-500 text-sm">{count} veces</Text>
                        </View>
                    )
                    )}
                </View>
                </AppCard>

                <AppCard className="mb-6">
                <SectionTitle
                    title="Tipos de molestias"
                    subtitle="Tipos registrados durante el último mes"
                />

                <View className="gap-3">
                    {Object.entries(countBy(discomfortData.map((item) => item.type))).map(
                    ([type, count]) => (
                        <View
                        key={type}
                        className="flex-row justify-between bg-amber-100 rounded-2xl p-3"
                        >
                        <Text className="font-bold text-amber-800">{type}</Text>
                        <Text className="font-semibold text-amber-800">
                            {count} registros
                        </Text>
                        </View>
                    )
                    )}
                </View>
                </AppCard>

                <AppCard>
                <SectionTitle
                    title="Comentarios de molestias"
                    subtitle="Últimos comentarios registrados"
                />

                <View className="gap-3">
                    {discomfortData.slice(0, 5).map((item, index) => (
                    <View
                        key={`${item.area}-comment-${index}`}
                        className="bg-slate-50 rounded-2xl p-4"
                    >
                        <Text className="font-bold text-gray-900">{item.date}</Text>
                        <Text className="text-gray-600 mt-1">
                            Molestia en {item.area}. Tipo: {item.type}.
                        </Text>
                    </View>
                    ))}
                </View>
                </AppCard>
            </>
        )}
    </CoachLayout>
  );
}

function MainTabButton({
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
        className={`text-sm font-semibold text-center ${
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
            <View className="w-7 bg-blue-500 rounded-t-xl" style={{ height }} />
            <Text className="text-[10px] text-gray-400 mt-2">
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between bg-white rounded-2xl p-3">
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

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}