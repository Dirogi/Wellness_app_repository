import Slider from "@react-native-community/slider";
import { Text, View } from "react-native";

type AppSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

export default function AppSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  suffix = "/10",
}: AppSliderProps) {
  return (
    <View className="mb-5">
      <View className="flex-row justify-between mb-2">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        <Text className="text-sm font-bold text-blue-600">
          {value}{suffix}
        </Text>
      </View>

      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#2563EB"
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor="#2563EB"
      />
    </View>
  );
}