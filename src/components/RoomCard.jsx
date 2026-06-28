// Link permite navegar a otra página sin recargar toda la aplicación
import { Link } from "react-router-dom";

// Este componente muestra una tarjeta visual de una habitación
export default function RoomCard({ room }) {
  // Si la habitación no tiene imagen real, usamos una imagen temporal
  const imageUrl =
    room.main_image_url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      
      {/* Imagen de la habitación */}
      <div className="h-56 bg-gray-200">
        <img
          src={imageUrl}
          alt={room.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido principal de la tarjeta */}
      <div className="p-5">
        
        {/* Nombre de la habitación */}
        <h2 className="text-xl font-bold text-brand-dark">
          {room.name}
        </h2>

        {/* Descripción corta */}
        <p className="mt-2 text-sm text-gray-600">
          {room.description || "Habitación disponible para reserva."}
        </p>

        {/* Datos rápidos de la habitación */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Capacidad: <strong>{room.capacity}</strong>
          </span>

          <span>
            Estado: <strong>{room.status}</strong>
          </span>
        </div>

        {/* Precio y botón de detalle */}
        <div className="mt-5 flex items-center justify-between gap-4">
          
          {/* Precio por noche */}
          <div>
            <p className="text-xs text-gray-500">Desde</p>
            <p className="text-2xl font-bold text-brand-blue">
              S/ {Number(room.price_per_night).toFixed(2)}
            </p>
          </div>

          {/* Botón para ver detalle */}
          <Link
            to={`/habitaciones/${room.id}`}
            className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}