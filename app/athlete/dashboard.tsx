import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import AthleteLayout from "../../src/components/layout/AthleteLayout";
import AppCard from "../../src/components/ui/AppCard";
import MetricCard from "../../src/components/ui/MetricCard";
import SectionTitle from "../../src/components/ui/SectionTitle";
import { supabase } from "../../src/lib/supabase";

type TrainingItem = {
  tipo_entrenamiento: string | null;
  duracion: number | null;
  intensidad_percibida: number | null;
  carga_de_entrenamiento: number | null;
};

export default function AthleteDashboard() {
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
  name: "Usuario",
  totalLoad: 0,
  sleepHours: "-",
  sleepHoursValue: 0,
  hrv: "-",
  hrvValue: 0,
  restingHr: "-",
  restingHrValue: 0,
  mood: "-",
  moodValue: 0,
  generalStatus: "-",
  sleepSubtitle: "Sin datos",
  loadSubtitle: "Sin datos",
  moodSubtitle: "Sin datos",
  hrvSubtitle: "Sin datos",
  hasPain: false,
  painIntensity: 0,
  latestPainDate: "",
});

  const [recentTrainings, setRecentTrainings] = useState<TrainingItem[]>([]);
  
  const [sleepChartData, setSleepChartData] = useState<
    { value: number; label: string }[]
  >([]);

  const [heartChartData, setHeartChartData] = useState<
    { value: number; label: string }[]
  >([]);

  const today = new Date();

  function formatDateToDB(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function shortDate(date: string) {
    const [, month, day] = date.split("-");
    return `${day}/${month}`;
  }

  function getLast7Days() {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return formatDateToDB(date);
    });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setLoading(false);
      return;
}

    const { data: userData } = await supabase
      .from("usuarios")
      .select("nombre_apellidos")
      .eq("id_usuario", userId)
      .single();

    const { data: athleteData } = await supabase
      .from("deportistas")
      .select("id_deportista")
      .eq("id_usuario", userId)
      .single();

    if (!athleteData) {
      setLoading(false);
      return;
    }

    const { data: registers, error } = await supabase
      .from("registros_diarios")
      .select(`
        fecha,
        entrenamientos(
          tipo_entrenamiento,
          duracion,
          intensidad_percibida,
          carga_de_entrenamiento
        ),
        suenos(
          horas_de_sueno,
          calidad_sueno
        ),
        frecuencias_cardiacas(
          hrv,
          fc_reposo
        ),
        autopercepciones(
          motivacion,
          estres,
          irritabilidad,
          fatiga_general,
          nivel_energia
        ),
        molestias(
          dolor,
          intensidad,
          tipo_molestia
        )
      `)
      .eq("id_deportista", athleteData.id_deportista)
      .gte("fecha", getLast7Days()[0])
      .lte("fecha", formatDateToDB(new Date()))
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error cargando dashboard:", error.message);
      return;
    }

    const rows = registers || [];
    const orderedRows = registers || [];

    const trainings = rows
      .map((r: any) => first(r.entrenamientos))
      .filter(Boolean);

    const sleeps = rows
      .map((r: any) => first(r.suenos))
      .filter(Boolean);

    const hearts = rows
      .map((r: any) => first(r.frecuencias_cardiacas))
      .filter(Boolean);

    const perceptions = rows
      .map((r: any) => first(r.autopercepciones))
      .filter(Boolean);

    const discomforts = rows
      .map((r: any) => {
        const discomfort = first(r.molestias);

        if (!discomfort?.dolor) return null;

        return {
          ...discomfort,
          fecha: r.fecha,
        };
      })
      .filter(Boolean);

    const latestTraining = trainings.slice().reverse()[0];

    const latestTrainingLoad =
      latestTraining?.carga_de_entrenamiento || 0;

    const latestSleep = sleeps.slice().reverse()[0];
    const latestHeart = hearts.slice().reverse()[0];
    const latestPerception = perceptions.slice().reverse()[0];

    const moodScore = latestPerception
      ? calculateMood(
          latestPerception.motivacion,
          latestPerception.estres,
          latestPerception.irritabilidad
        )
      : null;

    const moodValue = moodScore || 0;
    const sleepScore = latestSleep?.horas_de_sueno
      ? Math.min(
          Math.round(Number(latestSleep.horas_de_sueno)),
          10
        )
      : null;

    const generalStatus =
      moodScore && sleepScore
        ? Math.round((moodScore + sleepScore) / 2)
        : moodScore || null;

    setSummary({
      name: userData?.nombre_apellidos || "Usuario",
      totalLoad: latestTrainingLoad,
      sleepHours: latestSleep?.horas_de_sueno
        ? `${latestSleep.horas_de_sueno} h`
        : "-",
      sleepHoursValue: latestSleep?.horas_de_sueno || 0,
      hrv: latestHeart?.hrv ? `${latestHeart.hrv} ms` : "-",
      hrvValue: latestHeart?.hrv || 0,
      restingHr: latestHeart?.fc_reposo ? `${latestHeart.fc_reposo} bpm` : "-",
      restingHrValue: latestHeart?.fc_reposo || 0,
      mood: moodScore ? `${moodScore}/10` : "-",
      moodValue: moodScore || 0,
      generalStatus: generalStatus ? `${generalStatus}/10` : "-",
      loadSubtitle:
        latestTrainingLoad >= 800
          ? "Peligro"
          : latestTrainingLoad >= 700
          ? "Excelente"
          : latestTrainingLoad >= 400
          ? "Bueno"
          : latestTrainingLoad > 100
          ? "Mejorable"
          : "Sin datos",
      sleepSubtitle:
        latestSleep?.horas_de_sueno >= 8
          ? "Excelente"
          : latestSleep?.horas_de_sueno >= 7
          ? "Bueno"
          : latestSleep?.horas_de_sueno >= 5
          ? "Mejorable"
          : latestSleep?.horas_de_sueno > 0
          ? "Peligro"
          : "Sin datos",
      hrvSubtitle:
        latestHeart?.hrv >= 90
          ? "Excelente"
          : latestHeart?.hrv >= 60
          ? "Bueno"
          : latestHeart?.hrv >= 35
          ? "Mejorable"
          : latestHeart?.hrv > 0
          ? "Peligro"
          : "Sin datos",
      moodSubtitle:
        moodValue >= 8
          ? "Excelente"
          : moodValue >= 6
          ? "Bueno"
          : moodValue >= 4
          ? "Mejorable"
          : moodValue > 0
          ? "Peligro"
          : "Sin datos",
      hasPain: discomforts.length > 0,
      painIntensity: discomforts.slice().reverse()[0]?.intensidad || 0,
      latestPainDate: discomforts.slice().reverse()[0]?.fecha || "",
    });

    setRecentTrainings(trainings.slice(0, 3));

    const last7Days = getLast7Days();

    setSleepChartData(
      trimLeadingEmptyDays(
        last7Days.map((date) => {
          const row = orderedRows.find((r: any) => r.fecha === date);
          const sleep = first(row?.suenos);

          return {
            value: sleep?.horas_de_sueno
              ? Number(sleep.horas_de_sueno)
              : 0,
            label: shortDate(date),
          };
        })
      )
    );

    setHeartChartData(
      trimLeadingEmptyDays(
        last7Days.map((date) => {
          const row = orderedRows.find((r: any) => r.fecha === date);
          const heart = first(row?.frecuencias_cardiacas);

          return {
            value: heart?.hrv
              ? Number(heart.hrv)
              : 0,
            label: shortDate(date),
          };
        })
      )
    );

    function getLast7Days() {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));

        return formatDateToDB(date);
      });
    }

    function formatDateToDB(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    function trimLeadingEmptyDays<T extends { value: number }>(data: T[]) {
      const maxEmptyDays = 4;
      let cutIndex = 0;
      let emptyStreak = 0;

      for (let i = 0; i < data.length; i++) {
        if (data[i].value === 0) {
          emptyStreak++;

          if (emptyStreak >= maxEmptyDays) {
            cutIndex = i + 1;
          }
        } else {
          emptyStreak = 0;
        }
      }

      return data.slice(cutIndex);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <AthleteLayout title="Dashboard">
        <Text className="text-gray-500">Cargando datos...</Text>
      </AthleteLayout>
    );
  }
  

  function isRecentDate(date?: string) {
    if (!date) return false;

    const today = new Date();
    const targetDate = new Date(date);

    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 2;
  }

  const alerts = [
    getLoadAlert(summary.totalLoad),
    getSleepAlert(summary.sleepHoursValue),
    getHrvAlert(summary.hrvValue),
    getRestingHrAlert(summary.restingHrValue),
    getMoodAlert(summary.moodValue),
    isRecentDate(summary.latestPainDate)
      ? getPainAlert(summary.painIntensity)
      : null,
  ].filter(Boolean) as {
    color: "blue" | "green" | "orange" | "red";
    title: string;
    message: string;
  }[];

  const generalStatusValue = parseFloat(summary.generalStatus) || 0;

  const generalStatusColor =
    generalStatusValue >= 8
      ? "text-blue-600"
      : generalStatusValue >= 6
      ? "text-emerald-600"
      : generalStatusValue >= 4
      ? "text-amber-600"
      : generalStatusValue >= 1
      ? "text-red-600"
      : "text-gray-500";

  return (
    <AthleteLayout title="Dashboard">
      <Text className="text-gray-500 mb-6 text-center">
        ¡Bienvenido/a, {summary.name}!
      </Text>

      <View className="flex-row gap-3 mb-3">
        <MetricCard
          title="Carga"
          value={`${summary.totalLoad} AU`}
          subtitle={summary.loadSubtitle}
          status={statusFromSubtitle(summary.loadSubtitle)}
        />

        <MetricCard
          title="Sueño"
          value={summary.sleepHours}
          subtitle={summary.sleepSubtitle}
          status={statusFromSubtitle(summary.sleepSubtitle)}
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <MetricCard
          title="HRV"
          value={summary.hrv}
          subtitle={summary.hrvSubtitle}
          status={statusFromSubtitle(summary.hrvSubtitle)}
        />

        <MetricCard
          title="Ánimo"
          value={summary.mood}
          subtitle={summary.moodSubtitle}
          status={statusFromSubtitle(summary.moodSubtitle)}
        />
      </View>

      <AppCard className="mb-6">
        <SectionTitle
          title="Estado general"
          subtitle="Resumen calculado a partir del sueño y del estado de ánimo"
        />

        <View className="items-center justify-center py-4">
          <Text className={`text-5xl font-bold ${generalStatusColor}`}>
            {summary.generalStatus}
          </Text>
          <Text className="text-gray-500 mt-2">
            Estado calculado con los últimos registros
          </Text>
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Tendencia de frecuencia cardiaca"
          subtitle="Últimos 7 días"
        />

        <View className="bg-blue-50 rounded-2xl p-4 overflow-hidden">
          {heartChartData.length > 0 ? (
            <LineChart
              data={heartChartData}
              height={150}
              hideDataPoints={false}
              dataPointsColor="#2563EB"
              dataPointsRadius={4}
              thickness={2}
              color="#2563EB"
              initialSpacing={12}
              endSpacing={12}
              maxValue={100}
              noOfSections={5}
              yAxisLabelSuffix=" ms"
              yAxisTextStyle={{
                color: "#6B7280",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 9,
              }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
            />
          ) : (
            <Text className="text-blue-600 font-semibold text-center">
              Sin datos suficientes
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle title="Tendencia de sueño" subtitle="Últimos 7 días" />

        <View className="bg-teal-50 rounded-2xl p-4 overflow-hidden">
          {sleepChartData.length > 0 ? (
            <BarChart
              data={sleepChartData}
              height={150}
              barWidth={18}
              spacing={22}
              initialSpacing={12}
              endSpacing={12}
              roundedTop
              frontColor="#14B8A6"
              maxValue={10}
              noOfSections={5}
              yAxisLabelSuffix=" h"
              yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 9 }}
              xAxisColor="#CBD5E1"
              yAxisColor="#CBD5E1"
              rulesColor="#E5E7EB"
              rulesType="solid"
              yAxisThickness={1}
              xAxisThickness={1}
            />
          ) : (
            <Text className="text-teal-600 font-semibold text-center">
              Sin datos suficientes
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard className="mb-6">
        <SectionTitle
          title="Entrenamientos recientes"
          subtitle="Últimas sesiones registradas"
        />

        <View className="gap-3">
          {recentTrainings.length > 0 ? (
            recentTrainings.map((training, index) => (
              <View
                key={`${training.tipo_entrenamiento}-${index}`}
                className={`flex-row justify-between ${
                  index !== recentTrainings.length - 1
                    ? "border-b border-gray-100 pb-3"
                    : ""
                }`}
              >
                <View>
                  <Text className="font-semibold text-gray-900">
                    {training.tipo_entrenamiento || "Entrenamiento"}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {training.duracion || 0} min · RPE{" "}
                    {training.intensidad_percibida || "-"}
                  </Text>
                </View>

                <Text className="font-bold text-blue-600">
                  {training.carga_de_entrenamiento || 0} AU
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">
              Todavía no hay entrenamientos registrados.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="Alertas"
          subtitle="Indicadores destacados del día"
        />

        <View className="gap-3">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <AlertCard
                key={`${alert.title}-${index}`}
                color={alert.color as "blue" | "green" | "orange" | "red"}
                title={alert.title}
                message={alert.message}
              />
            ))
          ) : (
            <Text className="text-gray-500">
              No hay alertas destacadas por el momento.
            </Text>
          )}
        </View>
      </AppCard>
    </AthleteLayout>
  );
}

function first(value: any) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function calculateMood(motivation: number, stress: number, irritability: number) {
  const stressInv = 11 - stress;
  const irritabilityInv = 11 - irritability;

  return Math.round(
    0.4 * motivation + 0.35 * stressInv + 0.25 * irritabilityInv
  );
}

function AlertCard({
  color,
  title,
  message,
}: {
  color: "blue" | "green" | "orange" | "red";
  title: string;
  message: string;
}) {
  const styles = {
    blue: {
      box: "bg-blue-50",
      text: "text-blue-700",
    },
    green: {
      box: "bg-emerald-50",
      text: "text-emerald-700",
    },
    orange: {
      box: "bg-amber-50",
      text: "text-amber-700",
    },
    red: {
      box: "bg-red-50",
      text: "text-red-700",
    },
  };

  return (
    <View className={`${styles[color].box} rounded-2xl p-3`}>
      <Text className={`${styles[color].text} font-semibold`}>
        {title}
      </Text>

      <Text className={`${styles[color].text} text-sm mt-1`}>
        {message}
      </Text>
    </View>
  );
}

function getLoadAlert(load: number) {
  if (load <= 0) return null;

  if (load <= 300) {
    return {
      color: "orange",
      title: "Carga de entrenamiento baja",
      message:
        "La carga registrada es reducida. Puede ser adecuado si se trata de un día de recuperación.",
    };
  }

  if (load <= 500) {
    return {
      color: "green",
      title: "Carga de entrenamiento favorable",
      message:
        "La carga registrada se encuentra en un rango adecuado, aunque ligeramente inferior al nivel óptimo de entrenamiento.",
    };
  }

  if (load < 700) {
    return {
      color: "blue",
      title: "Carga de entrenamiento óptima",
      message:
        "La carga registrada se encuentra dentro del rango óptimo, equilibrando estímulo de entrenamiento y recuperación.",
    };
  }

  if (load < 800) {
    return {
      color: "orange",
      title: "Carga de entrenamiento elevada",
      message:
        "La carga reciente es alta. Revisa sueño, fatiga y sensaciones antes de aumentar la intensidad.",
    };
  }

  return {
    color: "red",
    title: "Carga de entrenamiento muy elevada",
    message:
      "La carga registrada es muy alta. Se recomienda priorizar la recuperación.",
  };
}

function getSleepAlert(hours: number) {
  if (hours <= 0) return null;

  if (hours < 5) {
    return {
      color: "red",
      title: "Sueño insuficiente",
      message:
        "La duración del sueño es baja y puede afectar a la recuperación y al rendimiento.",
    };
  }

  if (hours < 7) {
    return {
      color: "orange",
      title: "Sueño mejorable",
      message:
        "Has dormido algo menos de lo recomendable. Conviene vigilar la recuperación.",
    };
  }

  if (hours <= 8) {
    return {
      color: "green",
      title: "Sueño adecuado",
      message:
        "La duración del sueño se encuentra dentro de un rango positivo.",
    };
  }

  return {
    color: "blue",
    title: "Muy buena recuperación nocturna",
    message:
      "La duración del sueño ha sido elevada, lo que puede favorecer la recuperación.",
  };
}

function getHrvAlert(hrv: number) {
  if (hrv <= 0) return null;

  if (hrv < 35) {
    return {
      color: "red",
      title: "HRV muy baja",
      message:
        "La variabilidad cardiaca es muy reducida. Puede indicar fatiga o recuperación incompleta.",
    };
  }

  if (hrv < 50) {
    return {
      color: "orange",
      title: "HRV baja",
      message:
        "La HRV está algo reducida. Conviene observar la evolución durante los próximos días.",
    };
  }

  if (hrv < 75) {
    return {
      color: "green",
      title: "HRV en rango normal",
      message:
        "La variabilidad cardiaca se encuentra en un rango adecuado.",
    };
  }

  return {
    color: "blue",
    title: "HRV elevada",
    message:
      "La variabilidad cardiaca es positiva y puede indicar buena recuperación.",
  };
}

function getRestingHrAlert(hr: number) {
  if (hr <= 0) return null;

  if (hr < 50) {
    return {
      color: "blue",
      title: "Frecuencia cardiaca en reposo baja",
      message:
        "La frecuencia cardiaca en reposo es baja, algo habitual en deportistas entrenados.",
    };
  }

  if (hr < 65) {
    return {
      color: "green",
      title: "Frecuencia cardiaca en reposo adecuada",
      message:
        "La frecuencia cardiaca en reposo se encuentra en un rango positivo.",
    };
  }

  if (hr < 80) {
    return {
      color: "orange",
      title: "Frecuencia cardiaca algo elevada",
      message:
        "La frecuencia cardiaca en reposo está algo elevada. Puede estar relacionada con fatiga o estrés.",
    };
  }

  return {
    color: "red",
    title: "Frecuencia cardiaca en reposo elevada",
    message:
      "La frecuencia cardiaca en reposo es alta. Conviene revisar recuperación, descanso y sensaciones.",
  };
}

function getMoodAlert(mood: number) {
  if (mood <= 0) return null;

  if (mood < 4) {
    return {
      color: "red",
      title: "Estado de ánimo bajo",
      message:
        "La autopercepción general es baja. Conviene evitar esfuerzos intensos si las sensaciones no son buenas.",
    };
  }

  if (mood < 6) {
    return {
      color: "orange",
      title: "Estado de ánimo mejorable",
      message:
        "La autopercepción del día es moderada. Conviene tenerlo en cuenta antes de entrenar.",
    };
  }

  if (mood < 8) {
    return {
      color: "green",
      title: "Buen estado de ánimo",
      message:
        "La autopercepción general es positiva para afrontar el entrenamiento.",
    };
  }

  return {
    color: "blue",
    title: "Muy buen estado de ánimo",
    message:
      "La autopercepción general es muy positiva para afrontar el entrenamiento.",
  };
}

function getPainAlert(intensity: number) {
  if (intensity <= 0) return null;

  if (intensity < 4) {
    return {
      color: "green",
      title: "Molestia leve reciente",
      message:
        "Se ha registrado una molestia leve. Conviene observar su evolución.",
    };
  }

  if (intensity < 6) {
    return {
      color: "orange",
      title: "Molestia moderada reciente",
      message:
        "Existe una molestia reciente de intensidad moderada. Conviene controlar la carga.",
    };
  }

  return {
    color: "red",
    title: "Molestia intensa reciente",
    message:
      "Se ha registrado una molestia elevada recientemente. Se recomienda evitar aumentar la carga.",
  };
}

function statusFromSubtitle(subtitle: string) {
  if (subtitle === "Excelente") return "excellent";
  if (subtitle === "Bueno") return "good";
  if (subtitle === "Mejorable") return "warning";
  if (subtitle === "Peligro") return "danger";
  return "noData";
}

