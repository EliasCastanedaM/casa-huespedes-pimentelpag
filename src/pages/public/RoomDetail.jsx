// useEffect ejecuta código cuando carga la página
// useState guarda información dentro del componente
import { useEffect, useState } from "react";

// useParams permite leer el ID que viene en la URL
// Link permite navegar a otra página sin recargar
import { useParams, Link } from "react-router-dom";

// Importamos el servicio que obtiene una habitación por ID
import { getRoomById } from "../../services/roomService";

// Página de detalle de una habitación específica
export default function RoomDetail() {
  // Obtenemos el ID desde la URL /habitaciones/:id
  const { id } = useParams();

  // Estado para guardar la habitación encontrada
  const [room, setRoom] = useState(null);

  // Estado para mostrar mensaje de carga
  const [loading, setLoading] = useState(true);

  // Estado para guardar errores
  const [error, setError] = useState("");

  // Función para cargar la habitación desde el backend
  async function loadRoom() {
    try {
      // Activamos carga
      setLoading(true);

      // Limpiamos errores anteriores
      setError("");

      // Pedimos la habitación al backend
      const data = await getRoomById(id);

      // Guardamos la habitación
      setRoom(data);
    } catch (err) {
      // Mostramos el error en consola para desarrollo
      console.error("Error cargando habitación:", err);

      // Mensaje amigable para el usuario
      setError("No se pudo cargar la habitación seleccionada.");
    } finally {
      // Terminamos carga
      setLoading(false);
    }
  }

  // Ejecutamos la carga cuando cambia el ID de la URL
  useEffect(() => {
    loadRoom();
  }, [id]);

  // Imagen temporal mientras no tengamos fotos reales
  const imageUrl =
    room?.main_image_url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400&auto=format&fit=crop";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Mensaje de carga */}
      {loading && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-gray-600">Cargando habitación...</p>
        </div>
      )}

      {/* Mensaje de error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          {error}
        </div>
      )}

      {/* Contenido de la habitación */}
      {!loading && !error && room && (
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Imagen principal */}
          <div className="bg-gray-200 rounded-3xl overflow-hidden">
            <img
              src={imageUrl}
              alt={room.name}
              className="w-full h-[420px] object-cover"
            />
          </div>

          {/* Información de la habitación */}
          <div>
            <p className="text-brand-blue font-semibold">
              Detalle de habitación
            </p>

            <h1 className="text-4xl font-bold text-brand-dark mt-2">
              {room.name}
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              {room.description || "Habitación disponible para reserva."}
            </p>

            {/* Datos rápidos */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-sm text-gray-500">Capacidad</p>
                <h3 className="text-2xl font-bold text-brand-dark">
                  {room.capacity} persona(s)
                </h3>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-sm text-gray-500">Estado</p>
                <h3 className="text-2xl font-bold text-brand-dark">
                  {room.status}
                </h3>
              </div>
            </div>

            {/* Precio */}
            <div className="mt-8 bg-brand-light rounded-2xl p-6 border border-blue-100">
              <p className="text-sm text-gray-500">Precio por noche desde</p>
              <h2 className="text-4xl font-bold text-brand-blue mt-1">
                S/ {Number(room.price_per_night).toFixed(2)}
              </h2>
            </div>

            {/* Botones */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={`/reservar?roomId=${room.id}`}
                className="bg-brand-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800"
              >
                Reservar esta habitación
              </Link>

              <Link
                to="/habitaciones"
                className="border border-gray-300 px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Volver a habitaciones
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}