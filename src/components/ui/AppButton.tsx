import { Pressable, Text } from "react-native";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "purple" | "outline";
};

const variants = {
  primary: "bg-blue-600",
  secondary: "bg-teal-500",
  danger: "bg-red-500",
  purple: "bg-violet-600 active:bg-violet-700",
  outline: "bg-white border border-blue-600",
};

const textVariants = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  purple: "text-white",
  outline: "text-blue-600",
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-12 rounded-2xl items-center justify-center active:opacity-80 ${variants[variant]}`}
    >
      <Text className={`font-semibold text-base ${textVariants[variant]}`}>
        {title}
      </Text>
    </Pressable>
  );
}