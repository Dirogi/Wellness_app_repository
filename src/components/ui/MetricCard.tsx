import { Text, View } from "react-native";
import AppCard from "./AppCard";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "excellent" | "good" | "warning" | "danger" | "noData";
  subtitleVariant?: "default" | "violet" | "fuchsia" | "cyan" | "indigo";
};

const statusStyles: Record<string, string> = {
  excellent: "bg-blue-100 text-blue-700",
  good: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  noData: "bg-gray-100 text-gray-700",
};

export default function MetricCard({
  title,
  value,
  subtitle,
  status = "noData",
  subtitleVariant = "default",
}: MetricCardProps) {
  return (
    <AppCard className="flex-1 min-h-[105px]">
      <View className="flex-1 justify-between items-center">
        <Text className="text-gray-500 text-sm font-medium text-center">{title}</Text>

        <Text className="text-gray-900 text-2xl font-bold mt-2 text-center">
          {value}
        </Text>

        {subtitle &&
          (subtitleVariant !== "default" ? (
            <View
              className={`px-2 py-1 rounded-full mt-2 ${
                subtitleVariant === "violet"
                  ? "bg-violet-100"
                  : subtitleVariant === "fuchsia"
                  ? "bg-fuchsia-100"
                  : subtitleVariant === "cyan"
                  ? "bg-cyan-100"
                  : "bg-indigo-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold text-center ${
                  subtitleVariant === "violet"
                    ? "text-violet-700"
                    : subtitleVariant === "fuchsia"
                    ? "text-fuchsia-700"
                    : subtitleVariant === "cyan"
                    ? "text-cyan-700"
                    : "text-indigo-700"
                }`}
              >
                {subtitle}
              </Text>
            </View>
          ) : (
            <Text
              className={`text-xs font-semibold px-2 py-1 rounded-full mt-2 text-center ${statusStyles[status]}`}
            >
              {subtitle}
            </Text>
          ))}
      </View>
    </AppCard>
  );
}