import { Pressable, Text } from "react-native";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "purple" | "outline";
  disabled?: boolean;
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
  disabled = false,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-12 rounded-2xl items-center justify-center ${
        disabled
          ? "bg-gray-300"
          : `${variants[variant]} active:opacity-80`
      }`}
    >
      <Text
        className={`font-semibold text-base ${
          disabled ? "text-gray-500" : textVariants[variant]
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}