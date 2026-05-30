import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";
import { dayOnly } from "../../src/utils/date";

type CycleItem = {
  fecha: string;
  menstruacion_activa: boolean;
  sangrado: number | null;
  dolor_menstrual: number | null;
  sintomas_fisicos: string[];
  sintomas_emocionales: string[];
};

export default function MenstrualCycleScreen() {
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState<CycleItem[]>([]);

  useEffect(() => {
    loadCycleData();
  }, []);

  async function loadCycleData() {
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
        ciclos_menstruales(
          id_menstruacion,
          menstruacion_activa,
          sangrado,
          dolor_menstrual,
          relaciones_sintomas_fisicos(
            sintomas_fisicos(nombre_sintoma_fisico)
          ),
          relaciones_sintomas_emocionales(
            sintomas_emocionales(nombre_sintoma_emocional)
          )
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .order("fecha", { ascending: false })
      .limit(30);

    if (error) {
      console.log("Error cargando ciclo menstrual:", error.message);
      return;
    }

    const formattedData =
      data
        ?.map((item: any) => {
          const cycle = first(item.ciclos_menstruales);
          if (!cycle) return null;

          const sintomasFisicos =
            cycle.relaciones_sintomas_fisicos?.map((rel: any) => {
              const sintoma = first(rel.sintomas_fisicos);
              return sintoma?.nombre_sintoma_fisico;
            }).filter(Boolean) || [];

          const sintomasEmocionales =
            cycle.relaciones_sintomas_emocionales?.map((rel: any) => {
              const sintoma = first(rel.sintomas_emocionales);
              return sintoma?.nombre_sintoma_emocional;
            }).filter(Boolean) || [];

          return {
            fecha: item.fecha,
            menstruacion_activa: cycle.menstruacion_activa,
            sangrado: cycle.sangrado,
            dolor_menstrual: cycle.dolor_menstrual,
            sintomas_fisicos: sintomasFisicos,
            sintomas_emocionales: sintomasEmocionales,
          };
        })
        .filter(Boolean) || [];

    setCycleData(formattedData as CycleItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Ciclo menstrual">
        <Text className="text-gray-500">Cargando ciclo menstrual...</Text>
      </AthleteLayout>
    );
  }

  const latest = cycleData[0];

  const latestBleeding = latest?.menstruacion_activa
    ? latest.sangrado || 0
    : 0;

  const latestPain = latest?.menstruacion_activa
    ? latest.dolor_menstrual || 0
    : 0;

  const activePeriodData = cycleData
    .filter((item) => item.menstruacion_activa)
    .slice()
    .reverse();

  const currentPhysicalSymptoms = latest?.menstruacion_activa
    ? latest.sintomas_fisicos
    : [];

  const currentEmotionalSymptoms = latest?.menstruacion_activa
    ? latest.sintomas_emocionales
    : [];

  return (
    <AthleteLayout title="Ciclo menstrual">
      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="Menstruación activa"
          value={latest?.menstruacion_activa ? "Sí" : "No"}
          subtitle={latest ? "Última medición" : "Sin datos"}
          status={latest?.menstruacion_activa ? "warning" : "normal"}
        />

        <AppCard className="flex-1 min-h-[105px] items-center">
          <Text className="text-gray-500 text-sm font-medium text-center mb-3">
            Sangrado
          </Text>

          <BloodDropIndicator value={latestBleeding} />

          <Text className="text-gray-900 text-2xl font-bold mt-3 text-center">
            {latestBleeding}/10
          </Text>
        </AppCard>

        <MetricCard
          title="Dolor menstrual"
          value={`${latestPain}/10`}
          subtitle={latest ? "Última medición" : "Sin datos"}
          status={
            latestPain >= 6 ? "danger" : latestPain >= 3 ? "warning" : "good"
          }
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Sangrado durante menstruación"
          subtitle="Solo días con menstruación activa"
        />

        {activePeriodData.length > 0 ? (
          <View className="bg-red-50 rounded-2xl p-4">
            <BarChart
              data={activePeriodData.map((item) => ({
                value: item.sangrado || 0,
                label: dayOnly(item.fecha),
              }))}
              height={180}
              barWidth={18}
              spacing={18}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              frontColor="#DC2626"
              maxValue={10}
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
        <SectionTitle title="Síntomas físicos" />

        {currentPhysicalSymptoms.length > 0 ? (
          <View className="gap-3">
            {currentPhysicalSymptoms.map((symptom) => (
              <View key={symptom} className="bg-slate-50 rounded-2xl p-3">
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
              <View key={symptom} className="bg-slate-50 rounded-2xl p-3">
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
  if (data.length === 0) {
    return (
      <View className="h-44 bg-slate-50 rounded-2xl p-4 items-center justify-center">
        <Text className="text-gray-500">Sin datos suficientes</Text>
      </View>
    );
  }

  return (
    <View className="h-44 bg-slate-50 rounded-2xl p-4 flex-row items-end justify-between">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 120;

        return (
          <View key={`${item.label}-${index}`} className="items-center flex-1">
            <View className="w-8 bg-red-400 rounded-t-xl" style={{ height }} />
            <Text className="text-[10px] text-gray-400 mt-2">
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}