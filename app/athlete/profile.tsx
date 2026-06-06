import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { logout } from "../../src/lib/auth";
import { supabase } from "../../src/lib/supabase";

export default function AthleteProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [idUsuario, setIdUsuario] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    email: "",
    fullName: "",
    sport: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    gender: "",
    height: "",
    weight: "",
    menstrualEnabled: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) return;

    setIdUsuario(userId);

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id_usuario,
        nombre_apellidos,
        correo_electronico,
        deportistas(
          fecha_nacimiento,
          genero,
          altura,
          peso,
          deporte,
          opcion_ciclo_menstrual
        )
      `)
      .eq("id_usuario", userId)
      .single();

    if (error || !data) {
      console.log("Error cargando perfil:", error?.message);
      return;
    }

    const deportista = Array.isArray(data.deportistas)
      ? data.deportistas[0]
      : data.deportistas;

    const fecha = deportista?.fecha_nacimiento
      ? String(deportista.fecha_nacimiento).split("-")
      : ["", "", ""];

    setProfile({
      email: data.correo_electronico || "",
      fullName: data.nombre_apellidos || "",
      sport: deportista?.deporte || "",
      birthDay: fecha[2] || "",
      birthMonth: fecha[1] || "",
      birthYear: fecha[0] || "",
      gender: deportista?.genero || "",
      height: deportista?.altura ? String(deportista.altura) : "",
      weight: deportista?.peso ? String(deportista.peso) : "",
      menstrualEnabled: Boolean(deportista?.opcion_ciclo_menstrual),
    });
  }

  async function handleSave() {
    if (!idUsuario) return;

    const fechaNacimiento =
      profile.birthYear && profile.birthMonth && profile.birthDay
        ? `${profile.birthYear}-${profile.birthMonth}-${profile.birthDay}`
        : null;

    const { error: usuarioError } = await supabase
      .from("usuarios")
      .update({
        correo_electronico: profile.email,
        nombre_apellidos: profile.fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id_usuario", idUsuario);

    if (usuarioError) {
      console.log("Error actualizando usuario:", usuarioError.message);
      return;
    }

    const { error: deportistaError } = await supabase
      .from("deportistas")
      .update({
        deporte: profile.sport || null,
        fecha_nacimiento: fechaNacimiento,
        genero: profile.gender || null,
        altura: profile.height ? Number(profile.height) : null,
        peso: profile.weight ? Number(profile.weight) : null,
        opcion_ciclo_menstrual: profile.menstrualEnabled,
      })
      .eq("id_usuario", idUsuario);

    if (deportistaError) {
      console.log("Error actualizando deportista:", deportistaError.message);
      return;
    }

    setEditing(false);
    console.log("Perfil actualizado correctamente");
  }

  async function handleDeleteAccount() {
    if (!idUsuario) return;

    Alert.alert(
      "Eliminar cuenta",
      "Esta acción desactivará tu cuenta y cerrará la sesión. ¿Seguro que quieres continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              
              const { data: deportistaData, error: deportistaError } =
                await supabase
                  .from("deportistas")
                  .select("id_deportista")
                  .eq("id_usuario", idUsuario)
                  .single();

              if (deportistaError || !deportistaData) {
                Alert.alert(
                  "Error",
                  "No se ha encontrado el deportista."
                );
                return;
              }

              
              // Desactivar asignaciones
              const { error: asignacionesError } = await supabase.rpc(
                "desactivar_asignaciones_deportista",
                {
                  p_id_usuario: idUsuario,
                }
              );

              if (asignacionesError) {
                console.log(
                  "Error desactivando asignaciones:",
                  asignacionesError.message
                );

                Alert.alert(
                  "Error",
                  "No se han podido desactivar las asignaciones."
                );

                return;
              }
              // Obtener estado eliminada
              const { data: estadoEliminada } =
                await supabase
                  .from("estados_cuenta")
                  .select("id_estado_cuenta")
                  .eq("nombre_estado", "bloqueada")
                  .single();

              // Desactivar cuenta
              const { error } = await supabase
                .from("usuarios")
                .update({
                  id_estado_cuenta:
                    estadoEliminada?.id_estado_cuenta,
                  updated_at: new Date().toISOString(),
                })
                .eq("id_usuario", idUsuario);

              if (error) {
                Alert.alert(
                  "Error",
                  "No se ha podido eliminar la cuenta."
                );
                return;
              }

              // Cerrar sesión
              await logout();
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Error",
                "Ha ocurrido un error inesperado."
              );
            }
          },
        },
      ]
    );
  }

  function updateField(key: string, value: string | boolean) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <AthleteLayout title="Mi perfil">
      <AppCard className="mb-6">
        <View className="flex-row justify-between items-center mb-5">
          <SectionTitle title="Datos personales" />

          <TouchableOpacity
            onPress={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            className="bg-blue-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-semibold">
              {editing ? "Guardar" : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-6">
          <Text className="text-6xl">👤</Text>

          <Text className="font-bold text-xl mt-3 text-center">
            {profile.fullName || "Deportista"}
          </Text>

          <Text className="text-gray-500">Deportista</Text>
        </View>

        <ProfileField
          label="Nombre y apellidos"
          value={profile.fullName}
          editing={editing}
          onChange={(v: string) => updateField("fullName", v)}
        />

        <ProfileField
          label="Correo electrónico"
          value={profile.email}
          editing={editing}
          keyboardType="email-address"
          onChange={(v: string) => updateField("email", v)}
        />

        <ProfileField
          label="Deporte"
          value={profile.sport}
          editing={editing}
          onChange={(v: string) => updateField("sport", v)}
        />

        <BirthDateField
          editing={editing}
          day={profile.birthDay}
          month={profile.birthMonth}
          year={profile.birthYear}
          onChangeDay={(v: string) => updateField("birthDay", v)}
          onChangeMonth={(v: string) => updateField("birthMonth", v)}
          onChangeYear={(v: string) => updateField("birthYear", v)}
        />

        <ProfileField
          label="Género"
          value={profile.gender}
          editing={editing}
          onChange={(v: string) => updateField("gender", v)}
        />

        <ProfileField
          label="Altura (m)"
          value={profile.height}
          editing={editing}
          keyboardType="numeric"
          onChange={(v: string) => updateField("height", v)}
        />

        <ProfileField
          label="Peso (kg)"
          value={profile.weight}
          editing={editing}
          keyboardType="numeric"
          onChange={(v: string) => updateField("weight", v)}
        />

        <Text className="font-semibold mt-5 mb-3">
          Opción ciclo menstrual
        </Text>

        <View className="flex-row gap-4">
          <TouchableOpacity
            disabled={!editing}
            onPress={() => updateField("menstrualEnabled", true)}
            className={`p-3 rounded-2xl ${
              profile.menstrualEnabled ? "bg-green-100" : "bg-gray-100"
            }`}
            style={{
              opacity: editing
                ? profile.menstrualEnabled
                  ? 1
                  : 0.4
                : 0.9,
            }}
          >
            <Text className="text-3xl">✅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!editing}
            onPress={() => updateField("menstrualEnabled", false)}
            className={`p-3 rounded-2xl ${
              !profile.menstrualEnabled ? "bg-red-100" : "bg-gray-100"
            }`}
            style={{
              opacity: editing
                ? !profile.menstrualEnabled
                  ? 1
                  : 0.4
                : 0.9,
            }}
          >
            <Text className="text-3xl">❌</Text>
          </TouchableOpacity>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="Privacidad y seguridad" />

        <View className="bg-slate-50 p-4 rounded-2xl mb-4">
          <Text>• Tu entrenador puede ver entrenamiento y molestias</Text>
          <Text>• El staff médico puede ver molestias y frecuencia cardíaca</Text>
          <Text>• Tus datos personales permanecen privados</Text>
        </View>

        <View className="gap-4">
          <AppButton title="Cerrar sesión" onPress={logout} />
          <AppButton title="Eliminar cuenta" variant="danger" onPress={handleDeleteAccount} />
        </View>
      </AppCard>
    </AthleteLayout>
  );
}

function ProfileField({
  label,
  value,
  editing,
  onChange,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View className="mb-4">
      <Text className="font-semibold mb-2">{label}</Text>

      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3"
        />
      ) : (
        <View className="bg-slate-50 rounded-2xl p-4">
          <Text className="text-gray-700">{value || "Sin completar"}</Text>
        </View>
      )}
    </View>
  );
}

function BirthDateField({
  editing,
  day,
  month,
  year,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
}: {
  editing: boolean;
  day: string;
  month: string;
  year: string;
  onChangeDay: (value: string) => void;
  onChangeMonth: (value: string) => void;
  onChangeYear: (value: string) => void;
}) {
  const formattedDate =
    day && month && year ? `${day}/${month}/${year}` : "Sin completar";

  return (
    <View className="mb-4">
      <Text className="font-semibold mb-2">Fecha de nacimiento</Text>

      {editing ? (
        <View className="flex-row gap-2">
          <TextInput
            value={day}
            onChangeText={onChangeDay}
            placeholder="DD"
            keyboardType="numeric"
            maxLength={2}
            className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-center"
          />

          <TextInput
            value={month}
            onChangeText={onChangeMonth}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
            className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-center"
          />

          <TextInput
            value={year}
            onChangeText={onChangeYear}
            placeholder="AAAA"
            keyboardType="numeric"
            maxLength={4}
            className="flex-[1.4] bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-center"
          />
        </View>
      ) : (
        <View className="bg-slate-50 rounded-2xl p-4">
          <Text className="text-gray-700">{formattedDate}</Text>
        </View>
      )}
    </View>
  );
}