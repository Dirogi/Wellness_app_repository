import { Text, View } from "react-native";

import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const athletesWithDiscomfort = [
  { name: "Laura Martín", discomfort: "Rodilla izquierda", intensity: 3 },
  { name: "Carlos Pérez", discomfort: "Lumbar", intensity: 2 },
  { name: "Marta Ruiz", discomfort: "Gemelo derecho", intensity: 4 },
];

const hrvAlerts = [
  { name: "Laura Martín", hrv: 112 },
  { name: "Diego Gómez", hrv: 105 },
  { name: "Marta Ruiz", hrv: 101 },
];

const restingHrAlerts = [
  { name: "Carlos Pérez", restingHr: 62 },
  { name: "Lucía Sánchez", restingHr: 65 },
  { name: "Irene García", restingHr: 68 },
];

export default function MedicalStaffDashboard() {
  return (
    <MedicalStaffLayout title="Dashboard">
      <Text className="text-gray-500 mb-6">
        ¡Bienvenido/a, Staff médico! Hoy es martes, 7 de abril.
      </Text>

      <View className="mb-6">
        <MetricCard
          title="Deportistas asignados"
          value={6}
          subtitle="Activos"
          status="normal"
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Deportistas con molestias"
          subtitle="Molestias registradas recientemente"
        />

        <View className="gap-3">
          {athletesWithDiscomfort.map((athlete) => (
            <View
              key={athlete.name}
              className="bg-slate-50 rounded-2xl p-4"
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-bold text-gray-900">
                  {athlete.name}
                </Text>

                <View className="bg-amber-100 rounded-full px-3 py-1">
                  <Text className="text-amber-700 text-xs font-bold">
                    {athlete.intensity}/10
                  </Text>
                </View>
              </View>

              <Text className="text-gray-500">
                Molestia: {athlete.discomfort}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Alertas de HRV alta"
          subtitle="Valores destacados en la última medición"
        />

        <View className="gap-3">
          {hrvAlerts.map((alert) => (
            <View
              key={alert.name}
              className="bg-yellow-50 rounded-2xl p-4 flex-row justify-between items-center"
            >
              <Text className="font-bold text-yellow-700">
                {alert.name}
              </Text>

              <Text className="font-bold text-yellow-700">
                {alert.hrv} ms
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas de FC en reposo"
          subtitle="Valores superiores al rango esperado"
        />

        <View className="gap-3">
          {restingHrAlerts.map((alert) => (
            <View
              key={alert.name}
              className="bg-red-50 rounded-2xl p-4 flex-row justify-between items-center"
            >
              <Text className="font-bold text-red-700">
                {alert.name}
              </Text>

              <Text className="font-bold text-red-700">
                {alert.restingHr} bpm
              </Text>
            </View>
          ))}
        </View>
      </AppCard>
    </MedicalStaffLayout>
  );
}