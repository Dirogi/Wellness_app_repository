import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import MedicalStaffLayout from "../../src/components/layout/MedicalStaffLayout";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type Athlete = {
  id_deportista: number;
  name: string;
  medicalStaff: string | null;
};

export default function MedicalStaffAthletesScreen() {
  const [search, setSearch] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

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

    if (!userId) {
      setLoading(false);
      return;
    }

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

    if (!currentUser || !worker) {
      setLoading(false);
      return;
    }

    setWorkerId(worker.id_trabajador);

    const { data: athletesData, error: athletesError } = await supabase
      .from("deportistas")
      .select(`
        id_deportista,
        usuarios(
          nombre_apellidos,
          id_centro,
          id_estado_cuenta
        )
      `);

    if (athletesError) {
      console.log("Error cargando deportistas:", athletesError.message);
      setLoading(false);
      return;
    }

    const { data: assignmentsData, error: assignmentsError } =
      await supabase.rpc("get_same_center_active_assignments");

    if (assignmentsError) {
      console.log("Error cargando asignaciones:", assignmentsError.message);
      setLoading(false);
      return;
    }

    const formatted =
      athletesData
        ?.filter((item: any) => {
          const usuario = first(item.usuarios);

          return (
            usuario?.id_centro === currentUser.id_centro &&
            usuario?.id_estado_cuenta === 2
          );
        })
        .map((item: any) => {
          const usuario = first(item.usuarios);

          const medicalAssignment = assignmentsData?.find(
            (assignment: any) =>
              assignment.id_deportista === item.id_deportista &&
              assignment.tipo_trabajador === "staff_medico"
          );

          return {
            id_deportista: item.id_deportista,
            name: usuario?.nombre_apellidos || "Deportista",
            medicalStaff: medicalAssignment?.trabajador_nombre || null,
          };
        }) || [];

    setAthletes(formatted);
    setLoading(false);
  }

  async function assignAthlete(idDeportista: number) {
    if (!workerId || assigningId === idDeportista) return;

    setAssigningId(idDeportista);

    const { error } = await supabase.from("asignaciones").insert({
      id_deportista: idDeportista,
      id_trabajador: workerId,
      active: true,
    });

    if (error) {
      console.log("Error asignando deportista:", error.message);
      setAssigningId(null);
      return;
    }

    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id_deportista === idDeportista
          ? { ...athlete, medicalStaff: "Tú" }
          : athlete
      )
    );

    setAssigningId(null);
  }

  if (loading) {
    return (
      <MedicalStaffLayout title="Deportistas">
        <Text className="text-gray-500">Cargando deportistas...</Text>
      </MedicalStaffLayout>
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
          onChangeText={(value) => setSearch(value.slice(0, 80))}
          placeholder="Buscar deportista..."
          maxLength={80}
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
          {filteredAthletes.length > 0 ? (
            filteredAthletes.map((athlete) => (
              <View
                key={athlete.id_deportista}
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
                    onPress={() => assignAthlete(athlete.id_deportista)}
                    disabled={assigningId === athlete.id_deportista}
                    className="bg-emerald-100 rounded-full px-4 py-2"
                  >
                    <Text className="text-emerald-700 font-bold">
                      {assigningId === athlete.id_deportista
                        ? "Asignando..."
                        : "Asignar"}
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
    </MedicalStaffLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}