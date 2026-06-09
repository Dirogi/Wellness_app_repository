import { Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

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
  const progress = useSharedValue(value);
  const minimumValue = useSharedValue(min);
  const maximumValue = useSharedValue(max);

  return (
    <View className="mb-5">
      <View className="flex-row justify-between mb-2">
        <Text className="text-sm font-medium text-gray-700">
          {label}
        </Text>

        <Text className="text-sm font-bold text-blue-600">
          {value}
          {suffix}
        </Text>
      </View>

      <View className="px-1">
        <Slider
          progress={progress}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          steps={Math.round((max - min) / step)}
          onValueChange={(newValue) => {
            const roundedValue =
              Math.round(newValue / step) * step;

            onChange(Number(roundedValue.toFixed(2)));
          }}
          theme={{
            minimumTrackTintColor: "#4f6bdc",
            maximumTrackTintColor: "#eedef8f3",
          }}
          renderBubble={() => null}
          renderMark={() => null}
          thumbWidth={17}
          sliderHeight={5}
          containerStyle={{
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}