import { ReactNode, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

type AthleteLayoutProps = {
  children: ReactNode;
  title?: string;
};

type MenuItem = {
  label: string;
  icon: string;
  route: string;
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: "🏠", route: "/athlete/dashboard" },
  { label: "Registro", icon: "📝", route: "/athlete/daily-register" },
  { label: "Entreno", icon: "🏋️", route: "/athlete/training" },
  { label: "Sueño", icon: "🌙", route: "/athlete/sleep" },
  { label: "Frecuencia Cardiaca", icon: "❤️", route: "/athlete/hrv" },
  { label: "Auto percepción", icon: "🙂", route: "/athlete/self-perception" },
  { label: "Molestias", icon: "⚠️", route: "/athlete/discomfort" },
  { label: "Ciclo", icon: "📅", route: "/athlete/menstrual-cycle" },
  { label: "Perfil", icon: "👤", route: "/athlete/profile" },
];

export default function AthleteLayout({
  children,
  title,
}: AthleteLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    //<View className="flex-1 bg-slate-50">
    <View className="flex-1" style={{ backgroundColor: "#758d60" }}>
      {/* BOTÓN MENÚ */}
      <Pressable
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-12 left-5 z-50 w-24 h-16 rounded-3xl bg-white items-center justify-center shadow border border-gray-100"
      >
        <Text className="text-3xl">☰</Text>
      </Pressable>

      {/* OVERLAY OSCURO */}
      {isSidebarOpen && (
        <Pressable
          className="absolute inset-0 bg-black/20 z-40"
          onPress={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <View className="absolute left-5 top-12 w-24 bg-white z-50 rounded-3xl pt-4 pb-4 items-center shadow-xl border border-gray-100">
          <Pressable
            onPress={() => setIsSidebarOpen(false)}
            className="w-16 h-14 rounded-2xl bg-slate-100 items-center justify-center mb-4"
          >
            <Text className="text-3xl">☰</Text>
          </Pressable>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => {
                router.push(item.route as never);
                setIsSidebarOpen(false);
              }}
              className="items-center justify-center py-3 px-2 rounded-2xl mb-2 active:bg-blue-100 w-20"
            >
              <Text className="text-3xl mb-1">{item.icon}</Text>

              <Text className="text-[11px] text-center text-gray-700 font-medium">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* CONTENIDO */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 100,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {title && (
          /*<Text className="text-4xl font-bold text-gray-900 mb-5 ml-16">
            {title}
          </Text>*/
          <Text className="text-4xl font-bold text-white mb-5 ml-16">
            {title}
          </Text>
        )}

        {children}
      </ScrollView>
    </View>
  );
}