import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppButton from "../../src/components/ui/AppButton";
import AppCard from "../../src/components/ui/AppCard";
import AppInput from "../../src/components/ui/AppInput";
import AppSlider from "../../src/components/ui/AppSlider";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type TabKey =
  | "training"
  | "sleep"
  | "heart"
  | "self"
  | "discomfort"
  | "cycle";


const baseTabs: { key: TabKey; label: string }[] = [
  { key: "training", label: "Entrenamiento" },
  { key: "sleep", label: "Sueño" },
  { key: "heart", label: "Frecuencia Cardiaca" },
  { key: "self", label: "Autopercepción" },
  { key: "discomfort", label: "Molestias" },
];


export default function DailyRegisterScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("training");
  const [completedTabs, setCompletedTabs] = useState<TabKey[]>([]);
  const [menstrualEnabled, setMenstrualEnabled] = useState(false);

  const [trainingType, setTrainingType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState(6);
  const [trainingNotes, setTrainingNotes] = useState("");

  const [sleepQuality, setSleepQuality] = useState(7);
  const [bedHour, setBedHour] = useState("");
  const [bedMinute, setBedMinute] = useState("");
  const [wakeHour, setWakeHour] = useState("");
  const [wakeMinute, setWakeMinute] = useState("");
  const [wakeups, setWakeups] = useState("");
  const [sleepNotes, setSleepNotes] = useState("");

  const [hrv, setHrv] = useState("");
  const [hrvHour, setHrvHour] = useState("");
  const [hrvMinute, setHrvMinute] = useState("");
  const [measurementMethod, setMeasurementMethod] = useState("");

  const [restingHr, setRestingHr] = useState("");
  const [restingHrHour, setRestingHrHour] = useState("");
  const [restingHrMinute, setRestingHrMinute] = useState("");
  const [heartNotes, setHeartNotes] = useState("");

  const [motivation, setMotivation] = useState(7);
  const [stress, setStress] = useState(4);
  const [irritability, setIrritability] = useState(3);
  const [physicalFatigue, setPhysicalFatigue] = useState(3);
  const [mentalFatigue, setMentalFatigue] = useState(5);
  const [recoveryFeeling, setRecoveryFeeling] = useState(5);
  const [readinessToTrain, setReadinessToTrain] = useState(4);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [selfNotes, setSelfNotes] = useState("");

  const [hasPain, setHasPain] = useState(false);
  const [painIntensity, setPainIntensity] = useState(1);
  const [bodyAreaOptions, setBodyAreaOptions] = useState<string[]>([]);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [discomfortType, setDiscomfortType] = useState("");
  const [discomfortNotes, setDiscomfortNotes] = useState("");

  const [activeMenstruation, setActiveMenstruation] = useState(false);
  const [bleedingLevel, setBleedingLevel] = useState(1);
  const [menstrualPain, setMenstrualPain] = useState(1);
  const [physicalSymptomOptions, setPhysicalSymptomOptions] = useState<string[]>([]);
  const [emotionalSymptomOptions, setEmotionalSymptomOptions] = useState<string[]>([]);
  const [selectedPhysicalSymptoms, setSelectedPhysicalSymptoms] = useState<string[]>([]);
  const [selectedEmotionalSymptoms, setSelectedEmotionalSymptoms] = useState<string[]>([]);
  const [menstrualNotes, setMenstrualNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const trainingLoad = useMemo(() => {
    const minutes = Number(duration);
    if (!minutes || minutes <= 0) return 0;
    return minutes * intensity;
  }, [duration, intensity]);

  const moodScore = useMemo(() => {
    const stressInv = 11 - stress;
    const irritabilityInv = 11 - irritability;
    return Math.round(
      0.4 * motivation + 0.35 * stressInv + 0.25 * irritabilityInv
    );
  }, [motivation, stress, irritability]);

  const fatigueScore = useMemo(() => {
    return Math.round((physicalFatigue + mentalFatigue) / 2);
  }, [physicalFatigue, mentalFatigue]);

  const calculatedSleepHours = useMemo(() => {
    if (!bedHour || !bedMinute || !wakeHour || !wakeMinute) return "-";

    const bHour = Number(bedHour);
    const bMinute = Number(bedMinute);
    const wHour = Number(wakeHour);
    const wMinute = Number(wakeMinute);

    if (
      Number.isNaN(bHour) ||
      Number.isNaN(bMinute) ||
      Number.isNaN(wHour) ||
      Number.isNaN(wMinute) ||
      bHour < 0 ||
      bHour > 23 ||
      wHour < 0 ||
      wHour > 23 ||
      bMinute < 0 ||
      bMinute > 59 ||
      wMinute < 0 ||
      wMinute > 59
    ) {
      return "-";
    }

    let bedTotal = bHour * 60 + bMinute;
    let wakeTotal = wHour * 60 + wMinute;

    if (wakeTotal <= bedTotal) {
      wakeTotal += 24 * 60;
    }

    const diffMinutes = wakeTotal - bedTotal;
    return (diffMinutes / 60).toFixed(1);
  }, [bedHour, bedMinute, wakeHour, wakeMinute]);

  const tabs = menstrualEnabled
  ? [
      ...baseTabs,
      { key: "cycle" as TabKey, label: "Ciclo Menstrual" },
    ]
  : baseTabs;

  const visibleCompletedTabs = completedTabs.filter((tab) =>
    tabs.some((item) => item.key === tab)
  );

  
  const progress = visibleCompletedTabs.length;
  const progressPercent = `${progress}/${tabs.length}`;

  useEffect(() => {
    async function fetchBodyAreas() {
      const { data, error } = await supabase
        .from("zonas_corporales")
        .select("nombre_zona")
        .order("nombre_zona");

      if (error) {
        console.log("Error cargando zonas corporales:", error.message);
        return;
      }

      setBodyAreaOptions(data.map((zona) => zona.nombre_zona));
    }

    async function fetchSymptoms() {
      const { data: physicalData, error: physicalError } = await supabase
        .from("sintomas_fisicos")
        .select("nombre_sintoma_fisico")
        .order("nombre_sintoma_fisico");

      if (physicalError) {
        console.log("Error cargando síntomas físicos:", physicalError.message);
        return;
      }

      setPhysicalSymptomOptions(
        physicalData.map((item) => item.nombre_sintoma_fisico)
      );

      const { data: emotionalData, error: emotionalError } = await supabase
        .from("sintomas_emocionales")
        .select("nombre_sintoma_emocional")
        .order("nombre_sintoma_emocional");

      if (emotionalError) {
        console.log("Error cargando síntomas emocionales:", emotionalError.message);
        return;
      }

      setEmotionalSymptomOptions(
        emotionalData.map((item) => item.nombre_sintoma_emocional)
      );
    }

    async function loadMenstrualOption() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("deportistas")
        .select("opcion_ciclo_menstrual")
        .eq("id_usuario", user.id)
        .single();

      if (error || !data) {
        console.log(
          "Error cargando opción menstrual:",
          error?.message
        );
        return;
      }

      setMenstrualEnabled(
        data.opcion_ciclo_menstrual === true
      );
    }

    fetchBodyAreas();
    fetchSymptoms();
    loadMenstrualOption();
  }, []);

  function markCompleted() {
    if (!completedTabs.includes(activeTab)) {
      setCompletedTabs([...completedTabs, activeTab]);
    }
  }

  async function getOrCreateTodayRegister() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      console.log("No hay usuario autenticado");
      return null;
    }

    const { data: deportista, error: deportistaError } = await supabase
      .from("deportistas")
      .select("id_deportista")
      .eq("id_usuario", userId)
      .single();

    if (deportistaError || !deportista) {
      console.log("Error obteniendo deportista:", deportistaError?.message);
      return null;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: existingRegister } = await supabase
      .from("registros_diarios")
      .select("id_registro_diario")
      .eq("id_deportista", deportista.id_deportista)
      .eq("fecha", today)
      .maybeSingle();

    if (existingRegister) {
      return existingRegister.id_registro_diario;
    }

    const { data: newRegister, error: registerError } = await supabase
      .from("registros_diarios")
      .insert({
        id_deportista: deportista.id_deportista,
        fecha: today,
      })
      .select("id_registro_diario")
      .single();

    if (registerError || !newRegister) {
      console.log("Error creando registro diario:", registerError?.message);
      return null;
    }

    return newRegister.id_registro_diario;
  }

  function parsePositiveNumber(value: string) {
    const number = Number(value.replace(",", "."));

    return Number.isFinite(number) ? number : null;
  }

  function isValidHour(hour: string) {
    const number = Number(hour);

    return Number.isInteger(number) && number >= 0 && number <= 23;
  }

  function isValidMinute(minute: string) {
    const number = Number(minute);

    return Number.isInteger(number) && number >= 0 && number <= 59;
  }

  function cleanText(value: string, maxLength = 500) {
    return value.trim().slice(0, maxLength);
  }

  async function saveTrainingSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    if (!trainingType || !duration) {
      Alert.alert(
        "Campos incompletos",
        "Completa los datos de entrenamiento."
      );

      setSaving(false);
      return;
    }

    const durationNumber = parsePositiveNumber(duration);

    if (!durationNumber || durationNumber <= 0 || durationNumber > 600) {
      Alert.alert(
        "Duración no válida",
        "Introduce una duración entre 1 y 600 minutos."
      );

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("entrenamientos")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          tipo_entrenamiento: cleanText(trainingType, 80),
          duracion: durationNumber,
          intensidad_percibida: intensity,
          carga_de_entrenamiento: trainingLoad,
          notas_entrenamiento: cleanText(trainingNotes) || null,
        },
        {
          onConflict: "id_registro_diario",
        }
      );

    if (error) {
      Alert.alert(
        "Error",
        "No se ha podido guardar el entrenamiento."
      );

      setSaving(false);
      return;
    }

    markCompleted();
    setSaving(false);
  }

  async function saveSleepSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    if (!bedHour || !bedMinute || !wakeHour || !wakeMinute) {
      Alert.alert(
        "Campos incompletos",
        "Completa los horarios de sueño."
      );

      setSaving(false);
      return;
    }

    if (calculatedSleepHours === "-") {
      Alert.alert(
        "Sueño no válido",
        "Revisa la hora de acostarte y la hora de levantarte."
      );

      setSaving(false);
      return;
    }

    if (
      !isValidHour(bedHour) ||
      !isValidMinute(bedMinute) ||
      !isValidHour(wakeHour) ||
      !isValidMinute(wakeMinute)
    ) {
      Alert.alert(
        "Horario no válido",
        "Introduce horas entre 0 y 23 y minutos entre 0 y 59."
      );

      setSaving(false);
      return;
    }

    const sleepHoursNumber = Number(calculatedSleepHours);

    if (sleepHoursNumber <= 0 || sleepHoursNumber > 14) {
      Alert.alert(
        "Sueño no válido",
        "Introduce un intervalo de sueño entre 1 y 14 horas."
      );

      setSaving(false);
      return;
    }

    const wakeupsNumber = wakeups ? parsePositiveNumber(wakeups) : null;

    if (
      wakeupsNumber !== null &&
      (!Number.isInteger(wakeupsNumber) ||
        wakeupsNumber < 0 ||
        wakeupsNumber > 20)
    ) {
      Alert.alert(
        "Despertares no válidos",
        "Introduce un número de despertares entre 0 y 20."
      );

      setSaving(false);
      return;
    }

    const horaAcostarse = `${bedHour.padStart(2, "0")}:${bedMinute.padStart(
      2,
      "0"
    )}:00`;

    const horaLevantarse = `${wakeHour.padStart(2, "0")}:${wakeMinute.padStart(
      2,
      "0"
    )}:00`;

    const { error } = await supabase
      .from("suenos")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          calidad_sueno: sleepQuality,
          hora_acostarse: horaAcostarse,
          hora_levantarse: horaLevantarse,
          horas_de_sueno: sleepHoursNumber,
          numero_despertares: wakeupsNumber,
          notas_sueno: cleanText(sleepNotes) || null,
        },
        {
          onConflict: "id_registro_diario",
        }
      );

    if (error) {
      Alert.alert(
        "Error",
        "No se ha podido guardar el sueño."
      );

      setSaving(false);
      return;
    }

    markCompleted();
    setSaving(false);
  }

  async function saveHeartSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    if (
      !hrv ||
      !hrvHour ||
      !hrvMinute ||
      !restingHr ||
      !restingHrHour ||
      !restingHrMinute
    ) {
      Alert.alert(
        "Campos incompletos",
        "Completa los datos de frecuencia cardiaca."
      );

      setSaving(false);
      return;
    }

    const hrvNumber = parsePositiveNumber(hrv);
    const restingHrNumber = parsePositiveNumber(restingHr);

    if (!hrvNumber || hrvNumber < 1 || hrvNumber > 300) {
      Alert.alert(
        "HRV no válido",
        "Introduce un HRV entre 1 y 300 ms."
      );

      setSaving(false);
      return;
    }

    if (!restingHrNumber || restingHrNumber < 20 || restingHrNumber > 250) {
      Alert.alert(
        "FC en reposo no válida",
        "Introduce una frecuencia cardiaca entre 20 y 250 bpm."
      );

      setSaving(false);
      return;
    }

    if (
      !isValidHour(hrvHour) ||
      !isValidMinute(hrvMinute) ||
      !isValidHour(restingHrHour) ||
      !isValidMinute(restingHrMinute)
    ) {
      Alert.alert(
        "Horario no válido",
        "Introduce horas entre 0 y 23 y minutos entre 0 y 59."
      );

      setSaving(false);
      return;
    }

    const horaMedicionHrv = `${hrvHour.padStart(2, "0")}:${hrvMinute.padStart(
      2,
      "0"
    )}:00`;

    const horaMedicionReposo = `${restingHrHour.padStart(
      2,
      "0"
    )}:${restingHrMinute.padStart(2, "0")}:00`;

    const { error } = await supabase
      .from("frecuencias_cardiacas")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          hrv: hrvNumber,
          hora_medicion_hrv: horaMedicionHrv,
          metodo_medicion: cleanText(measurementMethod, 80) || null,
          fc_reposo: restingHrNumber,
          hora_medicion_reposo: horaMedicionReposo,
          notas_fc: cleanText(heartNotes) || null,
        },
        {
          onConflict: "id_registro_diario",
        }
      );

    if (error) {
      Alert.alert(
        "Error",
        "No se ha podido guardar la frecuencia cardiaca."
      );

      setSaving(false);
      return;
    }

    markCompleted();
    setSaving(false);
  }

  async function saveSelfPerceptionSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("autopercepciones")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          motivacion: motivation,
          estres: stress,
          irritabilidad: irritability,
          fatiga_fisica: physicalFatigue,
          fatiga_mental: mentalFatigue,
          fatiga_general: fatigueScore,
          sensacion_recuperacion: recoveryFeeling,
          preparacion_entrenar: readinessToTrain,
          nivel_energia: energyLevel,
          notas_autopercepcion: cleanText(selfNotes) || null,
        },
        {
          onConflict: "id_registro_diario",
        }
      );

    if (error) {
      Alert.alert(
        "Error",
        "No se ha podido guardar la autopercepción."
      );

      setSaving(false);
      return;
    }

    markCompleted();
    setSaving(false);
  }

  async function saveDiscomfortSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    if (hasPain && selectedBodyAreas.length === 0) {
      Alert.alert(
        "Zona no indicada",
        "Selecciona al menos una zona corporal."
      );

      setSaving(false);
      return;
    }

    const { data: molestia, error } = await supabase
      .from("molestias")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          dolor: hasPain,
          intensidad: hasPain ? painIntensity : null,
          tipo_molestia: hasPain
            ? cleanText(discomfortType, 80) || null
            : null,
          notas_molestias: hasPain
            ? cleanText(discomfortNotes) || null
            : null,
        },
        {
          onConflict: "id_registro_diario",
        }
      )
      .select("id_molestia")
      .single();

    if (error || !molestia) {
      Alert.alert(
        "Error",
        "No se han podido guardar las molestias."
      );

      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("relaciones_molestias_zonas")
      .delete()
      .eq("id_molestia", molestia.id_molestia);

    if (deleteError) {
      Alert.alert(
        "Error",
        "No se han podido actualizar las zonas afectadas."
      );

      setSaving(false);
      return;
    }

    if (hasPain && selectedBodyAreas.length > 0) {
      const { data: zonas, error: zonasError } = await supabase
        .from("zonas_corporales")
        .select("id_zona_corporal, nombre_zona")
        .in("nombre_zona", selectedBodyAreas);

      if (zonasError) {
        Alert.alert(
          "Error",
          "No se han podido obtener las zonas corporales."
        );

        setSaving(false);
        return;
      }

      const relaciones = (zonas || []).map((zona) => ({
        id_molestia: molestia.id_molestia,
        id_zona_corporal: zona.id_zona_corporal,
      }));

      if (relaciones.length > 0) {
        const { error: relacionesError } = await supabase
          .from("relaciones_molestias_zonas")
          .insert(relaciones);

        if (relacionesError) {
          Alert.alert(
            "Error",
            "No se han podido guardar las zonas afectadas."
          );

          setSaving(false);
          return;
        }
      }
    }

    markCompleted();
    setSaving(false);
  }

  async function saveCycleSection() {
    if (saving) return;

    setSaving(true);

    const idRegistroDiario = await getOrCreateTodayRegister();

    if (!idRegistroDiario) {
      setSaving(false);
      return;
    }

    const { data: ciclo, error } = await supabase
      .from("ciclos_menstruales")
      .upsert(
        {
          id_registro_diario: idRegistroDiario,
          menstruacion_activa: activeMenstruation,
          sangrado: activeMenstruation ? bleedingLevel : 0,
          dolor_menstrual: activeMenstruation ? menstrualPain : 0,
          notas_menstruacion: activeMenstruation
            ? cleanText(menstrualNotes) || null
            : null,
        },
        {
          onConflict: "id_registro_diario",
        }
      )
      .select("id_menstruacion")
      .single();

    if (error || !ciclo) {
      Alert.alert(
        "Error",
        "No se ha podido guardar el ciclo menstrual."
      );

      setSaving(false);
      return;
    }

    const { error: deleteFisicosError } = await supabase
      .from("relaciones_sintomas_fisicos")
      .delete()
      .eq("id_menstruacion", ciclo.id_menstruacion);

    if (deleteFisicosError) {
      Alert.alert(
        "Error",
        "No se han podido actualizar los síntomas físicos."
      );

      setSaving(false);
      return;
    }

    const { error: deleteEmocionalesError } = await supabase
      .from("relaciones_sintomas_emocionales")
      .delete()
      .eq("id_menstruacion", ciclo.id_menstruacion);

    if (deleteEmocionalesError) {
      Alert.alert(
        "Error",
        "No se han podido actualizar los síntomas emocionales."
      );

      setSaving(false);
      return;
    }

    if (activeMenstruation && selectedPhysicalSymptoms.length > 0) {
      const { data: sintomasFisicos, error: fisicosError } = await supabase
        .from("sintomas_fisicos")
        .select("id_sintoma_fisico, nombre_sintoma_fisico")
        .in("nombre_sintoma_fisico", selectedPhysicalSymptoms);

      if (fisicosError) {
        Alert.alert(
          "Error",
          "No se han podido obtener los síntomas físicos."
        );

        setSaving(false);
        return;
      }

      const relacionesFisicas = (sintomasFisicos || []).map((sintoma) => ({
        id_menstruacion: ciclo.id_menstruacion,
        id_sintoma_fisico: sintoma.id_sintoma_fisico,
      }));

      if (relacionesFisicas.length > 0) {
        const { error: relacionesFisicasError } = await supabase
          .from("relaciones_sintomas_fisicos")
          .insert(relacionesFisicas);

        if (relacionesFisicasError) {
          Alert.alert(
            "Error",
            "No se han podido guardar los síntomas físicos."
          );

          setSaving(false);
          return;
        }
      }
    }

    if (activeMenstruation && selectedEmotionalSymptoms.length > 0) {
      const { data: sintomasEmocionales, error: emocionalesError } =
        await supabase
          .from("sintomas_emocionales")
          .select("id_sintoma_emocional, nombre_sintoma_emocional")
          .in("nombre_sintoma_emocional", selectedEmotionalSymptoms);

      if (emocionalesError) {
        Alert.alert(
          "Error",
          "No se han podido obtener los síntomas emocionales."
        );

        setSaving(false);
        return;
      }

      const relacionesEmocionales = (sintomasEmocionales || []).map(
        (sintoma) => ({
          id_menstruacion: ciclo.id_menstruacion,
          id_sintoma_emocional: sintoma.id_sintoma_emocional,
        })
      );

      if (relacionesEmocionales.length > 0) {
        const { error: relacionesEmocionalesError } = await supabase
          .from("relaciones_sintomas_emocionales")
          .insert(relacionesEmocionales);

        if (relacionesEmocionalesError) {
          Alert.alert(
            "Error",
            "No se han podido guardar los síntomas emocionales."
          );

          setSaving(false);
          return;
        }
      }
    }

    markCompleted();
    setSaving(false);
  }

  
  return (
    <AthleteLayout title="Registro diario">
      <AppCard className="mb-5">
        <View className="flex-row justify-between mb-2">
          <Text className="font-semibold text-gray-700">
            Progreso del registro
          </Text>
          <Text className="font-bold text-gray-900">{progressPercent}</Text>
        </View>

        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-3 bg-blue-600 rounded-full"
            style={{
              width: `${(progress / tabs.length) * 100}%`,
            }}
          />
        </View>
      </AppCard>

      <View className="flex-row flex-wrap gap-2 mb-5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isCompleted = completedTabs.includes(tab.key);

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-full border ${
                isActive
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? "text-white" : "text-gray-700"
                }`}
              >
                {tab.label}
                {isCompleted ? " ✓" : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppCard>
        {activeTab === "training" && (
          <View>
            <SectionTitle title="Entrenamiento" />

            <AppInput
              label="Tipo de entrenamiento"
              value={trainingType}
              onChangeText={(value) => setTrainingType(value.slice(0, 80))}
              placeholder="Fuerza, carrera, movilidad..."
              maxLength={80}
            />

            <AppInput
              label="Duración (minutos)"
              value={duration}
              onChangeText={(value) =>
                setDuration(value.replace(/[^0-9]/g, "").slice(0, 3))
              }
              placeholder="Ej. 60"
              keyboardType="numeric"
              maxLength={3}
            />

            <AppSlider
                label="Intensidad percibida"
                value={intensity}
                onChange={setIntensity}
            />

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Carga de entrenamiento
              </Text>
              <View className="h-12 bg-blue-50 rounded-2xl justify-center px-4">
                <Text className="text-blue-700 font-bold">
                  {trainingLoad} AU
                </Text>
              </View>
            </View>

            <NotesInput
              label="Notas"
              value={trainingNotes}
              onChangeText={(value) => setTrainingNotes(value.slice(0, 500))}
              placeholder="Observaciones sobre el entrenamiento"
            />
          </View>
        )}

        {activeTab === "sleep" && (
          <View>
            <SectionTitle title="Sueño" />

            <AppSlider
              label="Calidad del sueño"
              value={sleepQuality}
              onChange={setSleepQuality}
            />

            <View className="flex-row gap-3 mb-6 mt-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Hora de acostarse
                </Text>

                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <AppInput
                      label=""
                      value={bedHour}
                      onChangeText={(value) =>
                        setBedHour(value.replace(/[^0-9]/g, "").slice(0, 2))
                      }
                      placeholder="23"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>

                  <Text className="text-xl font-bold text-gray-500 mb-0">:</Text>

                  <View className="flex-1">
                    <AppInput
                      label=""
                      value={bedMinute}
                      onChangeText={(value) =>
                        setBedMinute(value.replace(/[^0-9]/g, "").slice(0, 2))
                      }
                      placeholder="30"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Hora de levantarse
                </Text>

                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <AppInput
                      label=""
                      value={wakeHour}
                      onChangeText={(value) =>
                        setWakeHour(value.replace(/[^0-9]/g, "").slice(0, 2))
                      }
                      placeholder="07"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>

                  <Text className="text-xl font-bold text-gray-500 mb-0">:</Text>

                  <View className="flex-1">
                    <AppInput
                      label=""
                      value={wakeMinute}
                      onChangeText={(value) =>
                        setWakeMinute(value.replace(/[^0-9]/g, "").slice(0, 2))
                      }
                      placeholder="30"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Horas de sueño
              </Text>

              <View className="h-12 bg-blue-50 rounded-2xl justify-center px-4">
                <Text className="text-blue-700 font-bold">
                  {calculatedSleepHours} h
                </Text>
              </View>
            </View>

            <AppInput
              label="Número de despertares"
              value={wakeups}
              onChangeText={(value) =>
                setWakeups(value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              placeholder="Ej. 2"
              keyboardType="numeric"
              maxLength={2}
            />

            <NotesInput
              label="Notas"
              value={sleepNotes}
              onChangeText={(value) => setSleepNotes(value.slice(0, 500))}
              placeholder="Observaciones sobre el sueño"
            />
          </View>
        )}

        {activeTab === "heart" && (
          <View>
            <SectionTitle title="Frecuencia cardiaca" />

            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-3">
                Variabilidad de la frecuencia cardiaca
              </Text>

              <AppInput
                label="HRV"
                value={hrv}
                onChangeText={(value) =>
                  setHrv(value.replace(/[^0-9]/g, "").slice(0, 3))
                }
                placeholder="Ej. 72"
                keyboardType="numeric"
                maxLength={3}
              />

              <TimeInputGroup
                label="Hora de medición"
                hour={hrvHour}
                minute={hrvMinute}
                onChangeHour={setHrvHour}
                onChangeMinute={setHrvMinute}
              />

              <AppInput
                label="Método de medición"
                value={measurementMethod}
                onChangeText={(value) => setMeasurementMethod(value.slice(0, 80))}
                placeholder="Ej. pulsómetro, reloj, banda..."
                maxLength={80}
              />
            </View>

            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-3">
                Frecuencia cardiaca en reposo
              </Text>

              <AppInput
                label="FC en reposo"
                value={restingHr}
                onChangeText={(value) =>
                  setRestingHr(value.replace(/[^0-9]/g, "").slice(0, 3))
                }
                placeholder="Ej. 48"
                keyboardType="numeric"
                 maxLength={3}
              />

              <TimeInputGroup
                label="Hora de medición"
                hour={restingHrHour}
                minute={restingHrMinute}
                onChangeHour={setRestingHrHour}
                onChangeMinute={setRestingHrMinute}
              />
            </View>

            <NotesInput
              label="Notas"
              value={heartNotes}
              onChangeText={(value) => setHeartNotes(value.slice(0, 500))}
              placeholder="Observaciones sobre la frecuencia cardiaca"
            />
          </View>
        )}

        {activeTab === "self" && (
          <View>
            <SectionTitle title="Autopercepción" />

            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-4">
                Estado de ánimo
              </Text>

              <AppSlider
                label="Motivación"
                value={motivation}
                onChange={setMotivation}
              />

              <AppSlider
                label="Estrés"
                value={stress}
                onChange={setStress}
              />

              <AppSlider
                label="Irritabilidad"
                value={irritability}
                onChange={setIrritability}
              />

              <View className="bg-emerald-50 rounded-2xl p-4">
                <Text className="text-emerald-700 font-semibold">
                  Estado de ánimo general
                </Text>
                <Text className="text-3xl font-bold text-emerald-700 mt-1">
                  {moodScore}/10
                </Text>
              </View>
            </View>

            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-4">
                Fatiga percibida
              </Text>

              <AppSlider
                label="Fatiga física"
                value={physicalFatigue}
                onChange={setPhysicalFatigue}
              />

              <AppSlider
                label="Fatiga mental"
                value={mentalFatigue}
                onChange={setMentalFatigue}
              />

              <View className="bg-amber-50 rounded-2xl p-4">
                <Text className="text-amber-700 font-semibold">
                  Fatiga general
                </Text>
                <Text className="text-3xl font-bold text-amber-700 mt-1">
                  {fatigueScore}/10
                </Text>
              </View>
            </View>

            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-4">
                Recuperación percibida
              </Text>

              <AppSlider
                label="Sensación de recuperación"
                value={recoveryFeeling}
                onChange={setRecoveryFeeling}
              />

              <IconScaleSelector
                label="Preparación para entrenar"
                value={readinessToTrain}
                max={5}
                icon="🔥"
                onChange={setReadinessToTrain}
              />

              <IconScaleSelector
                label="Nivel de energía"
                value={energyLevel}
                max={10}
                icon="⚡"
                onChange={setEnergyLevel}
              />
            </View>

            <NotesInput
              label="Notas"
              value={selfNotes}
              onChangeText={(value) => setSelfNotes(value.slice(0, 500))}
              placeholder="Observaciones sobre el ánimo, fatiga o recuperación"
            />
          </View>
        )}

        {activeTab === "discomfort" && (
          <View>
            <SectionTitle title="Molestias" />

            <ToggleOption
              label="¿Hay dolor?"
              value={hasPain}
              onChange={setHasPain}
            />

            {hasPain && (
              <>
                <AppSlider
                  label="Intensidad del dolor"
                  value={painIntensity}
                  onChange={setPainIntensity}
                />

                <MultiSelectChips
                  label="Zona corporal"
                  options={bodyAreaOptions}
                  selectedOptions={selectedBodyAreas}
                  onChange={setSelectedBodyAreas}
                />

                <AppInput
                  label="Tipo de molestia"
                  value={discomfortType}
                  onChangeText={(value) => setDiscomfortType(value.slice(0, 80))}
                  placeholder="Ej. pinchazo, sobrecarga, rigidez..."
                  maxLength={80}
                />

                <NotesInput
                  label="Notas"
                  value={discomfortNotes}
                  onChangeText={(value) => setDiscomfortNotes(value.slice(0, 500))}
                  placeholder="Observaciones sobre los dolores o molestias"
                />
              </>
            )}
          </View>
        )}

        {activeTab === "cycle" && (
          <View>
            <SectionTitle title="Ciclo menstrual" />

            <ToggleOption
              label="¿Menstruación activa?"
              value={activeMenstruation}
              onChange={setActiveMenstruation}
            />

            {activeMenstruation && (
              <>
                <AppSlider
                  label="Nivel de sangrado"
                  value={bleedingLevel}
                  onChange={setBleedingLevel}
                />

                <AppSlider
                  label="Dolor menstrual"
                  value={menstrualPain}
                  onChange={setMenstrualPain}
                />

                <MultiSelectChips
                  label="Síntomas físicos"
                  options={physicalSymptomOptions}
                  selectedOptions={selectedPhysicalSymptoms}
                  onChange={setSelectedPhysicalSymptoms}
                />

                <MultiSelectChips
                  label="Síntomas emocionales"
                  options={emotionalSymptomOptions}
                  selectedOptions={selectedEmotionalSymptoms}
                  onChange={setSelectedEmotionalSymptoms}
                />

                <NotesInput
                  label="Notas"
                  value={menstrualNotes}
                  onChangeText={(value) => setMenstrualNotes(value.slice(0, 500))}
                  placeholder="Observaciones sobre la menstruación"
                />
              </>
            )}
          </View>
        )}

        <AppButton
          title={
            activeTab === "training"
              ? "Guardar entrenamiento"
              : activeTab === "sleep"
              ? "Guardar sueño"
              : activeTab === "heart"
              ? "Guardar frecuencia cardiaca"
              : activeTab === "self"
              ? "Guardar autopercepción"
              : activeTab === "discomfort"
              ? "Guardar molestias"
              : activeTab === "cycle"
              ? "Guardar ciclo menstrual"
              : "Marcar como completado"
          }
          onPress={
            activeTab === "training"
              ? saveTrainingSection
              : activeTab === "sleep"
              ? saveSleepSection
              : activeTab === "heart"
              ? saveHeartSection
              : activeTab === "self"
              ? saveSelfPerceptionSection
              : activeTab === "discomfort"
              ? saveDiscomfortSection
              : activeTab === "cycle"
              ? saveCycleSection
              : markCompleted
          }
        />
      </AppCard>
    </AthleteLayout>
  );
}


function ToggleOption({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => onChange(true)}
          className={`flex-1 h-12 rounded-2xl items-center justify-center ${
            value ? "bg-blue-600" : "bg-gray-100"
          }`}
        >
          <Text
            className={`font-semibold ${value ? "text-white" : "text-gray-700"}`}
          >
            Sí
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange(false)}
          className={`flex-1 h-12 rounded-2xl items-center justify-center ${
            !value ? "bg-blue-600" : "bg-gray-100"
          }`}
        >
          <Text
            className={`font-semibold ${
              !value ? "text-white" : "text-gray-700"
            }`}
          >
            No
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NotesInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        maxLength={500}
        className="min-h-[90px] bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900"
        placeholderTextColor="#9CA3AF"
        textAlignVertical="top"
      />
    </View>
  );
}

function TimeInputGroup({
  label,
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
}: {
  label: string;
  hour: string;
  minute: string;
  onChangeHour: (value: string) => void;
  onChangeMinute: (value: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>

      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <AppInput
            label=""
            value={hour}
            onChangeText={(value) =>
              onChangeHour(value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            placeholder="HH"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        <Text className="text-xl font-bold text-gray-500 mb-4">:</Text>

        <View className="flex-1">
          <AppInput
            label=""
            value={minute}
            onChangeText={(value) =>
              onChangeMinute(value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>
    </View>
  );
}

function IconScaleSelector({
  label,
  value,
  max,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  icon: string;
  onChange: (value: number) => void;
}) {
  return (
    <View className="mb-5">
      <View className="flex-row justify-between mb-3">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        <Text className="text-sm font-bold text-blue-600">
          {value}/{max}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: max }, (_, index) => index + 1).map((number) => (
          <Pressable
            key={number}
            onPress={() => onChange(number)}
            className="w-9 h-9 items-center justify-center"
            style={{
              opacity: number <= value ? 1 : 0.25,
            }}
          >
            <Text className="text-2xl">{icon}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MultiSelectChips({
  label,
  options,
  selectedOptions,
  onChange,
}: {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (values: string[]) => void;
}) {
  function toggleOption(option: string) {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter((item) => item !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  }

  return (
    <View className="mb-5">
      <Text className="text-sm font-medium text-gray-700 mb-3">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);

          return (
            <Pressable
              key={option}
              onPress={() => toggleOption(option)}
              className={`px-4 py-2 rounded-full border ${
                isSelected
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}