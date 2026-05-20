import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const initialAthletes = [
  { id: 1, name: "Laura Martín", coach: "Entrenador 1" },
  { id: 2, name: "Carlos Pérez", coach: "Entrenador 1" },
  { id: 3, name: "Marta Ruiz", coach: "Entrenador 2" },
  { id: 4, name: "Diego Gómez", coach: null },
  { id: 5, name: "Ana López", coach: "Entrenador 2" },
  { id: 6, name: "Pablo Torres", coach: "Entrenador 2" },
  { id: 7, name: "Lucía Sánchez", coach: "Entrenador 1" },
  { id: 8, name: "Sergio Molina", coach: null },
  { id: 9, name: "Irene García", coach: "Entrenador 1" },
  { id: 10, name: "Marcos Díaz", coach: null },
  { id: 11, name: "Elena Romero", coach: "Entrenador 1" },
  { id: 12, name: "Javier Peña", coach: "Entrenador 1" },
  { id: 13, name: "Nerea Castro", coach: null },
  { id: 14, name: "Álvaro Gil", coach: "Entrenador 1" },
];

export default function CoachAthletesScreen() {
  const [search, setSearch] = useState("");
  const [athletes, setAthletes] = useState(initialAthletes);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) =>
      athlete.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [athletes, search]);

  function assignAthlete(id: number) {
    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id === id
          ? { ...athlete, coach: "Tú" }
          : athlete
      )
    );
  }

  return (
    <CoachLayout title="Deportistas">
      <AppCard>
        <SectionTitle
          title="Todos los deportistas"
          subtitle="Deportistas del mismo centro"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar deportista..."
          placeholderTextColor="#9CA3AF"
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 mb-4"
        />

        <View className="flex-row px-3 mb-3">
          <Text className="flex-1 font-bold text-gray-700">Nombre</Text>
          <Text className="w-32 font-bold text-gray-700 text-right">
            Entrenador
          </Text>
        </View>

        <View className="gap-3">
          {filteredAthletes.map((athlete) => (
            <View
              key={athlete.id}
              className="bg-slate-50 rounded-2xl p-4 flex-row items-center"
            >
              <Text className="flex-1 font-semibold text-gray-900">
                {athlete.name}
              </Text>

              {athlete.coach ? (
                <Text className="w-32 text-right text-gray-600 font-medium">
                  {athlete.coach}
                </Text>
              ) : (
                <Pressable
                  onPress={() => assignAthlete(athlete.id)}
                  className="bg-emerald-100 rounded-full px-4 py-2"
                >
                  <Text className="text-emerald-700 font-bold">
                    Asignar
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </AppCard>
    </CoachLayout>
  );
}