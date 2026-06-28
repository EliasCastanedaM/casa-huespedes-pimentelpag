import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
  maintenance: "Mantenimiento",
};

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function getStatusLabel(status) {
  return statusLabels[status] || status || "Sin estado";
}

function getStatusClass(status) {
  if (status === "active") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "inactive") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  if (status === "maintenance") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function RoomsAdmin() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [uploadingRoomId, setUploadingRoomId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 1,
    price_per_night: "",
    status: "active",
    main_image_url: "",
  });

  async function loadRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/rooms/admin");

      setRooms(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error("Error cargando habitaciones:", err);
      setError("No se pudieron cargar las habitaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setEditingRoomId(null);

    setFormData({
      name: "",
      description: "",
      capacity: 1,
      price_per_night: "",
      status: "active",
      main_image_url: "",
    });

    setError("");
    setSuccess("");
  }

  function handleEdit(room) {
    setEditingRoomId(room.id);

    setFormData({
      name: room.name || "",
      description: room.description || "",
      capacity: room.capacity || 1,
      price_per_night: room.price_per_night || "",
      status: room.status || "active",
      main_image_url: room.main_image_url || "",
    });

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!formData.name.trim()) {
        setError("El nombre de la habitación es obligatorio.");
        return;
      }

      if (!formData.price_per_night || Number(formData.price_per_night) < 0) {
        setError("El precio por noche es obligatorio y no puede ser negativo.");
        return;
      }

      if (!formData.capacity || Number(formData.capacity) < 1) {
        setError("La capacidad debe ser como mínimo 1 persona.");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        capacity: Number(formData.capacity),
        price_per_night: Number(formData.price_per_night),
        status: formData.status,
        main_image_url: formData.main_image_url.trim() || null,
      };

      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, payload);
        setSuccess("Habitación actualizada correctamente.");
      } else {
        await api.post("/rooms", payload);
        setSuccess("Habitación creada correctamente.");
      }

      resetForm();
      await loadRooms();
    } catch (err) {
      console.error("Error guardando habitación:", err);

      const backendMessage = err.response?.data?.message;
      setError(backendMessage || "No se pudo guardar la habitación.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(room, newStatus) {
    try {
      setError("");
      setSuccess("");

      await api.put(`/rooms/${room.id}`, {
        name: room.name,
        description: room.description || null,
        capacity: Number(room.capacity),
        price_per_night: Number(room.price_per_night),
        status: newStatus,
        main_image_url: room.main_image_url || null,
      });

      setSuccess("Estado de habitación actualizado correctamente.");
      await loadRooms();
    } catch (err) {
      console.error("Error actualizando estado de habitación:", err);
      setError("No se pudo actualizar el estado de la habitación.");
    }
  }

  async function handleImageUpload(roomId, file) {
    try {
      if (!file) return;

      setError("");
      setSuccess("");
      setUploadingRoomId(roomId);

      const formDataImage = new FormData();
      formDataImage.append("image", file);

      await api.post(`/rooms/${roomId}/image`, formDataImage, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Imagen subida correctamente.");
      await loadRooms();
    } catch (err) {
      console.error("Error subiendo imagen:", err);

      const backendMessage = err.response?.data?.message;
      setError(backendMessage || "No se pudo subir la imagen.");
    } finally {
      setUploadingRoomId(null);
    }
  }

  const stats = useMemo(() => {
    const activeRooms = rooms.filter((room) => room.status === "active");
    const inactiveRooms = rooms.filter((room) => room.status === "inactive");
    const maintenanceRooms = rooms.filter(
      (room) => room.status === "maintenance"
    );

    return {
      totalRooms: rooms.length,
      activeRooms: activeRooms.length,
      inactiveRooms: inactiveRooms.length,
      maintenanceRooms: maintenanceRooms.length,
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesStatus =
        statusFilter === "all" || room.status === statusFilter;

      const matchesSearch =
        !term ||
        String(room.name || "").toLowerCase().includes(term) ||
        String(room.description || "").toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [rooms, searchTerm, statusFilter]);

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <section className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="uppercase tracking-[0.25em] text-sm font-black text-brand-ocean">
              Panel administrativo
            </p>

            <h1 className="text-4xl md:text-5xl font-black text-brand-dark mt-2">
              Habitaciones
            </h1>

            <p className="text-slate-600 mt-3">
              Crea, edita y administra las habitaciones que se muestran en la
              web pública.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRooms}
            className="bg-white border border-slate-200 text-brand-dark px-5 py-3 rounded-full font-black hover:bg-slate-100 transition"
          >
            Actualizar
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 font-bold">
            {success}
          </div>
        )}

        {/* Métricas */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          <article className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-slate-500 font-bold">Total habitaciones</p>
            <h2 className="text-3xl font-black text-brand-dark mt-2">
              {stats.totalRooms}
            </h2>
          </article>

          <article className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-slate-500 font-bold">Activas</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              {stats.activeRooms}
            </h2>
          </article>

          <article className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-slate-500 font-bold">Inactivas</p>
            <h2 className="text-3xl font-black text-slate-600 mt-2">
              {stats.inactiveRooms}
            </h2>
          </article>

          <article className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-slate-500 font-bold">Mantenimiento</p>
            <h2 className="text-3xl font-black text-yellow-600 mt-2">
              {stats.maintenanceRooms}
            </h2>
          </article>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 p-6 mt-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-brand-dark">
                {editingRoomId ? "Editar habitación" : "Crear nueva habitación"}
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Las habitaciones activas aparecen en la web y pueden ser
                seleccionadas por los huéspedes.
              </p>
            </div>

            {editingRoomId && (
              <span className="inline-flex w-fit rounded-full bg-brand-gold text-brand-navy px-4 py-2 text-sm font-black">
                Editando habitación #{editingRoomId}
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                NOMBRE DE HABITACIÓN
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Habitación Familiar con terraza"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                CAPACIDAD
              </label>

              <input
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                PRECIO POR NOCHE
              </label>

              <input
                type="number"
                name="price_per_night"
                min="0"
                step="0.01"
                value={formData.price_per_night}
                onChange={handleChange}
                placeholder="120.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                ESTADO
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="maintenance">Mantenimiento</option>
              </select>

              <p className="text-xs text-slate-500 mt-2">
                Activa: aparece en la web. Inactiva o mantenimiento: no debería
                reservarse.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                URL DE IMAGEN PRINCIPAL
              </label>

              <input
                type="text"
                name="main_image_url"
                value={formData.main_image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              />

              <p className="text-xs text-slate-500 mt-2">
                Puedes pegar una URL o usar el botón “Subir imagen” en la lista
                de habitaciones.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                DESCRIPCIÓN
              </label>

              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe servicios, camas, baño privado, WiFi, terraza, vista, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none resize-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-ocean text-white px-6 py-3 rounded-full font-black hover:bg-brand-dark transition disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : editingRoomId
                ? "Actualizar habitación"
                : "Crear habitación"}
            </button>

            {editingRoomId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-slate-200 bg-white px-6 py-3 rounded-full font-black text-brand-dark hover:bg-slate-100 transition"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {/* Filtros */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 mt-8">
          <div className="grid lg:grid-cols-[1fr_260px] gap-4">
            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                BUSCAR HABITACIÓN
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
                FILTRAR POR ESTADO
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-slate-500 mt-3">
            Mostrando {filteredRooms.length} de {rooms.length} habitación(es).
          </p>
        </div>

        {/* Lista */}
        <div className="mt-8">
          {loading && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center font-bold text-slate-500">
              Cargando habitaciones...
            </div>
          )}

          {!loading && rooms.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
              <h2 className="text-2xl font-black text-brand-dark">
                Aún no hay habitaciones registradas
              </h2>

              <p className="text-slate-500 mt-2">
                Crea la primera habitación usando el formulario superior.
              </p>
            </div>
          )}

          {!loading && rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
              <h2 className="text-2xl font-black text-brand-dark">
                No se encontraron habitaciones
              </h2>

              <p className="text-slate-500 mt-2">
                Prueba con otro nombre, descripción o estado.
              </p>
            </div>
          )}

          {!loading && filteredRooms.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-2xl font-black text-brand-dark">
                  Habitaciones registradas
                </h2>

                <p className="text-slate-500 text-sm mt-1">
                  Gestiona disponibilidad, precios, imágenes y estado de cada
                  habitación.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-5 py-4">Habitación</th>
                      <th className="text-left px-5 py-4">Capacidad</th>
                      <th className="text-left px-5 py-4">Precio</th>
                      <th className="text-left px-5 py-4">Estado</th>
                      <th className="text-left px-5 py-4">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRooms.map((room) => (
                      <tr
                        key={room.id}
                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-5 py-4 min-w-[340px]">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                              {room.main_image_url ? (
                                <img
                                  src={room.main_image_url}
                                  alt={room.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                                  Sin foto
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-black text-brand-dark">
                                {room.name || "Habitación sin nombre"}
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                Habitación #{room.id}
                              </p>

                              <p className="text-sm text-slate-500 line-clamp-2 mt-2 max-w-xl">
                                {room.description || "Sin descripción"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 text-blue-700 px-3 py-1 font-black">
                            {Number(room.capacity || 0)} persona(s)
                          </span>
                        </td>

                        <td className="px-5 py-4 font-black text-brand-dark">
                          {formatMoney(room.price_per_night)}
                        </td>

                        <td className="px-5 py-4 min-w-[190px]">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full border text-xs font-black mb-2 ${getStatusClass(
                              room.status
                            )}`}
                          >
                            {getStatusLabel(room.status)}
                          </span>

                          <select
                            value={room.status || "inactive"}
                            onChange={(event) =>
                              handleQuickStatusChange(room, event.target.value)
                            }
                            className="block w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                          >
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                            <option value="maintenance">Mantenimiento</option>
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <button
                              type="button"
                              onClick={() => handleEdit(room)}
                              className="bg-brand-ocean text-white px-4 py-2 rounded-full text-xs font-black hover:bg-brand-dark transition"
                            >
                              Editar
                            </button>

                            <input
                              id={`room-image-${room.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleImageUpload(
                                  room.id,
                                  event.target.files?.[0]
                                )
                              }
                            />

                            <label
                              htmlFor={`room-image-${room.id}`}
                              className={`cursor-pointer text-center border border-slate-200 px-4 py-2 rounded-full text-xs font-black transition ${
                                uploadingRoomId === room.id
                                  ? "bg-slate-100 text-slate-400"
                                  : "bg-white text-brand-dark hover:bg-slate-100"
                              }`}
                            >
                              {uploadingRoomId === room.id
                                ? "Subiendo..."
                                : "Subir imagen"}
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}