import { ReactNode } from "react";
import { View } from "react-native";

type AppCardProps = {
  children: ReactNode;
  className?: string;
};

export default function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
    >
      {children}
    </View>
  );
}