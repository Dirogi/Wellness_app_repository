import { ReactNode, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../../lib/supabase";

type AthleteLayoutProps = {
  children: ReactNode;
  title?: string;
};

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: "home-outline", route: "/athlete/dashboard" },
  { label: "Registro", icon: "create-outline", route: "/athlete/daily-register" },
  { label: "Entreno", icon: "barbell-outline", route: "/athlete/training" },
  { label: "Sueño", icon: "moon-outline", route: "/athlete/sleep" },
  { label: "Frecuencia Cardiaca", icon: "heart-outline", route: "/athlete/hrv" },
  { label: "Auto percepción", icon: "happy-outline", route: "/athlete/self-perception" },
  { label: "Molestias", icon: "warning-outline", route: "/athlete/discomfort" },
  { label: "Ciclo", icon: "calendar-outline", route: "/athlete/menstrual-cycle" },
  { label: "Perfil", icon: "person-outline", route: "/athlete/profile" },
];

export default function AthleteLayout({
  children,
  title,
}: AthleteLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [menstrualEnabled, setMenstrualEnabled] = useState(false);

  useEffect(() => {
  loadMenstrualOption();
}, []);

  async function loadMenstrualOption() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("deportistas")
      .select("opcion_ciclo_menstrual")
      .eq("id_usuario", user.id)
      .single();

    if (error || !data) {
      console.log("Error cargando opción ciclo:", error?.message);
      return;
    }

    setMenstrualEnabled(data.opcion_ciclo_menstrual === true);
  }

  const visibleMenuItems = menstrualEnabled
    ? menuItems
    : menuItems.filter(
        (item) => item.route !== "/athlete/menstrual-cycle"
      );

  return (
    
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
  
      {/* BOTÓN MENÚ */}
      <Pressable
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-12 left-5 z-50 w-24 h-16 rounded-3xl bg-white items-center justify-center shadow border border-gray-100"
      >
        <Ionicons
          name="menu"
          size={32}
          color="#374151"
        />
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
            <Ionicons
              name="close"
              size={30}
              color="#374151"
            />
          </Pressable>
          
          {visibleMenuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => {
                router.push(item.route as never);
                setIsSidebarOpen(false);
              }}
              className="items-center justify-center py-3 px-2 rounded-2xl mb-2 active:bg-blue-100 w-20"
            >
              <View className="mb-1">
                <Ionicons
                  name={item.icon}
                  size={28}
                  color="#374151"
                />
              </View>

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
          <Text className="text-4xl font-bold text-gray-900 mb-8 text-center">
            {title}
          </Text>
        )}

        {children}
      </ScrollView>
    </View>
  );
}