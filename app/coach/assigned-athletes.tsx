import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";

const initialAssignedAthletes = [
  { id: 1, name: "Laura Martín" },
  { id: 2, name: "Carlos Pérez" },
  { id: 7, name: "Lucía Sánchez" },
  { id: 9, name: "Irene García" },
  { id: 11, name: "Elena Romero" },
  { id: 12, name: "Javier Peña" },
  { id: 14, name: "Álvaro Gil" },
];

export default function AssignedAthletesScreen() {
  const [isUnassignMode, setIsUnassignMode] = useState(false);
  const [athletes, setAthletes] = useState(initialAssignedAthletes);

  function handleAthletePress(id: number) {
    if (isUnassignMode) return;

    router.push({
      pathname: "/coach/athlete-detail",
      params: { athleteId: id },
    } as never);
  }

  function unassignAthlete(id: number) {
    setAthletes((prev) => prev.filter((athlete) => athlete.id !== id));
  }

  return (
    <CoachLayout title="Deportistas asignados">
      <AppCard>
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-2xl font-bold text-gray-900">
            Mi lista de deportistas
          </Text>

          <Pressable
            onPress={() => setIsUnassignMode(!isUnassignMode)}
            className={`px-4 py-2 rounded-full ${
              isUnassignMode ? "bg-gray-200" : "bg-red-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                isUnassignMode ? "text-gray-700" : "text-red-600"
              }`}
            >
              {isUnassignMode ? "Cancelar" : "Desasignar"}
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          {athletes.map((athlete) => (
            <Pressable
              key={athlete.id}
              onPress={() => handleAthletePress(athlete.id)}
              className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between"
            >
              <Text className="font-bold text-gray-900">
                {athlete.name}
              </Text>

              {isUnassignMode && (
                <Pressable
                  onPress={() => unassignAthlete(athlete.id)}
                  className="w-8 h-8 rounded-full bg-red-100 items-center justify-center"
                >
                  <Text className="text-red-600 font-bold">✕</Text>
                </Pressable>
              )}
            </Pressable>
          ))}
        </View>

        {isUnassignMode && (
          <View className="mt-5">
            <AppButton
              title="Confirmar"
              onPress={() => setIsUnassignMode(false)}
            />
          </View>
        )}
      </AppCard>
    </CoachLayout>
  );
}