import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

export default function AthleteDashboard() {
  return (
    <AthleteLayout title="Dashboard">
      <Text className="text-gray-500 mb-6">
        ¡Bienvenido/a, Usuario! Hoy es martes, 7 de abril.
      </Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Carga"
          value="630 AU"
          subtitle="Alta"
          status="warning"
        />
        <MetricCard
          title="Sueño"
          value="7.8 h"
          subtitle="Bueno"
          status="good"
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV"
          value="72 ms"
          subtitle="Normal"
          status="normal"
        />
        <MetricCard
          title="Ánimo"
          value="8/10"
          subtitle="Bueno"
          status="good"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado general"
          subtitle="Resumen calculado a partir de sueño, fatiga, HRV y estado de ánimo"
        />

        <View className="items-center justify-center py-4">
          <Text className="text-5xl font-bold text-emerald-600">8/10</Text>
          <Text className="text-gray-500 mt-2">
            Buen estado para entrenar
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Tendencia de frecuencia cardiaca"
          subtitle="Últimos 7 días"
        />

        <View className="h-36 bg-blue-50 rounded-2xl items-center justify-center">
          <Text className="text-blue-600 font-semibold">
            Gráfico HRV / FC reposo
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle title="Tendencia de sueño" subtitle="Últimos 7 días" />

        <View className="h-36 bg-teal-50 rounded-2xl items-center justify-center">
          <Text className="text-teal-600 font-semibold">
            Gráfico de sueño
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Entrenamientos recientes"
          subtitle="Últimas sesiones registradas"
        />

        <View className="gap-3">
          <View className="flex-row justify-between border-b border-gray-100 pb-3">
            <View>
              <Text className="font-semibold text-gray-900">Fuerza tren superior</Text>
              <Text className="text-gray-500 text-sm">60 min · RPE 7</Text>
            </View>
            <Text className="font-bold text-blue-600">420 AU</Text>
          </View>

          <View className="flex-row justify-between border-b border-gray-100 pb-3">
            <View>
              <Text className="font-semibold text-gray-900">Carrera suave</Text>
              <Text className="text-gray-500 text-sm">45 min · RPE 4</Text>
            </View>
            <Text className="font-bold text-blue-600">180 AU</Text>
          </View>

          <View className="flex-row justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Movilidad</Text>
              <Text className="text-gray-500 text-sm">30 min · RPE 3</Text>
            </View>
            <Text className="font-bold text-blue-600">90 AU</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas"
          subtitle="Indicadores destacados del día"
        />

        <View className="gap-3">
          <View className="bg-amber-50 rounded-2xl p-3">
            <Text className="text-amber-700 font-semibold">
              Carga de entrenamiento elevada
            </Text>
            <Text className="text-amber-700 text-sm mt-1">
              Se recomienda revisar la recuperación antes de aumentar la intensidad.
            </Text>
          </View>

          <View className="bg-emerald-50 rounded-2xl p-3">
            <Text className="text-emerald-700 font-semibold">
              Sueño adecuado
            </Text>
            <Text className="text-emerald-700 text-sm mt-1">
              La duración del sueño se encuentra dentro de un rango positivo.
            </Text>
          </View>
        </View>
      </AppCard>
    </AthleteLayout>
  );
}