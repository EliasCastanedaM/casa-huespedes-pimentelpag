// useEffect ejecuta lógica al cargar la página
// useState guarda datos del formulario
import { useEffect, useState } from "react";

// useSearchParams permite leer roomId desde la URL
// Link permite navegar entre páginas
import { Link, useSearchParams } from "react-router-dom";

// Servicio para obtener datos de una habitación
import { getRoomById } from "../../services/roomService";

// Servicios para validar disponibilidad y crear reserva
import { checkAvailability, createBooking } from "../../services/bookingService";

// Página donde el cliente crea una reserva
export default function Booking() {
  // Leemos parámetros de la URL, por ejemplo /reservar?roomId=1
  const [searchParams] = useSearchParams();

  // Obtenemos el roomId desde la URL
  const roomId = searchParams.get("roomId");

  // Estado para guardar habitación seleccionada
  const [room, setRoom] = useState(null);

  // Estado para indicar carga inicial
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Estado para indicar envío del formulario
  const [submitting, setSubmitting] = useState(false);

  // Estado para mensajes de error
  const [error, setError] = useState("");

  // Estado para mensaje de éxito
  const [success, setSuccess] = useState("");

  // Estado para guardar la reserva creada
  const [createdBooking, setCreatedBooking] = useState(null);

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    check_in: "",
    check_out: "",
    guests_count: 1,
    special_requests: "",
    customer: {
      full_name: "",
      phone: "",
      email: "",
      document_type: "DNI",
      document_number: "",
    },
  });

  // Función para cargar habitación seleccionada
  async function loadSelectedRoom() {
    try {
      // Limpiamos error anterior
      setError("");

      // Si no existe roomId en la URL, mostramos error
      if (!roomId) {
        setError("No se seleccionó ninguna habitación.");
        return;
      }

      // Pedimos la habitación al backend
      const data = await getRoomById(roomId);

      // Guardamos la habitación
      setRoom(data);
    } catch (err) {
      // Mostramos error técnico en consola
      console.error("Error cargando habitación para reserva:", err);

      // Mostramos mensaje amigable
      setError("No se pudo cargar la habitación seleccionada.");
    } finally {
      // Terminamos carga inicial
      setLoadingRoom(false);
    }
  }

  // Ejecutamos carga de habitación cuando abre la página
  useEffect(() => {
    loadSelectedRoom();
  }, [roomId]);

  // Función para actualizar campos simples del formulario
  function handleChange(event) {
    // Obtenemos nombre y valor del input
    const { name, value } = event.target;

    // Actualizamos el campo correspondiente
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Función para actualizar campos dentro de customer
  function handleCustomerChange(event) {
    // Obtenemos nombre y valor del input
    const { name, value } = event.target;

    // Actualizamos solo el objeto customer
    setFormData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [name]: value,
      },
    }));
  }

  // Función para calcular noches en el frontend
  function calculateNightsFrontend() {
    // Si faltan fechas, retornamos 0
    if (!formData.check_in || !formData.check_out) return 0;

    // Convertimos fechas
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);

    // Calculamos diferencia en días
    const diff = (end - start) / (1000 * 60 * 60 * 24);

    // Retornamos noches si es positivo
    return diff > 0 ? diff : 0;
  }

  // Calculamos noches
  const nights = calculateNightsFrontend();

  // Calculamos total estimado
  const totalAmount = room ? nights * Number(room.price_per_night) : 0;

  // Función principal para enviar reserva
  async function handleSubmit(event) {
    // Evitamos que el formulario recargue la página
    event.preventDefault();

    try {
      // Activamos envío
      setSubmitting(true);

      // Limpiamos mensajes anteriores
      setError("");
      setSuccess("");
      setCreatedBooking(null);

      // Validamos que exista habitación
      if (!room) {
        setError("No hay habitación seleccionada.");
        return;
      }

      // Validamos fechas
      if (!formData.check_in || !formData.check_out) {
        setError("Selecciona fecha de ingreso y fecha de salida.");
        return;
      }

      // Validamos noches
      if (nights <= 0) {
        setError("La fecha de salida debe ser posterior a la fecha de ingreso.");
        return;
      }

      // Validamos cantidad de huéspedes
      if (Number(formData.guests_count) > Number(room.capacity)) {
        setError("La cantidad de huéspedes supera la capacidad de la habitación.");
        return;
      }

      // Validamos datos básicos del cliente
      if (!formData.customer.full_name || !formData.customer.phone) {
        setError("El nombre y el celular son obligatorios.");
        return;
      }

      // Primero validamos disponibilidad
      const availability = await checkAvailability({
        room_id: Number(room.id),
        check_in: formData.check_in,
        check_out: formData.check_out,
      });

      // Si no está disponible, detenemos el proceso
      if (!availability.available) {
        setError("La habitación no está disponible en esas fechas.");
        return;
      }

      // Armamos objeto para enviar al backend
      const bookingPayload = {
        room_id: Number(room.id),
        check_in: formData.check_in,
        check_out: formData.check_out,
        guests_count: Number(formData.guests_count),
        special_requests: formData.special_requests,
        customer: {
          full_name: formData.customer.full_name,
          phone: formData.customer.phone,
          email: formData.customer.email,
          document_type: formData.customer.document_type,
          document_number: formData.customer.document_number,
        },
      };

      // Creamos reserva en backend
      const result = await createBooking(bookingPayload);

      // Guardamos reserva creada
      setCreatedBooking(result.data.booking);

      // Mostramos mensaje de éxito
      setSuccess("Reserva creada correctamente. Estado: pendiente de pago.");
    } catch (err) {
      // Mostramos error técnico en consola
      console.error("Error creando reserva:", err);

      // Mensaje específico si el backend respondió
      const backendMessage = err.response?.data?.message;

      // Mostramos mensaje amigable
      setError(backendMessage || "No se pudo crear la reserva.");
    } finally {
      // Terminamos envío
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Encabezado */}
      <div className="mb-10">
        <p className="text-brand-blue font-semibold">Reserva online</p>

        <h1 className="text-4xl font-bold text-brand-dark mt-2">
          Confirmar reserva
        </h1>

        <p className="mt-3 text-gray-600 max-w-2xl">
          Completa los datos para crear una reserva pendiente de pago.
          En el siguiente paso conectaremos la pasarela de pago.
        </p>
      </div>

      {/* Carga inicial */}
      {loadingRoom && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <p className="text-gray-600">Cargando habitación...</p>
        </div>
      )}

      {/* Error si no carga habitación */}
      {!loadingRoom && error && !room && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          {error}
        </div>
      )}

      {/* Formulario principal */}
      {!loadingRoom && room && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
          >
            {/* Fechas */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-4">
                Fechas de estadía
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de ingreso
                  </label>
                  <input
                    type="date"
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de salida
                  </label>
                  <input
                    type="date"
                    name="check_out"
                    value={formData.check_out}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Huéspedes */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-4">
                Huéspedes
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cantidad de huéspedes
                </label>
                <input
                  type="number"
                  name="guests_count"
                  min="1"
                  max={room.capacity}
                  value={formData.guests_count}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Capacidad máxima: {room.capacity} persona(s)
                </p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-4">
                Datos del cliente
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.customer.full_name}
                    onChange={handleCustomerChange}
                    placeholder="Nombre y apellidos"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.customer.phone}
                    onChange={handleCustomerChange}
                    placeholder="999999999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.customer.email}
                    onChange={handleCustomerChange}
                    placeholder="cliente@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de documento
                  </label>
                  <select
                    name="document_type"
                    value={formData.customer.document_type}
                    onChange={handleCustomerChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de documento
                  </label>
                  <input
                    type="text"
                    name="document_number"
                    value={formData.customer.document_number}
                    onChange={handleCustomerChange}
                    placeholder="Documento"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Solicitudes especiales */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Solicitudes adicionales
              </label>
              <textarea
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                rows="4"
                placeholder="Ejemplo: llegaré en la noche, necesito información adicional..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                {error}
              </div>
            )}

            {/* Mensaje de éxito */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
                {success}
                {createdBooking && (
                  <p className="mt-2 text-sm">
                    Código de reserva: #{createdBooking.id}
                  </p>
                )}
              </div>
            )}

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60"
            >
              {submitting ? "Creando reserva..." : "Crear reserva pendiente de pago"}
            </button>
          </form>

          {/* Resumen lateral */}
          <aside className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
            <h2 className="text-xl font-bold text-brand-dark">
              Resumen
            </h2>

            <div className="mt-5">
              <p className="text-sm text-gray-500">Habitación</p>
              <h3 className="font-bold text-lg text-brand-dark">
                {room.name}
              </h3>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Precio por noche</span>
                <strong>S/ {Number(room.price_per_night).toFixed(2)}</strong>
              </div>

              <div className="flex justify-between">
                <span>Noches</span>
                <strong>{nights}</strong>
              </div>

              <div className="flex justify-between">
                <span>Huéspedes</span>
                <strong>{formData.guests_count}</strong>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-5 pt-5">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total estimado</span>
                <strong className="text-2xl text-brand-blue">
                  S/ {totalAmount.toFixed(2)}
                </strong>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              La reserva quedará pendiente de pago. Luego integraremos pago online.
            </p>

            <Link
              to={`/habitaciones/${room.id}`}
              className="block text-center mt-5 border border-gray-300 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Volver al detalle
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}