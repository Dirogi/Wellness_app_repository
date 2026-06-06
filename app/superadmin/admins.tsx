import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import SuperAdminLayout from "../../src/components/layout/SuperAdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

export default function SuperAdminAdmins() {
  const [loading, setLoading] = useState(true);

  const [admins, setAdmins] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);

  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
        setLoading(true);

        const { data: adminsData, error: adminsError } = await supabase
        .from("usuarios")
        .select(`
            id_usuario,
            nombre_apellidos,
            correo_electronico,
            id_estado_cuenta,
            roles(
            nombre_rol
            ),
            ciudades(
            nombre_ciudad
            ),
            centros(
            nombre_centro
            )
        `);

        const { data: citiesData, error: citiesError } = await supabase
        .from("ciudades")
        .select("id_ciudad, nombre_ciudad, active")
        .eq("active", true)
        .order("nombre_ciudad", { ascending: true });

        const { data: centersData, error: centersError } = await supabase
        .from("centros")
        .select("id_centro, nombre_centro, id_ciudad, active")
        .eq("active", true)
        .order("nombre_centro", { ascending: true });

        if (adminsError || citiesError || centersError) {
        console.log("Error cargando admins:", {
            adminsError,
            citiesError,
            centersError,
        });
        setLoading(false);
        return;
    }

    setAdmins(
      adminsData?.filter((user: any) => user.roles?.nombre_rol === "admin") ||
        []
    );
    setCities(citiesData || []);
    setCenters(centersData || []);
    setLoading(false);
  }

  async function createAdmin() {
        if (!name || !email || !selectedCityId || !selectedCenterId) {
            Alert.alert(
            "Campos incompletos",
            "Completa todos los campos."
            );
            return;
        }

        const { error } = await supabase
            .from("admins_pre_registro")
            .insert({
            nombre_apellidos: name.trim(),
            correo_electronico: email.trim().toLowerCase(),
            id_ciudad: selectedCityId,
            id_centro: selectedCenterId,
            id_estado_cuenta: 1,
            });

        if (error) {
            console.log("Error creando preregistro admin:", error.message);

            Alert.alert(
            "Error",
            "No se ha podido crear el preregistro del admin."
            );

            return;
        }

        Alert.alert(
            "Admin pre-registrado",
            "El administrador ya puede activar su cuenta desde la pantalla de activación."
        );

        setName("");
        setEmail("");
        setSelectedCityId(null);
        setSelectedCenterId(null);

        await loadData();
    }

  async function changeAdminStatus(idUsuario: string, estado: number) {
    const { error } = await supabase.rpc("admin_cambiar_estado_usuario", {
      p_id_usuario: idUsuario,
      p_id_estado_cuenta: estado,
    });

    if (error) {
      Alert.alert("Error", "No se ha podido cambiar el estado del admin.");
      return;
    }

    await loadData();
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Admins">
        <Text className="text-gray-500">Cargando admins...</Text>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Admins">
      <Text className="text-gray-500 mb-6">
        Crea y gestiona administradores asociados a centros deportivos.
      </Text>

      <AppCard className="mb-6">
        <SectionTitle
          title="Nuevo admin"
          subtitle="Crea un administrador asociado a un centro"
        />

        <AppInput
          label="Nombre y apellidos"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Ana Administradora"
        />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@centro.com"
          keyboardType="email-address"
        />

        <Text className="font-semibold text-gray-700 mb-2">
          Ciudad
        </Text>

        <View className="gap-2 mb-4">
          {cities.map((city) => (
            <Pressable
              key={city.id_ciudad}
              onPress={() => {
                setSelectedCityId(city.id_ciudad);
                setSelectedCenterId(null);
              }}
              className={`rounded-2xl p-3 ${
                selectedCityId === city.id_ciudad
                  ? "bg-blue-100"
                  : "bg-slate-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  selectedCityId === city.id_ciudad
                    ? "text-blue-700"
                    : "text-gray-600"
                }`}
              >
                {city.nombre_ciudad}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="font-semibold text-gray-700 mb-2">
          Centro
        </Text>

        <View className="gap-2 mb-6">
          {centers
            .filter((center) =>
              selectedCityId ? center.id_ciudad === selectedCityId : false
            )
            .map((center) => (
              <Pressable
                key={center.id_centro}
                onPress={() => setSelectedCenterId(center.id_centro)}
                className={`rounded-2xl p-3 ${
                  selectedCenterId === center.id_centro
                    ? "bg-blue-100"
                    : "bg-slate-100"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedCenterId === center.id_centro
                      ? "text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  {center.nombre_centro}
                </Text>
              </Pressable>
            ))}

          {!selectedCityId && (
            <Text className="text-gray-500">
              Selecciona primero una ciudad.
            </Text>
          )}

          {selectedCityId &&
            centers.filter((center) => center.id_ciudad === selectedCityId)
              .length === 0 && (
              <Text className="text-gray-500">
                No hay centros activos en esta ciudad.
              </Text>
            )}
        </View>

        <AppButton title="Crear admin" onPress={createAdmin} />
      </AppCard>

      <View className="gap-4">
        {admins.length > 0 ? (
          admins.map((admin) => (
            <AppCard key={admin.id_usuario}>
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-bold text-gray-900">
                    {admin.nombre_apellidos}
                  </Text>

                  <Text className="text-gray-500 text-sm mt-1">
                    {admin.correo_electronico}
                  </Text>

                  <Text className="text-gray-500 text-sm mt-1">
                    {admin.centros?.nombre_centro || "Centro no especificado"}
                  </Text>

                  <Text className="text-gray-500 text-sm mt-1">
                    {admin.ciudades?.nombre_ciudad || "Ciudad no especificada"}
                  </Text>
                </View>

                <View
                  className={`px-3 py-1 rounded-full ${
                    admin.id_estado_cuenta === 2
                      ? "bg-emerald-100"
                      : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      admin.id_estado_cuenta === 2
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {admin.id_estado_cuenta === 2 ? "Activo" : "Bloqueado"}
                  </Text>
                </View>
              </View>

              {admin.id_estado_cuenta === 2 ? (
                <AppButton
                  title="Bloquear admin"
                  variant="danger"
                  onPress={() => changeAdminStatus(admin.id_usuario, 3)}
                />
              ) : (
                <AppButton
                  title="Desbloquear admin"
                  onPress={() => changeAdminStatus(admin.id_usuario, 2)}
                />
              )}
            </AppCard>
          ))
        ) : (
          <Text className="text-gray-500">
            No hay administradores registrados.
          </Text>
        )}
      </View>
    </SuperAdminLayout>
  );
}