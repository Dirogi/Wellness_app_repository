import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

type MainTab = "heart" | "discomfort";

const heartWeekData = [
  { day: "Lun", hrv: 72, restingHr: 48, comment: "Medición estable.", date: "08/04/2026" },
  { day: "Mar", hrv: 68, restingHr: 50, comment: "Ligera bajada de HRV.", date: "09/04/2026" },
  { day: "Mié", hrv: 75, restingHr: 47, comment: "Buenas sensaciones.", date: "10/04/2026" },
  { day: "Jue", hrv: 64, restingHr: 52, comment: "Más cansancio de lo habitual.", date: "11/04/2026" },
  { day: "Vie", hrv: 70, restingHr: 49, comment: "Sin observaciones relevantes.", date: "12/04/2026" },
];

const discomfortData = [
  { date: "12/04/2026", area: "Lumbar", intensity: 2, type: "Sobrecarga" },
  { date: "10/04/2026", area: "Rodilla izquierda", intensity: 3, type: "Dolor" },
  { date: "03/04/2026", area: "Gemelo derecho", intensity: 1, type: "Pinchazo" },
  { date: "02/04/2026", area: "Lumbar", intensity: 3, type: "Sobrecarga" },
  { date: "30/03/2026", area: "Rodilla izquierda", intensity: 5, type: "Dolor" },
];

export default function MedicalAthleteDetailScreen() {
  const [mainTab, setMainTab] = useState<MainTab>("heart");

  const latest = heartWeekData[heartWeekData.length - 1];

  return (
    <MedicalStaffLayout title="Laura Martín">
      <Text className="text-gray-500 mb-6">Vista del deportista asignado</Text>

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
            <MetricCard title="HRV actual" value={`${latest.hrv} ms`} />
            <MetricCard title="FC en reposo" value={`${latest.restingHr} bpm`} />
          </View>

          <AppCard className="mb-6">
            <SectionTitle title="Variabilidad de la frecuencia cardiaca" />
            <SimpleLineChart
              data={heartWeekData.map((item) => ({
                label: item.day,
                value: item.hrv,
              }))}
              maxValue={100}
            />
          </AppCard>

          <AppCard className="mb-6">
            <SectionTitle title="Frecuencia cardiaca en reposo" />
            <SimpleLineChart
              data={heartWeekData.map((item) => ({
                label: item.day,
                value: item.restingHr,
              }))}
              maxValue={80}
            />
          </AppCard>

          <AppCard>
            <SectionTitle
              title="Observaciones de frecuencia cardiaca"
              subtitle="Últimos comentarios del deportista"
            />

            <View className="gap-3">
              {heartWeekData.slice(0, 5).map((item, index) => (
                <View
                  key={`${item.date}-${index}`}
                  className="bg-slate-50 rounded-2xl p-4"
                >
                  <Text className="font-bold text-gray-900">{item.date}</Text>
                  <Text className="text-gray-600 mt-1">{item.comment}</Text>
                </View>
              ))}
            </View>
          </AppCard>
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
            <SectionTitle title="Molestias recientes" />

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
            <SectionTitle title="Zonas más afectadas" />

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
            <SectionTitle title="Tipos de molestias" />

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
            <SectionTitle title="Comentarios de molestias" />

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
            <View className="w-3 h-3 bg-blue-500 rounded-full" style={{ marginBottom: height }} />
            <Text className="text-[10px] text-gray-400 mt-2">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}