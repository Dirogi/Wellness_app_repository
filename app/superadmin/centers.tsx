import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import SuperAdminLayout from "../../src/components/layout/SuperAdminLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import AppInput from "../../src/components/ui/AppInput";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type CityItem = {
  id_ciudad: number;
  nombre_ciudad: string;
  active: boolean;
};

type CenterItem = {
  id_centro: number;
  nombre_centro: string;
  id_ciudad: number;
  active: boolean;
  ciudades?:
    | {
        nombre_ciudad: string;
      }
    | {
        nombre_ciudad: string;
      }[];
};

export default function SuperAdminCenters() {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [centers, setCenters] = useState<CenterItem[]>([]);

  const [centerName, setCenterName] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingCenterId, setUpdatingCenterId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: citiesData, error: citiesError } = await supabase
      .from("ciudades")
      .select("id_ciudad, nombre_ciudad, active")
      .eq("active", true)
      .order("nombre_ciudad", { ascending: true });

    const { data: centersData, error: centersError } = await supabase
      .from("centros")
      .select(`
        id_centro,
        nombre_centro,
        id_ciudad,
        active,
        ciudades(
          nombre_ciudad
        )
      `)
      .order("nombre_centro", { ascending: true });

    if (citiesError || centersError) {
      console.log("Error cargando centros:", {
        citiesError,
        centersError,
      });
      setLoading(false);
      return;
    }

    setCities(citiesData || []);
    setCenters(centersData || []);
    setLoading(false);
  }

  async function createCenter() {
    if (saving) return;

    const cleanedCenterName = centerName.trim();

    if (!cleanedCenterName || !selectedCityId) {
      Alert.alert(
        "Campos incompletos",
        "Introduce el nombre del centro y selecciona una ciudad."
      );
      return;
    }

    if (cleanedCenterName.length > 100) {
      Alert.alert(
        "Nombre demasiado largo",
        "El nombre del centro no puede superar los 100 caracteres."
      );
      return;
    }

    const centerAlreadyExists = centers.some(
      (center) =>
        center.nombre_centro.trim().toLowerCase() ===
          cleanedCenterName.toLowerCase() &&
        center.id_ciudad === selectedCityId
    );

    if (centerAlreadyExists) {
      Alert.alert(
        "Centro ya existente",
        "Ya existe un centro con ese nombre en la ciudad seleccionada."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("centros")
      .insert({
        nombre_centro: cleanedCenterName,
        id_ciudad: selectedCityId,
        active: true,
      });

    if (error) {
      Alert.alert("Error", "No se ha podido crear el centro.");
      setSaving(false);
      return;
    }

    setCenterName("");
    setSelectedCityId(null);
    await loadData();
    setSaving(false);
  }

  async function toggleCenterStatus(center: CenterItem) {
    Alert.alert(
      center.active ? "Desactivar centro" : "Activar centro",
      center.active
        ? "El centro dejará de estar disponible para nuevos registros. Los datos existentes no se eliminarán."
        : "El centro volverá a estar disponible para nuevos registros.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: center.active ? "Desactivar" : "Activar",
          style: center.active ? "destructive" : "default",
          onPress: async () => {
            if (updatingCenterId === center.id_centro) return;

            setUpdatingCenterId(center.id_centro);

            const { error } = await supabase
              .from("centros")
              .update({
                active: !center.active,
              })
              .eq("id_centro", center.id_centro);

            if (error) {
              Alert.alert(
                "Error",
                "No se ha podido cambiar el estado del centro."
              );

              setUpdatingCenterId(null);
              return;
            }

            await loadData();
            setUpdatingCenterId(null);
          },
        },
      ]
    );
  }

const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      const centerName = center.nombre_centro.toLowerCase();
      const cityName = first(center.ciudades)?.nombre_ciudad?.toLowerCase() || "";
      const query = search.toLowerCase();

      return centerName.includes(query) || cityName.includes(query);
    });
  }, [centers, search]);

  if (loading) {
    return (
      <SuperAdminLayout title="Centros">
        <Text className="text-gray-500">Cargando centros...</Text>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Centros">
      <Text className="text-gray-500 mb-6 text-center">
        Gestiona los centros deportivos disponibles en cada ciudad.
      </Text>

      <AppCard className="mb-6">
        <SectionTitle
          title="Nuevo centro"
          subtitle="Añade un centro deportivo a una ciudad activa"
        />

        <AppInput
          label="Nombre del centro"
          value={centerName}
          onChangeText={(value) => setCenterName(value.slice(0, 100))}
          placeholder="Ej. Centro Alto Rendimiento Zaragoza"
          maxLength={100}
        />

        <Text className="text-gray-700 font-semibold mb-2">
          Ciudad
        </Text>

        <View className="gap-2 mb-6">
          {cities.length > 0 ? (
            cities.map((city) => (
              <Pressable
                key={city.id_ciudad}
                onPress={() => setSelectedCityId(city.id_ciudad)}
                className={`rounded-2xl p-3 ${
                  selectedCityId === city.id_ciudad
                    ? "bg-purple-100"
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
            ))
          ) : (
            <Text className="text-gray-500">
              No hay ciudades activas disponibles.
            </Text>
          )}
        </View>

        <AppButton
          title={saving ? "Creando..." : "Crear centro"}
          variant="purple"
          disabled={saving}
          onPress={createCenter}
        />
      </AppCard>

      <AppCard className="mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          Buscar centro
        </Text>

        <Text className="text-gray-500 mb-1">
          Busca por nombre de centro o ciudad.
        </Text>

        <AppInput
          label=""
          value={search}
          onChangeText={(value) => setSearch(value.slice(0, 100))}
          placeholder="Buscar centro o ciudad..."
          maxLength={100}
        />
      

        <View className="gap-4">
          {filteredCenters.length > 0 ? (
            filteredCenters.map((center) => (
              <AppCard key={center.id_centro}>
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-bold text-gray-900">
                      {center.nombre_centro}
                    </Text>

                    <Text className="text-gray-500 text-sm mt-1">
                      {first(center.ciudades)?.nombre_ciudad || "Ciudad no especificada"}
                    </Text>

                    <Text className="text-gray-500 text-sm mt-1">
                      {center.active
                        ? "Disponible para nuevos registros"
                        : "No disponible para nuevos registros"}
                    </Text>
                  </View>

                  <View
                    className={`px-3 py-1 rounded-full ${
                      center.active ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        center.active ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {center.active ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>

                {center.nombre_centro !== "Administración global" && (
                  <AppButton
                    title={
                      updatingCenterId === center.id_centro
                        ? "Actualizando..."
                        : center.active
                        ? "Desactivar centro"
                        : "Activar centro"
                    }
                    variant={center.active ? "danger" : undefined}
                    disabled={updatingCenterId === center.id_centro}
                    onPress={() => toggleCenterStatus(center)}
                  />
                )}
              </AppCard>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay centros registrados.
            </Text>
          )}
          
        </View>
      </AppCard>
    </SuperAdminLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}