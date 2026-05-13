import { Text, View } from "react-native";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View className="mb-4">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>

      {subtitle && (
        <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
      )}
    </View>
  );
}