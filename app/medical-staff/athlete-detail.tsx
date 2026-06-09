import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import { dayOnly } from "../../src/utils/date";

type MainTab = "heart" | "discomfort";

type HeartItem = {
  fecha: string;
  hrv: number | null;
  fc_reposo: number | null;
  notas_fc: string | null;
};

type DiscomfortItem = {
  fecha: string;
  intensidad: number | null;
  tipo_molestia: string | null;
  notas_molestias: string | null;
  zonas: string[];
};

export default function MedicalAthleteDetailScreen() {
  const { athleteId } = useLocalSearchParams();

  const [mainTab, setMainTab] = useState<MainTab>("heart");
  const [loading, setLoading] = useState(true);

  const [athleteName, setAthleteName] = useState("Deportista");
  const [heartData, setHeartData] = useState<HeartItem[]>([]);
  const [discomfortData, setDiscomfortData] = useState<DiscomfortItem[]>([]);

  useEffect(() => {
    loadAthleteDetail();
  }, [athleteId]);

  async function loadAthleteDetail() {
    if (!athleteId) return;

    const idDeportista = Number(athleteId);

    const { data, error } = await supabase
      .from("deportistas")
      .select(`
        id_deportista,
        usuarios(
          nombre_apellidos
        ),
        registros_diarios(
          fecha,
          frecuencias_cardiacas(
            hrv,
            fc_reposo,
            notas_fc
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
      console.log("Error cargando detalle staff:", error?.message);
      setLoading(false);
      return;
    }

    const usuario = first((data as any).usuarios);
    setAthleteName(usuario?.nombre_apellidos || "Deportista");

    const registros = ((data as any).registros_diarios || []).sort(
      (a: any, b: any) => b.fecha.localeCompare(a.fecha)
    );

    const hearts =
      registros
        .map((registro: any) => {
          const heart = first(registro.frecuencias_cardiacas);
          if (!heart) return null;

          return {
            fecha: registro.fecha,
            hrv: heart.hrv,
            fc_reposo: heart.fc_reposo,
            notas_fc: heart.notas_fc,
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

    setHeartData(hearts as HeartItem[]);
    setDiscomfortData(discomforts as DiscomfortItem[]);
    setLoading(false);
  }

  const latestHeart = heartData[0];
  const weeklyHeartData = heartData.slice(0, 7).reverse();

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
    ...new Set(discomfortData.flatMap((item) => item.zonas)),
  ];

  const areaCount = countBy(discomfortData.flatMap((item) => item.zonas));

  const typeCount = countBy(
    currentMonthDiscomfort.map((item) => item.tipo_molestia || "Sin tipo")
  );

  if (loading) {
    return (
      <MedicalStaffLayout title="Detalle deportista">
        <Text className="text-gray-500">Cargando datos...</Text>
      </MedicalStaffLayout>
    );
  }

  return (
    <MedicalStaffLayout title={athleteName}>
      <Text className="text-gray-500 mb-6">
        Vista del deportista asignado
      </Text>

      <View className="flex-row bg-white rounded-full p-1 mb-6 border border-gray-100">
        <TabButton
          title="Frecuencia cardiaca"
          active={mainTab === "heart"}
          onPress={() => setMainTab("heart")}
        />

        <TabButton
          title="Molestias"
          active={mainTab === "discomfort"}
          onPress={() => setMainTab("discomfort")}
        />
      </View>

      {mainTab === "heart" && (
        <>
          <View className="flex-row gap-3 mb-6">
            <MetricCard
              title="HRV actual"
              value={latestHeart?.hrv ? `${latestHeart.hrv} ms` : "-"}
              subtitle={latestHeart ? "Última medición" : "Sin datos"}
              subtitleVariant="violet"
            />

            <MetricCard
              title="FC en reposo"
              value={
                latestHeart?.fc_reposo ? `${latestHeart.fc_reposo} bpm` : "-"
              }
              subtitle={latestHeart ? "Última medición" : "Sin datos"}
              subtitleVariant="violet"
            />
          </View>

          <AppCard className="mb-6">
            <SectionTitle
              title="Variabilidad de la frecuencia cardiaca"
              subtitle="Evolución semanal de la HRV"
            />

            {weeklyHeartData.length > 0 ? (
              <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
                <LineChart
                  data={weeklyHeartData.map((item) => ({
                    value: item.hrv || 0,
                    label: dayOnly(item.fecha),
                  }))}
                  height={180}
                  curved
                  areaChart
                  initialSpacing={12}
                  endSpacing={12}
                  startFillColor="#3B82F6"
                  endFillColor="#DBEAFE"
                  startOpacity={0.4}
                  endOpacity={0.05}
                  color="#2563EB"
                  thickness={3}
                  dataPointsColor="#2563EB"
                  maxValue={100}
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

          <AppCard className="mb-6">
            <SectionTitle
              title="Frecuencia cardiaca en reposo"
              subtitle="Evolución semanal"
            />

            {weeklyHeartData.length > 0 ? (
              <View className="bg-red-50 rounded-2xl p-4 overflow-hidden">
                <LineChart
                  data={weeklyHeartData.map((item) => ({
                    value: item.fc_reposo || 0,
                    label: dayOnly(item.fecha),
                  }))}
                  height={180}
                  curved
                  areaChart
                  initialSpacing={12}
                  endSpacing={12}
                  startFillColor="#EF4444"
                  endFillColor="#FEE2E2"
                  startOpacity={0.4}
                  endOpacity={0.05}
                  color="#DC2626"
                  thickness={3}
                  dataPointsColor="#DC2626"
                  maxValue={100}
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

          <AppCard>
            <SectionTitle
              title="Observaciones de frecuencia cardiaca"
              subtitle="Últimos comentarios del deportista"
            />

            <View className="gap-3">
              {heartData.filter((item) => item.notas_fc).length > 0 ? (
                heartData
                  .filter((item) => item.notas_fc)
                  .slice(0, 5)
                  .map((item, index) => (
                    <View
                      key={`${item.fecha}-heart-comment-${index}`}
                      className="bg-slate-50 rounded-2xl p-4"
                    >
                      <Text className="font-bold text-gray-900">
                        {formatDate(item.fecha)}
                      </Text>

                      <Text className="text-gray-600 mt-1">
                        {item.notas_fc}
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
              title="Molestias recientes"
              subtitle="Últimos registros del deportista"
            />

            <View className="gap-3">
              {discomfortData.length > 0 ? (
                discomfortData.slice(0, 5).map((item, index) => {
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

                      <Text className="font-semibold text-gray-800">
                        {area}
                      </Text>
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
                      {count} registros
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
              {discomfortData.filter((item) => item.notas_molestias).length >
              0 ? (
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
    </MedicalStaffLayout>
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
        className={`text-sm font-semibold text-center ${
          active ? "text-white" : "text-gray-600"
        }`}
      >
        {title}
      </Text>
    </Pressable>
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

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
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
