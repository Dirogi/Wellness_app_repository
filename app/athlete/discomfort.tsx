import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const discomfortData = [
  {
    date: "12/04/2026",
    area: "Lumbar",
    intensity: 1,
    type: "Sobrecarga",
    notes: "Molestia leve durante el entrenamiento",
  },
  {
    date: "10/04/2026",
    area: "Rodilla izquierda",
    intensity: 2,
    type: "Dolor",
    notes: "Molestia leve al correr",
  },
  {
    date: "03/04/2026",
    area: "Gemelo derecho",
    intensity: 1,
    type: "Pinchazo",
    notes: "Molestia leve durante el calentamiento",
  },
  {
    date: "02/04/2026",
    area: "Lumbar",
    intensity: 3,
    type: "Sobrecarga",
    notes: "Rigidez al finalizar la sesión",
  },
  {
    date: "30/03/2026",
    area: "Rodilla izquierda",
    intensity: 5,
    type: "Dolor",
    notes: "Molestia moderada",
  },
  {
    date: "29/03/2026",
    area: "Hombro",
    intensity: 1,
    type: "Rigidez",
    notes: "Molestia leve",
  },
  {
    date: "15/03/2026",
    area: "Gemelo derecho",
    intensity: 1,
    type: "Pinchazo",
    notes: "Molestia leve",
  },
];

export default function DiscomfortScreen() {
  const totalMonth = discomfortData.length;
  const last7Days = discomfortData.slice(0, 3);
  const averageIntensity = Math.round(
    last7Days.reduce((sum, item) => sum + item.intensity, 0) / last7Days.length
  );

  const affectedAreas = [...new Set(discomfortData.map((item) => item.area))];

  const areaCount = countBy(discomfortData.map((item) => item.area));
  const typeCount = countBy(discomfortData.slice(0, 5).map((item) => item.type));

  return (
    <AthleteLayout title="Molestias">
      <View className="flex-row gap-3 mb-3">
        <MetricCard title="Total mes" value={totalMonth} />
        <MetricCard title="Últimos 7 días" value={last7Days.length} />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard title="Intensidad media" value={`${averageIntensity}/10`} />
        <MetricCard title="Zonas afectadas" value={affectedAreas.length} />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Molestias recientes"
          subtitle="Últimos registros del deportista"
        />

        <View className="gap-3">
          {discomfortData.slice(0, 5).map((item, index) => (
            <View
              key={`${item.area}-${item.date}-${index}`}
              className="bg-slate-50 rounded-2xl p-4"
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-bold text-gray-900">{item.area}</Text>

                <View className="bg-emerald-100 px-3 py-1 rounded-full">
                  <Text className="text-emerald-700 text-xs font-bold">
                    {item.intensity}/10 · {getIntensityLabel(item.intensity)}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-500 text-sm">{item.date}</Text>
              <Text className="text-gray-700 text-sm mt-2">{item.notes}</Text>
              <Text className="text-blue-600 text-sm font-semibold mt-1">
                {item.type}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Zonas más afectadas"
          subtitle="Frecuencia acumulada anual"
        />

        <View className="gap-3">
          {Object.entries(areaCount).map(([area, count], index) => (
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
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Tipos de molestias"
          subtitle="Tipos registrados durante el último mes"
        />

        <View className="gap-3">
          {Object.entries(typeCount).map(([type, count]) => (
            <View
              key={type}
              className="flex-row justify-between bg-amber-100 rounded-2xl p-3"
            >
              <Text className="font-bold text-amber-800">{type}</Text>
              <Text className="font-semibold text-amber-800">
                {count} registros
              </Text>
            </View>
          ))}
        </View>
      </AppCard>
    </AthleteLayout>
  );
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