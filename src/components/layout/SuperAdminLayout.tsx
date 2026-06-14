import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type SuperAdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

type SuperAdminMenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const superAdminMenuItems: SuperAdminMenuItem[] = [
  { label: "Dashboard", icon: "home-outline", route: "/superadmin/dashboard" },
  { label: "Ciudades", icon: "business-outline", route: "/superadmin/cities" },
  { label: "Centros", icon: "location-outline", route: "/superadmin/centers" },
  { label: "Admins", icon: "shield-outline", route: "/superadmin/admins" },
  { label: "Perfil", icon: "person-outline", route: "/superadmin/profile" },
];

export default function SuperAdminLayout({
  children,
  title,
}: SuperAdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

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

      {isSidebarOpen && (
        <Pressable
          className="absolute inset-0 bg-black/20 z-40"
          onPress={() => setIsSidebarOpen(false)}
        />
      )}

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

          {superAdminMenuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => {
                router.push(item.route as never);
                setIsSidebarOpen(false);
              }}
              className="items-center justify-center py-3 px-2 rounded-2xl mb-2 active:bg-blue-100 w-20"
            >
              <Ionicons
                name={item.icon}
                size={28}
                color="#374151"
              />
              <Text className="text-[11px] text-center text-gray-700 font-medium">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

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