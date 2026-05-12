import { Text, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import MetricCard from "../../src/components/ui/MetricCard";

export default function AthleteDashboard() {
  return (
    <AthleteLayout title="Dashboard">
      <Text className="text-gray-600 mb-4">¡Bienvenido/a, Usuario!</Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard title="Carga" value="630" subtitle="Alta" status="warning" />
        <MetricCard title="Sueño" value="8" subtitle="Bueno" status="good" />
      </View>

      <View className="flex-row gap-3">
        <MetricCard title="HRV" value="70 ms" subtitle="Normal" status="normal" />
        <MetricCard title="Ánimo" value="8/10" subtitle="Bueno" status="good" />
      </View>
    </AthleteLayout>
  );
}