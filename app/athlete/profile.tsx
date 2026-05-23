import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { logout } from "../../src/lib/auth";

export default function ProfileScreen() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
        email: "usuario@email.com",
        sport: "Baloncesto",
        birthDay: "12",
        birthMonth: "08",
        birthYear: "2001",
        gender: "Masculino",
        height: "1.82",
        weight: "75",
        menstrualEnabled: false,
    });

  function updateField(key: string, value: string) {
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
                onPress={() => setEditing(!editing)}
                className="bg-blue-500 px-4 py-2 rounded-xl"
            >
                <Text className="text-white font-semibold">
                {editing ? "Guardar" : "Editar"}
                </Text>
            </TouchableOpacity>
            </View>

            <View className="items-center mb-6">
            <Text className="text-6xl">👤</Text>

            <Text className="font-bold text-xl mt-3">
                Usuario Apellido1 Apellido2
            </Text>

            <Text className="text-gray-500">
                Deportista
            </Text>
            </View>

            <ProfileField
            label="Correo electrónico"
            value={profile.email}
            editing={editing}
            onChange={(v: string) => updateField("email", v)}
            />

            <ProfileField
            label="Deporte"
            value={profile.sport}
            editing={editing}
            keyboardType="email-address"
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
                    onPress={() =>
                        setProfile((prev) => ({
                        ...prev,
                        menstrualEnabled: true,
                        }))
                    }
                    className={`p-3 rounded-2xl ${
                        profile.menstrualEnabled ? "bg-green-100" : "bg-gray-100"
                    }`}
                    style={{ opacity: profile.menstrualEnabled ? 1 : 0.4 }}
                    >
                    <Text className="text-3xl">✅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        setProfile((prev) => ({
                        ...prev,
                        menstrualEnabled: false,
                        }))
                    }
                    className={`p-3 rounded-2xl ${
                        !profile.menstrualEnabled ? "bg-red-100" : "bg-gray-100"
                    }`}
                    style={{ opacity: !profile.menstrualEnabled ? 1 : 0.4 }}
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
          <AppButton
            title="Cerrar sesión"
            onPress={logout}
          />

          <AppButton
            title="Eliminar cuenta"
            onPress={() => {}}
          />
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
          <Text className="text-gray-700">{value}</Text>
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
  const formattedDate = `${day}/${month}/${year}`;

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