import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type Athlete = {
  id_deportista: number;
  name: string;
  coach: string | null;
};

export default function CoachAthletesScreen() {
  const [search, setSearch] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [workerId, setWorkerId] = useState<number | null>(null);

  useEffect(() => {
    loadAthletes();
  }, []);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) =>
      athlete.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [athletes, search]);

  async function loadAthletes() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) return;

    const { data: currentUser } = await supabase
      .from("usuarios")
      .select("id_centro")
      .eq("id_usuario", userId)
      .single();

    const { data: worker } = await supabase
      .from("trabajadores")
      .select("id_trabajador")
      .eq("id_usuario", userId)
      .single();

    if (!currentUser || !worker) return;

    setWorkerId(worker.id_trabajador);

    const { data, error } = await supabase
      .from("deportistas")
      .select(`
        id_deportista,
        usuarios(
          nombre_apellidos,
          id_centro
        ),
        asignaciones(
          active,
          trabajadores(
            usuarios(
              nombre_apellidos
            ),
            tipos_trabajador(
              tipo
            )
          )
        )
      `)

    if (error) {
      console.log("Error cargando deportistas:", error.message);
      return;
    }

    const formatted =
      data
        ?.filter((item: any) => first(item.usuarios)?.id_centro === currentUser.id_centro)
        .map((item: any) => {
          const usuario = first(item.usuarios);

          const activeCoachAssignment = (item.asignaciones || []).find(
            (assignment: any) => {
              const trabajador = first(assignment.trabajadores);
              const tipo = first(trabajador?.tipos_trabajador);

              return assignment.active && tipo?.tipo === "entrenador";
            }
          );

          const trabajador = first(activeCoachAssignment?.trabajadores);
          const coachUser = first(trabajador?.usuarios);

          return {
            id_deportista: item.id_deportista,
            name: usuario?.nombre_apellidos || "Deportista",
            coach: coachUser?.nombre_apellidos || null,
          };
        }) || [];

    setAthletes(formatted);
  }

  async function assignAthlete(idDeportista: number) {
    if (!workerId) return;

    const { error } = await supabase.from("asignaciones").insert({
      id_deportista: idDeportista,
      id_trabajador: workerId,
      active: true,
    });

    if (error) {
      console.log("Error asignando deportista:", error.message);
      return;
    }

    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id_deportista === idDeportista
          ? { ...athlete, coach: "Tú" }
          : athlete
      )
    );

    console.log("Deportista asignado correctamente");
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
          {filteredAthletes.length > 0 ? (
            filteredAthletes.map((athlete) => (
              <View
                key={athlete.id_deportista}
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
                    onPress={() => assignAthlete(athlete.id_deportista)}
                    className="bg-emerald-100 rounded-full px-4 py-2"
                  >
                    <Text className="text-emerald-700 font-bold">
                      Asignar
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay deportistas disponibles en tu centro.
            </Text>
          )}
        </View>
      </AppCard>
    </CoachLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}