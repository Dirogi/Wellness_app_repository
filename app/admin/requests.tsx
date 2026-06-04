import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import AdminLayout from "../../src/components/layout/AdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type RequestItem = {
  id_usuario: string;
  nombre_apellidos: string;
  correo_electronico: string;
  rol: string;
};

export default function AdminRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from("usuarios")
      .select("id_centro")
      .eq("id_usuario", user.id)
      .single();

    if (adminError || !adminData) {
      console.log("Error obteniendo admin:", adminError?.message);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id_usuario,
        nombre_apellidos,
        correo_electronico,
        id_estado_cuenta,
        id_centro,
        roles(
          nombre_rol
        )
      `)
      .eq("id_centro", adminData.id_centro)
      .eq("id_estado_cuenta", 4)
      .order("nombre_apellidos", { ascending: true });

    if (error) {
      console.log("Error cargando solicitudes:", error.message);
      setLoading(false);
      return;
    }

    const formatted =
      data
        ?.filter((user: any) => {
          const rol = user.roles?.nombre_rol;
          return rol === "entrenador" || rol === "staff_medico";
        })
        .map((user: any) => ({
          id_usuario: user.id_usuario,
          nombre_apellidos: user.nombre_apellidos,
          correo_electronico: user.correo_electronico,
          rol: user.roles?.nombre_rol || "Sin rol",
        })) || [];

    setRequests(formatted);
    setLoading(false);
  }

  async function approveRequest(idUsuario: string) {
    Alert.alert(
      "Aprobar solicitud",
      "Esta acción activará la cuenta del trabajador. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: async () => {
            const { error } = await supabase.rpc(
              "admin_cambiar_estado_usuario",
              {
                p_id_usuario: idUsuario,
                p_id_estado_cuenta: 2,
              }
            );

            if (error) {
              Alert.alert(
                "Error",
                "No se ha podido aprobar la solicitud."
              );
              return;
            }

            await loadRequests();
          },
        },
      ]
    );
  }

  async function rejectRequest(idUsuario: string) {
    Alert.alert(
      "Rechazar solicitud",
      "Esta acción bloqueará la cuenta del trabajador. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc(
              "admin_cambiar_estado_usuario",
              {
                p_id_usuario: idUsuario,
                p_id_estado_cuenta: 3,
              }
            );

            if (error) {
              Alert.alert(
                "Error",
                "No se ha podido rechazar la solicitud."
              );
              return;
            }

            await loadRequests();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Solicitudes">
        <Text className="text-gray-500">Cargando solicitudes...</Text>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Solicitudes">
        <AppCard>
            <Text className="text-gray-500 mb-6">
                Trabajadores que han configurado sus credenciales y esperan aprobación.
            </Text>

            <View className="gap-4">
                {requests.length > 0 ? (
                requests.map((request) => (
                    <AppCard key={request.id_usuario}>
                    <SectionTitle
                        title={request.nombre_apellidos}
                        subtitle={request.correo_electronico}
                    />

                    <View className="bg-amber-50 rounded-2xl p-3 mb-4">
                        <Text className="text-amber-700 font-semibold">
                        Solicitud pendiente
                        </Text>

                        <Text className="text-amber-700 text-sm mt-1">
                        Rol solicitado: {request.rol}
                        </Text>
                    </View>

                    <View className="gap-3">
                        <AppButton
                        title="Aprobar solicitud"
                        onPress={() => approveRequest(request.id_usuario)}
                        />

                        <AppButton
                        title="Rechazar solicitud"
                        variant="danger"
                        onPress={() => rejectRequest(request.id_usuario)}
                        />
                    </View>
                    </AppCard>
                ))
                ) : (
                <Text className="text-gray-500">
                    No hay solicitudes pendientes.
                </Text>
                )}
            </View>
        </AppCard>
    </AdminLayout>
  );
}