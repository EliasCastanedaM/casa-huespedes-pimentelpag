import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  const imageUrl =
    room.main_image_url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

  return (
    <article className="group bg-white rounded-3xl shadow-sm border border-[#eadfce] overflow-hidden hover:shadow-xl transition duration-300">
      <Link to={`/habitaciones/${room.id}`} className="block">
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />

          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4b250f]">
            Disponible
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              📷 {room.photos_count || 30} fotos
            </span>
            <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              🎥 {room.videos_count || 5} videos
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <h2 className="text-xl font-bold text-[#2b2118] line-clamp-1">
          {room.name}
        </h2>

        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {room.description || "Habitación cómoda y disponible para reserva."}
        </p>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span>👤 {room.capacity} huésped(es)</span>
          <span>🛏️ Hab. {room.id}</span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Desde</p>
            <p className="text-2xl font-black text-[#b77a35]">
              S/ {Number(room.price_per_night).toFixed(2)}
              <span className="text-xs text-gray-500 font-semibold"> / noche</span>
            </p>
          </div>

          <Link
            to={`/habitaciones/${room.id}`}
            className="text-[#4b250f] font-black hover:underline"
          >
            Ver habitación
          </Link>
        </div>
      </div>
    </article>
  );
}