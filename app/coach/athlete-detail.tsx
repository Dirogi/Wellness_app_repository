import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import CoachLayout from "../../src/components/layout/CoachLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import { dayOnly } from "../../src/utils/date";

type MainTab = "training" | "discomfort";
type TrainingTab = "history" | "trends" | "monthly";

type TrainingItem = {
  fecha: string;
  tipo_entrenamiento: string | null;
  duracion: number | null;
  intensidad_percibida: number | null;
  carga_de_entrenamiento: number | null;
  notas_entrenamiento: string | null;
};

type DiscomfortItem = {
  fecha: string;
  intensidad: number | null;
  tipo_molestia: string | null;
  notas_molestias: string | null;
  zonas: string[];
};

export default function CoachAthleteDetailScreen() {
  const { athleteId } = useLocalSearchParams();

  const [mainTab, setMainTab] = useState<MainTab>("training");
  const [trainingTab, setTrainingTab] = useState<TrainingTab>("history");
  const [loading, setLoading] = useState(true);

  const [athleteName, setAthleteName] = useState("Deportista");
  const [trainingData, setTrainingData] = useState<TrainingItem[]>([]);
  const [discomfortData, setDiscomfortData] = useState<DiscomfortItem[]>([]);

  function formatDateToDB(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getStartDate() {
    const today = new Date();
    const date = new Date(today);

    date.setDate(today.getDate() - 7);

    return date;
  }

  function fillWeeklyTrainingData(data: TrainingItem[]) {
    const today = new Date();
    const startDate = getStartDate();

    const days = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const dateString = formatDateToDB(date);

      const existing = data.find((item) => item.fecha === dateString);

      return {
        fecha: dateString,
        tipo_entrenamiento: existing?.tipo_entrenamiento ?? null,
        duracion: existing?.duracion ?? null,
        intensidad_percibida: existing?.intensidad_percibida ?? null,
        carga_de_entrenamiento: existing?.carga_de_entrenamiento ?? null,
        notas_entrenamiento: existing?.notas_entrenamiento ?? null,
      };
    });

    let cutIndex = 0;

    for (let i = 0; i < days.length - 2; i++) {
      const firstEmpty =
        days[i].duracion === null &&
        days[i].intensidad_percibida === null &&
        days[i].carga_de_entrenamiento === null;

      const secondEmpty =
        days[i + 1].duracion === null &&
        days[i + 1].intensidad_percibida === null &&
        days[i + 1].carga_de_entrenamiento === null;

      const thirdEmpty =
        days[i + 2].duracion === null &&
        days[i + 2].intensidad_percibida === null &&
        days[i + 2].carga_de_entrenamiento === null;

      if (firstEmpty && secondEmpty && thirdEmpty) {
        cutIndex = i + 3;
      }
    }

    return days.slice(cutIndex);
  }

  useEffect(() => {
    loadAthleteDetail();
  }, [athleteId]);

  async function loadAthleteDetail() {
    if (!athleteId) {
      setLoading(false);
      return;
    }

    const idDeportista = Number(athleteId);

    if (Number.isNaN(idDeportista)) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("deportistas")
      .select(`
        id_deportista,
        usuarios(
          nombre_apellidos
        ),
        registros_diarios(
          fecha,
          entrenamientos(
            tipo_entrenamiento,
            duracion,
            intensidad_percibida,
            carga_de_entrenamiento,
            notas_entrenamiento
          ),
          molestias(
            dolor,
            intensidad,
            tipo_molestia,
            notas_molestias,
            relaciones_molestias_zonas(
              zonas_corporales(nombre_zona)
            )
          )
        )
      `)
      .eq("id_deportista", idDeportista)
      .single();

    if (error || !data) {
      console.log("Error cargando detalle deportista:", error?.message);
      setLoading(false);
      return;
    }

    const usuario = first((data as any).usuarios);
    setAthleteName(usuario?.nombre_apellidos || "Deportista");

    const registros = Array.isArray((data as any).registros_diarios)
      ? (data as any).registros_diarios.sort(
          (a: any, b: any) => b.fecha.localeCompare(a.fecha)
        )
      : [];

    const trainings =
      registros
        .map((registro: any) => {
          const training = first(registro.entrenamientos);
          if (!training) return null;

          return {
            fecha: registro.fecha,
            tipo_entrenamiento: training.tipo_entrenamiento,
            duracion: training.duracion,
            intensidad_percibida: training.intensidad_percibida,
            carga_de_entrenamiento: training.carga_de_entrenamiento,
            notas_entrenamiento: training.notas_entrenamiento,
          };
        })
        .filter(Boolean) || [];

    const discomforts =
      registros
        .map((registro: any) => {
          const discomfort = first(registro.molestias);
          if (!discomfort || !discomfort.dolor) return null;

          const zonas =
            discomfort.relaciones_molestias_zonas
              ?.map((rel: any) => {
                const zona = first(rel.zonas_corporales);
                return zona?.nombre_zona;
              })
              .filter(Boolean) || [];

          return {
            fecha: registro.fecha,
            intensidad: discomfort.intensidad,
            tipo_molestia: discomfort.tipo_molestia,
            notas_molestias: discomfort.notas_molestias,
            zonas,
          };
        })
        .filter(Boolean) || [];

    setTrainingData(trainings as TrainingItem[]);
    setDiscomfortData(discomforts as DiscomfortItem[]);
    setLoading(false);
  }

  const weeklyTraining = fillWeeklyTrainingData(trainingData);

  const completedWeeklyTraining = weeklyTraining.filter(
    (item) =>
      item.duracion !== null ||
      item.intensidad_percibida !== null ||
      item.carga_de_entrenamiento !== null
  );

  const dailyLoadMaxValue = Math.max(
    ...weeklyTraining.map(
      (item) => item.carga_de_entrenamiento || 0
    )
  );

  const dailyLoadChartMaxValue =
    dailyLoadMaxValue > 0 ? dailyLoadMaxValue + 100 : 1000;

  const monthlyTraining = trainingData.filter((item) => {
    const itemDate = new Date(item.fecha);
    const today = new Date();

    return (
      itemDate.getFullYear() === today.getFullYear() &&
      itemDate.getMonth() === today.getMonth()
    );
  });

  const totalSessions = completedWeeklyTraining.length;

  const totalMinutes = completedWeeklyTraining.reduce(
    (sum, item) => sum + (item.duracion || 0),
    0
  );

  const totalLoad = completedWeeklyTraining.reduce(
    (sum, item) => sum + (item.carga_de_entrenamiento || 0),
    0
  );

  const averageLoad =
    totalSessions > 0 ? Math.round(totalLoad / totalSessions) : 0;

  const averageIntensity =
    totalSessions > 0
      ? Math.round(
          completedWeeklyTraining.reduce(
            (sum, item) => sum + (item.intensidad_percibida || 0),
            0
          ) / totalSessions
        )
      : 0;

  const typeDistribution = useMemo(() => {
    const result: Record<string, number> = {};

    monthlyTraining.forEach((item) => {
      const type = item.tipo_entrenamiento || "Sin tipo";
      result[type] = (result[type] || 0) + 1;
    });

    return Object.entries(result);
  }, [monthlyTraining]);

  const weeklyLoad = useMemo(() => {
    return groupLoadByWeek(monthlyTraining);
  }, [monthlyTraining]);

  const monthlyTotalLoad = monthlyTraining.reduce(
    (sum, item) => sum + (item.carga_de_entrenamiento || 0),
    0
  );

  const monthlyTotalMinutes = monthlyTraining.reduce(
    (sum, item) => sum + (item.duracion || 0),
    0
  );

  const last7Discomfort = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    return discomfortData.filter((item) => {
      const itemDate = new Date(item.fecha);
      return itemDate >= sevenDaysAgo && itemDate <= today;
    });
  }, [discomfortData]);

  const currentMonthDiscomfort = useMemo(() => {
    const now = new Date();

    return discomfortData.filter((item) => {
      const date = new Date(item.fecha);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [discomfortData]);

  const recentDiscomfort = useMemo(() => {
    const limitDate = new Date();

    limitDate.setMonth(limitDate.getMonth() - 2);

    return discomfortData.filter((item) => {
      const itemDate = new Date(item.fecha);

      return itemDate >= limitDate;
    });
  }, [discomfortData]);

  const averageDiscomfortIntensity =
    last7Discomfort.length > 0
      ? Math.round(
          last7Discomfort.reduce(
            (sum, item) => sum + (item.intensidad || 0),
            0
          ) / last7Discomfort.length
        )
      : 0;

  const affectedAreas = [
    ...new Set(currentMonthDiscomfort.flatMap((item) => item.zonas)),
  ];

  const areaCount = countBy(
    currentMonthDiscomfort.flatMap((item) => item.zonas)
  );

  const typeCount = countBy(
    currentMonthDiscomfort.map((item) => item.tipo_molestia || "Sin tipo")
  );

  if (loading) {
    return (
      <CoachLayout title="Detalle deportista">
        <Text className="text-gray-500">Cargando datos...</Text>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title={athleteName}>
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
                  subtitle="Sesiones registradas"
                />

                <View className="gap-3">
                  {trainingData.length > 0 ? (
                    trainingData.slice(0, 7).map((item, index) => (
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
                      No hay entrenamientos registrados.
                    </Text>
                  )}
                </View>
              </AppCard>

              <AppCard>
                <SectionTitle
                  title="Comentarios de entrenamiento"
                  subtitle="Últimos comentarios registrados"
                />

                <View className="gap-3">
                  {trainingData.filter((item) => item.notas_entrenamiento).length >
                  0 ? (
                    trainingData
                      .filter((item) => item.notas_entrenamiento)
                      .slice(0, 4)
                      .map((item, index) => (
                        <View
                          key={`${item.fecha}-comment-${index}`}
                          className="bg-slate-50 rounded-2xl p-4"
                        >
                          <Text className="font-bold text-gray-900">
                            {formatDate(item.fecha)}
                          </Text>
                          <Text className="text-gray-600 mt-1">
                            {item.notas_entrenamiento}
                          </Text>
                        </View>
                      ))
                  ) : (
                    <Text className="text-gray-500">
                      No hay comentarios registrados.
                    </Text>
                  )}
                </View>
              </AppCard>
            </>
          )}

          {trainingTab === "trends" && (
            <View className="gap-5">
              <AppCard>
                <SectionTitle title="Evolución de carga" />
                {weeklyTraining.length > 0 ? (
                  <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
                    <BarChart
                      data={weeklyTraining
                        .map((item) => ({
                          value: item.carga_de_entrenamiento || 0,
                          label: dayOnly(item.fecha),
                        }))}
                      height={170}
                      barWidth={18}
                      spacing={22}
                      initialSpacing={12}
                      endSpacing={12}
                      roundedTop
                      frontColor="#2563EB"
                      maxValue={dailyLoadChartMaxValue}
                      noOfSections={5}
                      yAxisLabelSuffix=" AU"
                      yAxisTextStyle={{
                        color: "#6B7280",
                        fontSize: 8,
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
                      yAxisLabelWidth={40}
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
                <SectionTitle title="Duración" />
                {weeklyTraining.length > 0 ? (
                  <View className="bg-violet-50 rounded-2xl p-4 overflow-hidden">
                    <LineChart
                      data={weeklyTraining
                        .map((item) => ({
                          value: item.duracion || 0,
                          label: dayOnly(item.fecha),
                        }))}
                      height={180}
                      areaChart
                      initialSpacing={12}
                      endSpacing={12}
                      startFillColor="#8B5CF6"
                      endFillColor="#DDD6FE"
                      startOpacity={0.4}
                      endOpacity={0.05}
                      color="#7C3AED"
                      formatYLabel={(value) =>
                        Math.round(Number(value)).toString()
                      }
                      thickness={3}
                      dataPointsColor="#7C3AED"
                      yAxisLabelSuffix=" min"
                      maxValue={
                        Math.max(
                          ...weeklyTraining.map((item) => item.duracion || 0),
                          60
                        )
                      }
                      noOfSections={5}
                      yAxisTextStyle={{
                        color: "#6B7280",
                        fontSize: 10,
                      }}
                      xAxisLabelTextStyle={{
                        color: "#6B7280",
                        fontSize: 8,
                      }}
                      xAxisColor="#CBD5E1"
                      yAxisColor="#CBD5E1"
                      rulesColor="#E5E7EB"
                      rulesType="solid"
                      yAxisThickness={1}
                      xAxisThickness={1}
                      yAxisLabelWidth={40}
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
                <SectionTitle title="Intensidad" />
                {weeklyTraining.length > 0 ? (
                  <View className="bg-amber-50 rounded-2xl p-4 overflow-hidden">
                    <LineChart
                      data={weeklyTraining
                        .map((item) => ({
                          value: item.intensidad_percibida || 0,
                          label: dayOnly(item.fecha),
                        }))}
                      height={180}
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
                      maxValue={10}
                      noOfSections={5}
                      formatYLabel={(value) =>
                        Math.round(Number(value)).toString()
                      }
                      yAxisTextStyle={{
                        color: "#6B7280",
                        fontSize: 10,
                      }}
                      xAxisLabelTextStyle={{
                        color: "#6B7280",
                        fontSize: 8,
                      }}
                      xAxisColor="#CBD5E1"
                      yAxisColor="#CBD5E1"
                      rulesColor="#E5E7EB"
                      rulesType="solid"
                      yAxisThickness={1}
                      xAxisThickness={1}
                      yAxisLabelWidth={35}
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
            </View>
          )}

          {trainingTab === "monthly" && (
            <AppCard>
              <SectionTitle
                title="Resumen mensual"
                subtitle="Carga, distribución y estadísticas"
              />

              {weeklyLoad.length > 0 ? (
                <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
                  <BarChart
                    data={weeklyLoad.map((item) => ({
                      value: item.value,
                      label: item.label,
                    }))}
                    height={180}
                    barWidth={28}
                    spacing={28}
                    initialSpacing={20}
                    endSpacing={20}
                    frontColor="#2563EB"
                    maxValue={
                      Math.max(
                        ...weeklyLoad.map((item) => item.value || 0),
                        1000
                      )
                    }
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
                    yAxisLabelWidth={45}
                  />
                </View>
              ) : (
                <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center">
                  <Text className="text-gray-500">
                    Sin datos suficientes
                  </Text>
                </View>
              )}

              <View className="mt-5 gap-4">
                <View className="bg-slate-50 rounded-2xl p-4">
                  <Text className="font-bold text-gray-900 mb-3">
                    Distribución por tipo
                  </Text>

                  <View className="gap-3">
                    {typeDistribution.length > 0 ? (
                      typeDistribution.map(([type, count]) => (
                        <View
                          key={type}
                          className="flex-row justify-between bg-emerald-50 rounded-2xl p-3"
                        >
                          <Text className="font-semibold text-emerald-700">
                            {type}
                          </Text>
                          <Text className="font-bold text-emerald-700">
                            {count} {count === 1 ? "sesión" : "sesiones"}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-500">
                        No hay tipos registrados.
                      </Text>
                    )}
                  </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-4">
                  <Text className="font-bold text-gray-900 mb-3">
                    Estadísticas mensuales
                  </Text>

                  <View className="gap-3">
                    <StatRow label="Sesiones" value={`${monthlyTraining.length}`} />
                    <StatRow label="Carga total" value={`${monthlyTotalLoad} AU`} />
                    <StatRow
                      label="Tiempo total"
                      value={formatMinutes(monthlyTotalMinutes)}
                    />
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
            <MetricCard title="Total mes" value={currentMonthDiscomfort.length} />
            <MetricCard title="Últimos 7 días" value={last7Discomfort.length} />
          </View>

          <View className="flex-row gap-3 mb-6">
            <MetricCard
              title="Intensidad media"
              value={
                averageDiscomfortIntensity
                  ? `${averageDiscomfortIntensity}/10`
                  : "-"
              }
            />
            <MetricCard title="Zonas afectadas" value={affectedAreas.length} />
          </View>

          <AppCard className="mb-6">
            <SectionTitle
              title="Historial de molestias"
              subtitle="Últimos registros del deportista (2 meses max.)"
            />

            <View className="gap-3">
              {recentDiscomfort.length > 0 ? (
                recentDiscomfort.slice(0, 5).map((item, index) => {
                  const intensityStyle = getIntensityColor(
                    item.intensidad || 0
                  );

                  return (
                    <View
                      key={`${item.fecha}-${index}`}
                      className="bg-slate-50 rounded-2xl p-4"
                    >
                      <View className="flex-row justify-between mb-1">
                        <Text className="font-bold text-gray-900">
                          {item.zonas.length > 0
                            ? item.zonas.join(", ")
                            : "Zona no especificada"}
                        </Text>

                        <View
                          className={`${intensityStyle.bg} rounded-full px-3 py-1`}
                        >
                          <Text
                            className={`${intensityStyle.text} text-xs font-bold`}
                          >
                            {item.intensidad || 0}/10
                          </Text>
                        </View>
                      </View>

                      <Text className="text-gray-500">
                        {formatDate(item.fecha)}
                      </Text>

                      <Text className="text-blue-600 font-semibold mt-1">
                        {item.tipo_molestia || "Sin tipo"}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-gray-500">
                  No hay molestias registradas.
                </Text>
              )}
            </View>
          </AppCard>

          <AppCard className="mb-6">
            <SectionTitle
              title="Zonas más afectadas"
              subtitle="Frecuencia acumulada"
            />

            <View className="gap-3">
              {Object.entries(areaCount).length > 0 ? (
                Object.entries(areaCount).map(([area, count], index) => (
                  <View
                    key={area}
                    className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                        <Text className="font-bold text-gray-500">
                          {index + 1}
                        </Text>
                      </View>

                      <Text className="font-semibold text-gray-800">{area}</Text>
                    </View>

                    <Text className="text-gray-500 text-sm">
                      {count} {count === 1 ? "vez" : "veces"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">
                  No hay zonas registradas.
                </Text>
              )}
            </View>
          </AppCard>

          <AppCard className="mb-6">
            <SectionTitle
              title="Tipos de molestias"
              subtitle="Tipos registrados durante el último mes"
            />

            <View className="gap-3">
              {Object.entries(typeCount).length > 0 ? (
                Object.entries(typeCount).map(([type, count]) => (
                  <View
                    key={type}
                    className="flex-row justify-between bg-amber-100 rounded-2xl p-3"
                  >
                    <Text className="font-bold text-amber-800">{type}</Text>
                    <Text className="font-semibold text-amber-800">
                      {count} {count === 1 ? "registro" : "registros"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">
                  No hay tipos registrados este mes.
                </Text>
              )}
            </View>
          </AppCard>

          <AppCard>
            <SectionTitle
              title="Comentarios de molestias"
              subtitle="Últimos comentarios registrados"
            />

            <View className="gap-3">
              {discomfortData.filter((item) => item.notas_molestias).length > 0 ? (
                discomfortData
                  .filter((item) => item.notas_molestias)
                  .slice(0, 5)
                  .map((item, index) => (
                    <View
                      key={`${item.fecha}-comment-${index}`}
                      className="bg-slate-50 rounded-2xl p-4"
                    >
                      <Text className="font-bold text-gray-900">
                        {formatDate(item.fecha)}
                      </Text>
                      <Text className="text-gray-600 mt-1">
                        {item.notas_molestias}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text className="text-gray-500">
                  No hay comentarios registrados.
                </Text>
              )}
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

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
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

function getIntensityColor(intensity: number) {
  if (intensity <= 4) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    };
  }

  if (intensity <= 7) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
    };
  }

  return {
    bg: "bg-red-100",
    text: "text-red-700",
  };
}