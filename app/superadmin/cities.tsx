import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";

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

export default function SuperAdminCities() {
  const [cityName, setCityName] = useState("");
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingCityId, setUpdatingCityId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    setLoading(true);

    const { data, error } = await supabase
      .from("ciudades")
      .select("id_ciudad, nombre_ciudad, active")
      .order("nombre_ciudad", { ascending: true });

    if (error) {
      console.log("Error cargando ciudades:", error.message);
      setLoading(false);
      return;
    }

    setCities(data || []);
    setLoading(false);
  }

  async function createCity() {
    if (saving) return;

    const cleanedCityName = cityName.trim();

    if (!cleanedCityName) {
      Alert.alert("Campo vacío", "Introduce el nombre de la ciudad.");
      return;
    }

    if (cleanedCityName.length > 80) {
      Alert.alert(
        "Nombre demasiado largo",
        "El nombre de la ciudad no puede superar los 80 caracteres."
      );
      return;
    }

    const cityAlreadyExists = cities.some(
      (city) =>
        city.nombre_ciudad.trim().toLowerCase() ===
        cleanedCityName.toLowerCase()
    );

    if (cityAlreadyExists) {
      Alert.alert(
        "Ciudad ya existente",
        "Ya existe una ciudad con ese nombre."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("ciudades").insert({
      nombre_ciudad: cleanedCityName,
      active: true,
    });

    if (error) {
      Alert.alert("Error", "No se ha podido crear la ciudad.");
      setSaving(false);
      return;
    }

    setCityName("");
    await loadCities();
    setSaving(false);
  }

  async function toggleCityStatus(city: CityItem) {
    Alert.alert(
      city.active ? "Desactivar ciudad" : "Activar ciudad",
      city.active
        ? "La ciudad y sus centros asociados dejarán de estar disponible para nuevos registros. Los datos existentes no se eliminarán."
        : "La ciudad volverá a estar disponible para nuevos registros.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: city.active ? "Desactivar" : "Activar",
          style: city.active ? "destructive" : "default",
          onPress: async () => {
            if (updatingCityId === city.id_ciudad) return;

            setUpdatingCityId(city.id_ciudad);

            const { error } = await supabase
              .from("ciudades")
              .update({
                active: !city.active,
              })
              .eq("id_ciudad", city.id_ciudad);

            if (error) {
              Alert.alert(
                "Error",
                "No se ha podido cambiar el estado de la ciudad."
              );

              setUpdatingCityId(null);
              return;
            }

            await loadCities();
            setUpdatingCityId(null);
          },
        },
      ]
    );
  }

  const filteredCities = useMemo(() => {
    return cities.filter((city) =>
      city.nombre_ciudad.toLowerCase().includes(search.toLowerCase())
    );
  }, [cities, search]);

  if (loading) {
    return (
      <SuperAdminLayout title="Ciudades">
        <Text className="text-gray-500">Cargando ciudades...</Text>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Ciudades">
      <Text className="text-gray-500 mb-6 text-center">
        Gestiona las ciudades disponibles en el sistema.
      </Text>

      <AppCard className="mb-6">
        <SectionTitle
          title="Nueva ciudad"
          subtitle="Añade una ciudad disponible para centros deportivos"
        />

        <AppInput
          label="Nombre de la ciudad"
          value={cityName}
          onChangeText={(value) => setCityName(value.slice(0, 80))}
          placeholder="Ej. Zaragoza"
          maxLength={80}
        />

        <AppButton
          title={saving ? "Creando..." : "Crear ciudad"}
          variant="purple"
          disabled={saving}
          onPress={createCity}
        />
      </AppCard>

      <AppCard className="mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          Buscar ciudad
        </Text>

        <Text className="text-gray-500 mb-4">
          Busca ciudades registradas en el sistema.
        </Text>

        <AppInput
          label=""
          value={search}
          onChangeText={(value) => setSearch(value.slice(0, 80))}
          placeholder="Buscar ciudad..."
          maxLength={80}
        />
      

        <View className="gap-4">
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <AppCard key={city.id_ciudad}>
                <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1 pr-3">
                      <Text className="text-lg font-bold text-gray-900">
                          {city.nombre_ciudad}
                      </Text>

                      <Text className="text-gray-500 text-sm mt-1">
                          {city.active
                          ? "Disponible para nuevos registros"
                          : "No disponible para nuevos registros"}
                      </Text>
                      </View>

                      <View
                      className={`px-3 py-1 rounded-full ${
                          city.active ? "bg-emerald-100" : "bg-red-100"
                      }`}
                      >
                      <Text
                          className={`text-xs font-bold ${
                          city.active ? "text-emerald-700" : "text-red-700"
                          }`}
                      >
                          {city.active ? "Activa" : "Inactiva"}
                      </Text>
                      </View>
                </View>
                {city.nombre_ciudad !== "Sistema" && (
                  <AppButton
                    title={
                      updatingCityId === city.id_ciudad
                        ? "Actualizando..."
                        : city.active
                        ? "Desactivar ciudad"
                        : "Activar ciudad"
                    }
                    variant={city.active ? "danger" : undefined}
                    disabled={updatingCityId === city.id_ciudad}
                    onPress={() => toggleCityStatus(city)}
                  />
                )}
              </AppCard>
            ))
          ) : (
            <Text className="text-gray-500">
              No hay ciudades registradas.
            </Text>
          )}
        </View>
      </AppCard>
    </SuperAdminLayout>
  );
}