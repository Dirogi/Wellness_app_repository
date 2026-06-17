import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import AdminLayout from "../../src/components/layout/AdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import AppInput from "../../src/components/ui/AppInput";
import { supabase } from "../../src/lib/supabase";

type UserItem = {
  id_usuario: string;
  nombre_apellidos: string;
  correo_electronico: string;
  id_estado_cuenta: number;
  id_centro: number;
  rol: string;
  estado: string;
};

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [search, setSearch] = useState("");

  const [showAthletes, setShowAthletes] = useState(true);
  const [showCoaches, setShowCoaches] = useState(true);
  const [showMedical, setShowMedical] = useState(true);

  const [currentUserId, setCurrentUserId] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);
    // Obtener admin actual
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

    // Obtener usuarios del mismo centro
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
        ),
        estados_cuenta(
          nombre_estado
        )
      `)
      .eq("id_centro", adminData.id_centro)
      .order("nombre_apellidos", { ascending: true });

    if (error) {
      console.log("Error cargando usuarios admin:", error.message);
      setLoading(false);
      return;
    }

    const formatted =
      data?.map((user: any) => {
        const rol = first(user.roles);
        const estado = first(user.estados_cuenta);

        return {
          id_usuario: user.id_usuario,
          nombre_apellidos: user.nombre_apellidos || "Usuario",
          correo_electronico: user.correo_electronico || "-",
          id_estado_cuenta: user.id_estado_cuenta,
          id_centro: user.id_centro,
          rol: rol?.nombre_rol || "Sin rol",
          estado: estado?.nombre_estado || "Sin estado",
        };
      }) || [];

    setUsers(formatted);
    setLoading(false);
  }

  async function blockUser(idUsuario: string) {
        Alert.alert(
        "Bloquear cuenta",
        "Esta acción impedirá que el usuario pueda iniciar sesión. ¿Quieres continuar?",
        [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Bloquear",
              style: "destructive",
              onPress: async () => {
                if (updatingUserId === idUsuario) return;
                setUpdatingUserId(idUsuario);

                const { error } = await supabase
                .from("usuarios")
                .update({
                    id_estado_cuenta: 3,
                })
                .eq("id_usuario", idUsuario);

                if (error) {
                  Alert.alert("Error", "No se ha podido bloquear el usuario.");
                  setUpdatingUserId(null);
                  return;
                }

                await loadUsers();
                setUpdatingUserId(null);
              },
            },
        ]
        );
    }

  async function unblockUser(idUsuario: string) {
    Alert.alert(
      "Desbloquear cuenta",
      "Esta acción volverá a activar la cuenta del usuario. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desbloquear",
          onPress: async () => {
            if (updatingUserId === idUsuario) return;

            setUpdatingUserId(idUsuario);

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
                "No se ha podido desbloquear el usuario."
              );

              setUpdatingUserId(null);
              return;
            }

            await loadUsers();

            setUpdatingUserId(null);
          },
        },
      ]
    );
  }

  function getStatusStyle(idEstado: number) {
    if (idEstado === 1) {
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Pendiente",
      };
    }

    if (idEstado === 2) {
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Activa",
      };
    }

    if (idEstado === 4) {
      return {
        bg: "bg-violet-100",
        text: "text-violet-700",
        label: "Por aprobar",
      };
}

    return {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Bloqueada",
    };
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nombre_apellidos
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesRole =
      (showAthletes && user.rol === "deportista") ||
      (showCoaches && user.rol === "entrenador") ||
      (showMedical && user.rol === "staff_medico") ||
      user.rol === "admin";

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <AdminLayout title="Usuarios">
        <Text className="text-gray-500">Cargando usuarios...</Text>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Usuarios">
      <Text className="text-gray-500 mb-6 text-center">
        Gestión de cuentas registradas en la aplicación.
      </Text>

      <AppInput
        label="Buscar usuario"
        value={search}
        onChangeText={(value) => setSearch(value.slice(0, 80))}
        maxLength={80}
        placeholder="Buscar por nombre"
      />

      <View className="flex-row flex-wrap gap-3 mb-6">
        <Pressable
          onPress={() => setShowAthletes(!showAthletes)}
          className={`px-4 py-2 rounded-full ${
            showAthletes ? "bg-blue-100" : "bg-slate-100"
          }`}
        >
          <Text
            className={`font-semibold ${
              showAthletes ? "text-blue-700" : "text-gray-500"
            }`}
          >
            Deportistas
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowCoaches(!showCoaches)}
          className={`px-4 py-2 rounded-full ${
            showCoaches ? "bg-blue-100" : "bg-slate-100"
          }`}
        >
          <Text
            className={`font-semibold ${
              showCoaches ? "text-blue-700" : "text-gray-500"
            }`}
          >
            Entrenadores
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowMedical(!showMedical)}
          className={`px-4 py-2 rounded-full ${
            showMedical ? "bg-blue-100" : "bg-slate-100"
          }`}
        >
          <Text
            className={`font-semibold ${
              showMedical ? "text-blue-700" : "text-gray-500"
            }`}
          >
            Staff médico
          </Text>
        </Pressable>
      </View>

      <View className="gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const statusStyle = getStatusStyle(user.id_estado_cuenta);
            
            const isManageableUser = [
              "deportista",
              "entrenador",
              "staff_medico",
            ].includes(user.rol);

            return (
              <AppCard key={user.id_usuario}>
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-bold text-gray-900">
                      {user.nombre_apellidos}
                    </Text>

                    <Text className="text-gray-500 text-sm mt-1">
                      {user.correo_electronico}
                    </Text>

                    <Text className="text-blue-600 text-sm font-semibold mt-1">
                      {user.rol}
                    </Text>
                  </View>

                  <View
                    className={`${statusStyle.bg} px-3 py-1 rounded-full`}
                  >
                    <Text
                      className={`${statusStyle.text} text-xs font-bold`}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                {user.id_estado_cuenta === 2 &&
                  user.id_usuario !== currentUserId &&
                  isManageableUser && (
                    <AppButton
                      title="Bloquear cuenta"
                      variant="danger"
                      disabled={updatingUserId === user.id_usuario}
                      onPress={() => blockUser(user.id_usuario)}
                    />
                )}

                {user.id_estado_cuenta === 3 &&
                  user.id_usuario !== currentUserId &&
                  isManageableUser && (
                    <AppButton
                      title="Desbloquear cuenta"
                      disabled={updatingUserId === user.id_usuario}
                      onPress={() => unblockUser(user.id_usuario)}
                    />
                )}
              </AppCard>
            );
          })
        ) : (
          <Text className="text-gray-500">
            No hay usuarios que coincidan con los filtros.
          </Text>
        )}
      </View>
    </AdminLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}