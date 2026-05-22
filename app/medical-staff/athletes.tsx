import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";

const initialAthletes = [
  { id: 1, name: "Laura Martín", medicalStaff: "Staff médico 1" },
  { id: 2, name: "Carlos Pérez", medicalStaff: "Staff médico 3" },
  { id: 3, name: "Marta Ruiz", medicalStaff: "Staff médico 2" },
  { id: 4, name: "Diego Gómez", medicalStaff: null },
  { id: 5, name: "Ana López", medicalStaff: "Staff médico 2" },
  { id: 6, name: "Pablo Torres", medicalStaff: "Staff médico 2" },
  { id: 7, name: "Lucía Sánchez", medicalStaff: "Staff médico 1" },
  { id: 8, name: "Sergio Molina", medicalStaff: null },
  { id: 9, name: "Irene García", medicalStaff: "Staff médico 1" },
  { id: 10, name: "Marcos Díaz", medicalStaff: null },
  { id: 11, name: "Elena Romero", medicalStaff: "Staff médico 3" },
  { id: 12, name: "Javier Peña", medicalStaff: "Staff médico 1" },
  { id: 13, name: "Nerea Castro", medicalStaff: null },
  { id: 14, name: "Álvaro Gil", medicalStaff: "Staff médico 1" },
];

export default function MedicalStaffAthletesScreen() {
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
          ? { ...athlete, medicalStaff: "Tú" }
          : athlete
      )
    );
  }

  return (
    <MedicalStaffLayout title="Deportistas">
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
          <Text className="w-36 font-bold text-gray-700 text-right">
            Staff médico
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

              {athlete.medicalStaff ? (
                <Text className="w-36 text-right text-gray-600 font-medium">
                  {athlete.medicalStaff}
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
    </MedicalStaffLayout>
  );
}