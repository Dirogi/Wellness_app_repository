import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import {
  shortDate
} from "../../src/utils/date";

type TrainingTab = "history" | "trends" | "monthly";

type TrainingItem = {
  fecha: string;
  tipo_entrenamiento: string | null;
  duracion: number | null;
  intensidad_percibida: number | null;
  carga_de_entrenamiento: number | null;
  notas_entrenamiento: string | null;
};

function getChartColor(index: number) {
  const hue = (index * 137.508) % 360;

  return `hsl(${hue}, 70%, 55%)`;
}

export default function TrainingScreen() {
  const [activeTab, setActiveTab] = useState<TrainingTab>("history");
  const [loading, setLoading] = useState(true);
  const [trainingData, setTrainingData] = useState<TrainingItem[]>([]);

  useEffect(() => {
    loadTrainingData();
  }, []);

  async function loadTrainingData() {
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
        entrenamientos(
          tipo_entrenamiento,
          duracion,
          intensidad_percibida,
          carga_de_entrenamiento,
          notas_entrenamiento
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false });

    if (error) {
      console.log("Error cargando entrenamientos:", error.message);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const training = first(item.entrenamientos);

          if (!training) return null;

          return {
            fecha: item.fecha,
            tipo_entrenamiento: training.tipo_entrenamiento,
            duracion: training.duracion,
            intensidad_percibida: training.intensidad_percibida,
            carga_de_entrenamiento: training.carga_de_entrenamiento,
            notas_entrenamiento: training.notas_entrenamiento,
          };
        })
        .filter(Boolean) || [];

    setTrainingData(formattedData as TrainingItem[]);
    setLoading(false);
  }

  const weeklyData = trainingData.slice(0, 7);
  const monthlyData = trainingData.slice(0, 30);

  const totalSessions = weeklyData.length;
  const totalMinutes = weeklyData.reduce(
    (sum, item) => sum + (item.duracion || 0),
    0
  );

  const averageLoad =
    totalSessions > 0
      ? Math.round(
          weeklyData.reduce(
            (sum, item) => sum + (item.carga_de_entrenamiento || 0),
            0
          ) / totalSessions
        )
      : 0;

  const averageIntensity =
    totalSessions > 0
      ? Math.round(
          weeklyData.reduce(
            (sum, item) => sum + (item.intensidad_percibida || 0),
            0
          ) / totalSessions
        )
      : 0;

  const totalTime = formatMinutes(totalMinutes);

  const typeDistribution = useMemo(() => {
    const result: Record<string, number> = {};

    monthlyData.forEach((item) => {
      const type = item.tipo_entrenamiento || "Sin tipo";
      result[type] = (result[type] || 0) + 1;
    });

    return Object.entries(result);
  }, [monthlyData]);

  const weeklyLoad = useMemo(() => {
    return groupLoadByWeek(monthlyData);
  }, [monthlyData]);

  const monthlyTotalLoad = monthlyData.reduce(
    (sum, item) => sum + (item.carga_de_entrenamiento || 0),
    0
  );

  const monthlyTotalMinutes = monthlyData.reduce(
    (sum, item) => sum + (item.duracion || 0),
    0
  );

  if (loading) {
    return (
      <AthleteLayout title="Entrenamiento">
        <Text className="text-gray-500">Cargando entrenamientos...</Text>
      </AthleteLayout>
    );
  }

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
            subtitle="Sesiones registradas"
          />

          <View className="gap-3">
            {trainingData.length > 0 ? (
              trainingData.map((item, index) => (
                <View
                  key={`${item.fecha}-${index}`}
                  className="bg-slate-50 rounded-2xl p-4 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="font-bold text-gray-900">
                      {formatDate(item.fecha)}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {item.tipo_entrenamiento || "Entrenamiento"}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-blue-600">
                      {item.duracion || 0} min
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {item.carga_de_entrenamiento || 0} AU
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">
                Todavía no hay entrenamientos registrados.
              </Text>
            )}
          </View>
        </AppCard>
      )}

      {activeTab === "trends" && (
        <View className="gap-5">
          <AppCard>
            <SectionTitle title="Evolución de carga" subtitle="Carga diaria" />
            {weeklyData.length > 0 ? (
              <View className="bg-blue-50 rounded-2xl p-4">
                <BarChart
                  data={weeklyData
                    .slice()
                    .reverse()
                    .map((item) => ({
                      value: item.carga_de_entrenamiento || 0,
                      label: shortDate(item.fecha),
                    }))}
                  height={170}
                  barWidth={18}
                  spacing={22}
                  initialSpacing={12}
                  endSpacing={12}
                  roundedTop
                  frontColor="#2563EB"
                  maxValue={1000}
                  noOfSections={5}
                  yAxisLabelSuffix=" AU"
                  yAxisTextStyle={{
                    color: "#6B7280",
                    fontSize: 10,
                  }}
                  xAxisLabelTextStyle={{
                    color: "#6B7280",
                    fontSize: 9,
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

          <AppCard>
            <SectionTitle title="Duración" subtitle="Minutos por sesión" />
            <View className="bg-emerald-50 rounded-2xl p-4">
              <LineChart
                data={weeklyData
                  .slice()
                  .reverse()
                  .map((item) => ({
                    value: item.duracion || 0,
                    label: shortDate(item.fecha),
                  }))}
                height={170}
                curved
                areaChart

                initialSpacing={12}
                endSpacing={12}

                startFillColor="#10B981"
                endFillColor="#D1FAE5"
                startOpacity={0.4}
                endOpacity={0.05}

                color="#059669"
                thickness={3}
                dataPointsColor="#059669"

                xAxisColor="#CBD5E1"
                yAxisColor="#CBD5E1"

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
                maxValue={180}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionTitle title="Intensidad" subtitle="RPE por sesión" />
            <View className="bg-amber-50 rounded-2xl p-4">
              <LineChart
                data={weeklyData
                  .slice()
                  .reverse()
                  .map((item) => ({
                    value: item.intensidad_percibida || 0,
                    label: shortDate(item.fecha),
                  }))}
                height={170}
                areaChart
                initialSpacing={12}
                endSpacing={12}
                startFillColor="#F59E0B"
                endFillColor="#FEF3C7"
                startOpacity={0.4}
                endOpacity={0.05}
                color="#D97706"
                thickness={3}
                dataPointsColor="#D97706"
                xAxisColor="#CBD5E1"
                yAxisColor="#CBD5E1"
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
                maxValue={10}
              />
            </View>
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
            {weeklyLoad.some((item) => item.value > 0) ? (
              <View className="bg-blue-50 rounded-2xl p-4">
                <BarChart
                  data={weeklyLoad.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  height={170}
                  barWidth={28}
                  spacing={28}
                  initialSpacing={20}
                  endSpacing={20}
                  frontColor="#2563EB"
                  maxValue={3000}
                  noOfSections={5}
                  yAxisLabelSuffix=" AU"
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
                <Text className="text-gray-500">Sin datos suficientes</Text>
              </View>
            )}
          </AppCard>

          <AppCard>
            <SectionTitle title="Distribución por tipo" />

            {typeDistribution.length > 0 ? (
              <View className="items-center">
                <PieChart
                  donut
                  radius={90}
                  innerRadius={55}
                  focusOnPress
                  isAnimated
                  animationDuration={800}
                  data={typeDistribution.map(([type, count], index) => ({
                    value: count,
                    text: type,
                    color: getChartColor(index),
                  }))}
                />

                <View className="mt-6 w-full gap-2">
                  {typeDistribution.map(([type, count], index) => (
                    <View
                      key={type}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: getChartColor(index),
                          }}
                        />
                        <Text className="ml-2 text-gray-700">{type}</Text>
                      </View>

                      <Text className="font-semibold text-gray-700">
                        {count} sesiones
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="text-gray-500">
                No hay tipos de entrenamiento registrados.
              </Text>
            )}
          </AppCard>

          <AppCard>
            <SectionTitle title="Estadísticas mensuales" />

            <View className="gap-3">
              <StatRow label="Sesiones" value={`${monthlyData.length}`} />
              <StatRow label="Carga total" value={`${monthlyTotalLoad} AU`} />
              <StatRow
                label="Tiempo total"
                value={formatMinutes(monthlyTotalMinutes)}
              />
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
  if (data.length === 0) {
    return (
      <View className="h-44 bg-slate-50 rounded-2xl p-4 items-center justify-center">
        <Text className="text-gray-500">Sin datos suficientes</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

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

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;

  return `${hours} h ${mins} min`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}


function groupLoadByWeek(data: TrainingItem[]) {
  const weeks = [0, 0, 0, 0];

  data.forEach((item) => {
    const day = Number(item.fecha.split("-")[2]);

    if (day <= 7) weeks[0] += item.carga_de_entrenamiento || 0;
    else if (day <= 14) weeks[1] += item.carga_de_entrenamiento || 0;
    else if (day <= 21) weeks[2] += item.carga_de_entrenamiento || 0;
    else weeks[3] += item.carga_de_entrenamiento || 0;
  });

  return weeks.map((value, index) => ({
    label: `S${index + 1}`,
    value,
  }));
}