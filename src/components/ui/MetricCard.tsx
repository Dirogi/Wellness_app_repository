import { Text, View } from "react-native";
import AppCard from "./AppCard";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "good" | "normal" | "warning" | "danger";
};

const statusStyles: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-700",
  normal: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export default function MetricCard({
  title,
  value,
  subtitle,
  status = "normal",
}: MetricCardProps) {
  return (
    <AppCard className="flex-1 min-h-[105px]">
      <View className="flex-1 justify-between">
        <Text className="text-gray-500 text-sm font-medium">{title}</Text>

        <Text className="text-gray-900 text-2xl font-bold mt-2">
          {value}
        </Text>

        {subtitle && (
          <Text
            className={`text-xs font-semibold px-2 py-1 rounded-full self-start mt-2 ${statusStyles[status]}`}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </AppCard>
  );
}