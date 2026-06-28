import { useEffect, useState } from "react";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  getAvailabilitySettings,
  getBlockedSlots,
  getRooms,
  updateAvailabilitySettings,
} from "../../services/api";

const days = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ScheduleAdmin() {
  const [settings, setSettings] = useState({
    start_time: "08:00",
    end_time: "23:00",
    slot_minutes: 60,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
    is_active: true,
  });

  const [rooms, setRooms] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockForm, setBlockForm] = useState({
    room_id: "",
    blocked_date: "",
    blocked_time: "14:00",
    block_type: "day",
    reason: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [settingsData, roomsData, blockedData] = await Promise.all([
        getAvailabilitySettings(),
        getRooms(),
        getBlockedSlots(),
      ]);

      if (settingsData) {
        setSettings({
          start_time: String(settingsData.start_time).slice(0, 5),
          end_time: String(settingsData.end_time).slice(0, 5),
          slot_minutes: settingsData.slot_minutes || 60,
          monday: Boolean(settingsData.monday),
          tuesday: Boolean(settingsData.tuesday),
          wednesday: Boolean(settingsData.wednesday),
          thursday: Boolean(settingsData.thursday),
          friday: Boolean(settingsData.friday),
          saturday: Boolean(settingsData.saturday),
          sunday: Boolean(settingsData.sunday),
          is_active: Boolean(settingsData.is_active),
        });
      }

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setBlockedSlots(Array.isArray(blockedData) ? blockedData : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar la configuración.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleSettingsChange(event) {
    const { name, value, type, checked } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleBlockChange(event) {
    const { name, value } = event.target;

    setBlockForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    try {
      setIsSavingSettings(true);
      setError("");
      setMessage("");

      await updateAvailabilitySettings({
        ...settings,
        slot_minutes: Number(settings.slot_minutes),
      });

      setMessage("Configuración de horarios actualizada.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo guardar la configuración.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleCreateBlock(event) {
    event.preventDefault();

    if (!blockForm.room_id || !blockForm.blocked_date) {
      setError("Selecciona habitación y fecha para crear el bloqueo.");
      return;
    }

    try {
      setIsSavingBlock(true);
      setError("");
      setMessage("");

      await createBlockedSlot({
        room_id: Number(blockForm.room_id),
        blocked_date: blockForm.blocked_date,
        blocked_time:
          blockForm.block_type === "day" ? null : blockForm.blocked_time,
        block_type: blockForm.block_type,
        reason: blockForm.reason || null,
      });

      setMessage("Bloqueo creado correctamente.");

      setBlockForm({
        room_id: "",
        blocked_date: "",
        blocked_time: "14:00",
        block_type: "day",
        reason: "",
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear el bloqueo.");
    } finally {
      setIsSavingBlock(false);
    }
  }

  async function handleDeleteBlock(id) {
    try {
      setError("");
      setMessage("");

      await deleteBlockedSlot(id);
      setMessage("Bloqueo eliminado correctamente.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo eliminar el bloqueo.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <section className="max-w-7xl mx-auto">
        <div>
          <p className="uppercase tracking-[0.25em] text-sm font-black text-brand-ocean">
            Panel administrativo
          </p>

          <h1 className="text-4xl md:text-5xl font-black text-brand-dark mt-2">
            Horarios y bloqueos
          </h1>

          <p className="text-slate-600 mt-3">
            Configura el horario general de atención y bloquea fechas u horas no disponibles.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-bold">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 font-bold">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-8 text-center font-bold text-slate-500">
            Cargando configuración...
          </div>
        ) : (
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 mt-8">
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-3xl border border-slate-200 p-6"
            >
              <h2 className="text-2xl font-black text-brand-dark">
                Configuración general
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                    HORA INICIO
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={settings.start_time}
                    onChange={handleSettingsChange}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                    HORA FIN
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={settings.end_time}
                    onChange={handleSettingsChange}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                    DURACIÓN DEL BLOQUE / MINUTOS
                  </label>
                  <input
                    type="number"
                    name="slot_minutes"
                    min="30"
                    step="30"
                    value={settings.slot_minutes}
                    onChange={handleSettingsChange}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-black text-brand-dark">
                  Días disponibles
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {days.map((day) => (
                    <label
                      key={day.key}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name={day.key}
                        checked={settings[day.key]}
                        onChange={handleSettingsChange}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="mt-6 flex items-center gap-3 bg-brand-sand border border-brand-border rounded-2xl px-4 py-3 font-black text-brand-dark">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={settings.is_active}
                  onChange={handleSettingsChange}
                />
                Sistema de horarios activo
              </label>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full mt-6 bg-brand-ocean text-white rounded-full py-4 font-black hover:bg-brand-dark transition disabled:opacity-60"
              >
                {isSavingSettings ? "Guardando..." : "Guardar configuración"}
              </button>
            </form>

            <div className="space-y-6">
              <form
                onSubmit={handleCreateBlock}
                className="bg-white rounded-3xl border border-slate-200 p-6"
              >
                <h2 className="text-2xl font-black text-brand-dark">
                  Crear bloqueo
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                      HABITACIÓN
                    </label>
                    <select
                      name="room_id"
                      value={blockForm.room_id}
                      onChange={handleBlockChange}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                    >
                      <option value="">Seleccionar habitación</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                      FECHA
                    </label>
                    <input
                      type="date"
                      name="blocked_date"
                      value={blockForm.blocked_date}
                      onChange={handleBlockChange}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                      TIPO
                    </label>
                    <select
                      name="block_type"
                      value={blockForm.block_type}
                      onChange={handleBlockChange}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                    >
                      <option value="day">Bloquear todo el día</option>
                      <option value="time">Bloquear una hora</option>
                    </select>
                  </div>

                  {blockForm.block_type === "time" && (
                    <div>
                      <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                        HORA
                      </label>
                      <input
                        type="time"
                        name="blocked_time"
                        value={blockForm.blocked_time}
                        onChange={handleBlockChange}
                        className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                      MOTIVO
                    </label>
                    <input
                      type="text"
                      name="reason"
                      value={blockForm.reason}
                      onChange={handleBlockChange}
                      placeholder="Ej. mantenimiento, reserva manual, limpieza profunda..."
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="w-full mt-6 bg-brand-gold text-brand-navy rounded-full py-4 font-black hover:bg-brand-goldDark transition disabled:opacity-60"
                >
                  {isSavingBlock ? "Creando..." : "Crear bloqueo"}
                </button>
              </form>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-2xl font-black text-brand-dark">
                    Bloqueos registrados
                  </h2>
                </div>

                {blockedSlots.length === 0 ? (
                  <div className="p-6 text-center font-bold text-slate-500">
                    No hay bloqueos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-brand-dark text-white">
                        <tr>
                          <th className="text-left p-4">Habitación</th>
                          <th className="text-left p-4">Fecha</th>
                          <th className="text-left p-4">Tipo</th>
                          <th className="text-left p-4">Motivo</th>
                          <th className="text-left p-4">Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {blockedSlots.map((slot) => (
                          <tr
                            key={slot.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-4 font-black text-slate-800">
                              {slot.room_name || `Habitación ${slot.room_id}`}
                            </td>

                            <td className="p-4">
                              <p>{formatDate(slot.blocked_date)}</p>
                              <p className="text-slate-500">
                                {slot.block_type === "day"
                                  ? "Todo el día"
                                  : slot.blocked_time}
                              </p>
                            </td>

                            <td className="p-4">
                              {slot.block_type === "day"
                                ? "Día completo"
                                : "Hora específica"}
                            </td>

                            <td className="p-4 text-slate-600">
                              {slot.reason || "-"}
                            </td>

                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(slot.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl font-black hover:bg-red-700"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}