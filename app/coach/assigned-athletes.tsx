import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import CoachLayout from "../../src/components/layout/CoachLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import { supabase } from "../../src/lib/supabase";

type AssignedAthlete = {
  id_asignacion: number;
  id_deportista: number;
  name: string;
};

export default function AssignedAthletesScreen() {
  const [isUnassignMode, setIsUnassignMode] = useState(false);
  const [athletes, setAthletes] = useState<AssignedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);
  const [hasUnassignedChanges, setHasUnassignedChanges] = useState(false);

  useEffect(() => {
    loadAssignedAthletes();
  }, []);

  async function loadAssignedAthletes() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: worker, error: workerError } = await supabase
      .from("trabajadores")
      .select("id_trabajador")
      .eq("id_usuario", userId)
      .single();

    if (workerError || !worker) {
      console.log("Error obteniendo entrenador:", workerError?.message);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("asignaciones")
      .select(`
        id_asignacion,
        id_deportista,
        deportistas(
          usuarios(
            nombre_apellidos,
            id_estado_cuenta
          )
        )
      `)
      .eq("id_trabajador", worker.id_trabajador)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error cargando deportistas asignados:", error.message);
      setLoading(false);
      return;
    }

    const formatted =
    data
      ?.filter((item: any) => {
        const deportista = first(item.deportistas);
        const usuario = first(deportista?.usuarios);

        return usuario?.id_estado_cuenta === 2;
      })
      .map((item: any) => {
        const deportista = first(item.deportistas);
        const usuario = first(deportista?.usuarios);

        return {
          id_asignacion: item.id_asignacion,
          id_deportista: item.id_deportista,
          name: usuario?.nombre_apellidos || "Deportista",
        };
      }) || [];

    setAthletes(formatted);
    setLoading(false);
  }

  function handleAthletePress(idDeportista: number) {
    if (isUnassignMode) return;

    router.push({
      pathname: "/coach/athlete-detail",
      params: { athleteId: idDeportista },
    } as never);
  }

  async function unassignAthlete(idAsignacion: number) {
    if (unassigningId === idAsignacion) return;
    setUnassigningId(idAsignacion);

    const { error } = await supabase
      .from("asignaciones")
      .update({ active: false })
      .eq("id_asignacion", idAsignacion);

    if (error) {
      console.log("Error desasignando deportista:", error.message);
      setUnassigningId(null);
      return;
    }

    setAthletes((prev) =>
      prev.filter((athlete) => athlete.id_asignacion !== idAsignacion)
    );

    setHasUnassignedChanges(true);

    setUnassigningId(null);

    console.log("Deportista desasignado correctamente");
  }

  if (loading) {
    return (
      <CoachLayout title="Deportistas asignados">
        <Text className="text-gray-500">Cargando deportistas...</Text>
      </CoachLayout>
    );
  }


  return (
    <CoachLayout title="Deportistas asignados">
      <AppCard>
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-2xl font-bold text-gray-900">
            Mi lista de deportistas
          </Text>

          <Pressable
            onPress={() => {
              setIsUnassignMode(!isUnassignMode);
              setHasUnassignedChanges(false);
            }}
            className={`px-4 py-2 rounded-full ${
              isUnassignMode ? "bg-gray-200" : "bg-red-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                isUnassignMode ? "text-gray-700" : "text-red-600"
              }`}
            >
              {isUnassignMode
                ? hasUnassignedChanges
                  ? "Finalizar"
                  : "Cancelar"
                : "Desasignar"}
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          {athletes.length > 0 ? (
            athletes.map((athlete) => (
              <Pressable
                key={athlete.id_asignacion}
                onPress={() => handleAthletePress(athlete.id_deportista)}
                className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between"
              >
                <Text className="font-bold text-gray-900">
                  {athlete.name}
                </Text>

                {isUnassignMode && (
                  <Pressable
                    onPress={() => unassignAthlete(athlete.id_asignacion)}
                    disabled={unassigningId === athlete.id_asignacion}
                    className="w-8 h-8 rounded-full bg-red-100 items-center justify-center"
                  >
                    <Text className="text-red-600 font-bold">✕</Text>
                  </Pressable>
                )}
              </Pressable>
            ))
          ) : (
            <Text className="text-gray-500">
              No tienes deportistas asignados actualmente.
            </Text>
          )}
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

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}