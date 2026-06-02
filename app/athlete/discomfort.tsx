import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type DiscomfortItem = {
  fecha: string;
  dolor: boolean;
  intensidad: number | null;
  tipo_molestia: string | null;
  notas_molestias: string | null;
  zonas: string[];
};

export default function DiscomfortScreen() {
  const [loading, setLoading] = useState(true);
  const [discomfortData, setDiscomfortData] = useState<DiscomfortItem[]>([]);

  useEffect(() => {
    loadDiscomfortData();
  }, []);

  async function loadDiscomfortData() {
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
        molestias(
          dolor,
          intensidad,
          tipo_molestia,
          notas_molestias,
          relaciones_molestias_zonas(
            zonas_corporales(nombre_zona)
          )
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .limit(365);

    if (error) {
      console.log("Error cargando molestias:", error.message);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const discomfort = first(item.molestias);

          if (!discomfort || !discomfort.dolor) return null;

          const zonas =
            discomfort.relaciones_molestias_zonas
              ?.map((rel: any) => {
                const zona = first(rel.zonas_corporales);
                return zona?.nombre_zona;
              })
              .filter(Boolean) || [];

          return {
            fecha: item.fecha,
            dolor: discomfort.dolor,
            intensidad: discomfort.intensidad,
            tipo_molestia: discomfort.tipo_molestia,
            notas_molestias: discomfort.notas_molestias,
            zonas,
          };
        })
        .filter(Boolean) || [];

    setDiscomfortData(formattedData as DiscomfortItem[]);
    setLoading(false);
  }

  const last7DaysData = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    return discomfortData.filter((item) => {
      const itemDate = new Date(item.fecha);
      return itemDate >= sevenDaysAgo && itemDate <= today;
    });
  }, [discomfortData]);

  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return discomfortData.filter((item) => {
      const date = new Date(item.fecha);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }, [discomfortData]);

  const totalMonth = currentMonthData.length;
  const totalLast7Days = last7DaysData.length;

  const averageIntensity =
    last7DaysData.length > 0
      ? Math.round(
          last7DaysData.reduce(
            (sum, item) => sum + (item.intensidad || 0),
            0
          ) / last7DaysData.length
        )
      : 0;

  const affectedAreas = [
    ...new Set(discomfortData.flatMap((item) => item.zonas)),
  ];

  const areaCount = countBy(discomfortData.flatMap((item) => item.zonas));

  const typeCount = countBy(
    currentMonthData.map((item) => item.tipo_molestia || "Sin tipo")
  );

  if (loading) {
    return (
      <AthleteLayout title="Molestias">
        <Text className="text-gray-500">Cargando molestias...</Text>
      </AthleteLayout>
    );
  }


  return (
    <AthleteLayout title="Molestias">
      <View className="flex-row gap-3 mb-3">
        <MetricCard title="Total mes" value={totalMonth} />
        <MetricCard title="Últimos 7 días" value={totalLast7Days} />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Intensidad media"
          value={averageIntensity ? `${averageIntensity}/10` : "-"}
        />
        <MetricCard title="Zonas afectadas" value={affectedAreas.length} />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Molestias recientes"
          subtitle="Últimos registros del deportista"
        />

        <View className="gap-3">
          {
            discomfortData.length > 0 ? (
              discomfortData.slice(0, 5).map((item, index) => {
                const intensityStyle = getIntensityColor(item.intensidad || 0);

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
                        className={`${intensityStyle.bg} px-3 py-1 rounded-full`}
                      >
                        <Text
                          className={`${intensityStyle.text} text-xs font-bold`}
                        >
                          {item.intensidad || 0}/10 ·{" "}
                          {getIntensityLabel(item.intensidad || 0)}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-gray-500 text-sm">
                      {formatDate(item.fecha)}
                    </Text>

                    {item.notas_molestias && (
                      <Text className="text-gray-700 text-sm mt-2">
                        {item.notas_molestias}
                      </Text>
                    )}

                    <Text className="text-blue-600 text-sm font-semibold mt-1">
                      {item.tipo_molestia || "Sin tipo"}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-gray-500">
                No hay molestias registradas.
              </Text>
            )
          }
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Zonas más afectadas"
          subtitle="Frecuencia acumulada anual"
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
              No hay zonas afectadas registradas.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard>
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
              No hay tipos de molestias registrados este mes.
            </Text>
          )}
        </View>
      </AppCard>
    </AthleteLayout>
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

function getIntensityLabel(intensity: number) {
  if (intensity <= 3) return "Leve";
  if (intensity <= 6) return "Moderada";
  return "Alta";
}

function getIntensityColor(intensity: number) {
  if (intensity <= 3) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    };
  }

  if (intensity <= 6) {
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

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}