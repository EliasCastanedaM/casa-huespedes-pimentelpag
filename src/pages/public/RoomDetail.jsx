import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRoomById } from "../../services/roomService";

const fallbackImage =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400&auto=format&fit=crop";

export default function RoomDetail() {
  const { id } = useParams();

  const [room, setRoom] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRoom() {
    try {
      setLoading(true);
      setError("");

      const data = await getRoomById(id);
      setRoom(data);

      const mainVideo = data?.videos?.find((video) => video.is_main);
      const firstVideo = data?.videos?.[0];
      const mainImage = data?.images?.find((image) => image.is_main);
      const firstImage = data?.images?.[0];

      if (mainVideo || firstVideo) {
        setSelectedMedia({
          type: "video",
          url: mainVideo?.video_url || firstVideo?.video_url,
          title: mainVideo?.title || firstVideo?.title || "Video de la habitación",
        });
      } else {
        setSelectedMedia({
          type: "image",
          url: mainImage?.image_url || firstImage?.image_url || data?.main_image_url || fallbackImage,
          title: data?.name,
        });
      }
    } catch (err) {
      console.error("Error cargando habitación:", err);
      setError("No se pudo cargar la habitación seleccionada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
  }, [id]);

  const photos = useMemo(() => {
    const dbPhotos = room?.images || [];

    if (dbPhotos.length > 0) {
      return dbPhotos;
    }

    return [
      {
        id: "fallback",
        image_url: room?.main_image_url || fallbackImage,
        is_main: true,
      },
    ];
  }, [room]);

  const videos = room?.videos || [];
  const visiblePhotos = showAllPhotos ? photos : photos.slice(0, 12);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <p className="text-gray-600">Cargando habitación...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
          {error || "Habitación no encontrada."}
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[#fbf7f0]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          to="/habitaciones"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#4b250f]"
        >
          ← Volver a habitaciones
        </Link>

        <section className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black text-[#2b2118]">
                {room.name}
              </h1>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                Disponible
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-700">
              <span>👤 {room.capacity} huésped(es)</span>
              <span>🛏️ Hab. {room.id}</span>
              <span>📷 {photos.length} fotos</span>
              <span>🎥 {videos.length} videos</span>
            </div>

            <div className="mt-6 grid lg:grid-cols-[1fr_280px] gap-4">
              <div className="relative bg-black rounded-3xl overflow-hidden min-h-[420px]">
                {selectedMedia?.type === "video" ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    playsInline
                    className="w-full h-[420px] object-cover"
                    poster={room.main_image_url || photos[0]?.image_url}
                  />
                ) : (
                  <img
                    src={selectedMedia?.url || fallbackImage}
                    alt={selectedMedia?.title || room.name}
                    className="w-full h-[420px] object-cover"
                  />
                )}

                <div className="absolute left-4 bottom-4 bg-black/60 text-white rounded-full px-4 py-2 text-sm font-bold">
                  {selectedMedia?.type === "video" ? "🎥 Video seleccionado" : "📷 Foto seleccionada"}
                </div>
              </div>

              <div className="grid gap-3">
                {videos.slice(0, 4).map((video, index) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() =>
                      setSelectedMedia({
                        type: "video",
                        url: video.video_url,
                        title: video.title || `Video ${index + 1}`,
                      })
                    }
                    className="relative h-[98px] rounded-2xl overflow-hidden bg-black text-left group"
                  >
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90"
                      muted
                    />

                    <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
                      <span className="font-bold text-sm">
                        ▶ {video.title || `Ver video ${index + 1}`}
                      </span>
                      <span className="text-xs bg-black/50 px-2 py-1 rounded-full">
                        Video
                      </span>
                    </div>
                  </button>
                ))}

                {videos.length === 0 && (
                  <div className="h-full min-h-[420px] bg-white border border-[#eadfce] rounded-3xl p-6 flex flex-col justify-center">
                    <p className="text-[#4b250f] font-black text-lg">
                      Videos pendientes
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Aquí se mostrarán los 5 videos entregados por el cliente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-3xl border border-[#eadfce] p-5">
              <div className="flex gap-3 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("photos")}
                  className={`px-4 py-3 font-bold ${
                    activeTab === "photos"
                      ? "text-[#4b250f] border-b-2 border-[#b77a35]"
                      : "text-gray-500"
                  }`}
                >
                  📷 Fotos ({photos.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("videos")}
                  className={`px-4 py-3 font-bold ${
                    activeTab === "videos"
                      ? "text-[#4b250f] border-b-2 border-[#b77a35]"
                      : "text-gray-500"
                  }`}
                >
                  🎥 Videos ({videos.length})
                </button>
              </div>

              {activeTab === "photos" && (
                <div className="mt-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {visiblePhotos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() =>
                          setSelectedMedia({
                            type: "image",
                            url: photo.image_url,
                            title: room.name,
                          })
                        }
                        className="h-32 rounded-2xl overflow-hidden bg-gray-100"
                      >
                        <img
                          src={photo.image_url}
                          alt={room.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        />
                      </button>
                    ))}
                  </div>

                  {photos.length > 12 && (
                    <div className="text-center mt-5">
                      <button
                        type="button"
                        onClick={() => setShowAllPhotos((value) => !value)}
                        className="border border-[#eadfce] px-5 py-3 rounded-xl font-bold text-[#4b250f] hover:bg-[#fbf7f0]"
                      >
                        {showAllPhotos
                          ? "Ver menos fotos"
                          : `Ver todas las fotos (${photos.length})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "videos" && (
                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  {videos.length > 0 ? (
                    videos.map((video, index) => (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() =>
                          setSelectedMedia({
                            type: "video",
                            url: video.video_url,
                            title: video.title || `Video ${index + 1}`,
                          })
                        }
                        className="relative h-48 rounded-2xl overflow-hidden bg-black text-left"
                      >
                        <video
                          src={video.video_url}
                          className="w-full h-full object-cover opacity-75"
                          muted
                        />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white/90 text-[#4b250f] w-14 h-14 rounded-full flex items-center justify-center text-2xl">
                            ▶
                          </span>
                        </div>

                        <div className="absolute left-4 bottom-4 text-white">
                          <p className="font-black">
                            {video.title || `Video ${index + 1}`}
                          </p>
                          <p className="text-xs opacity-80">
                            Recorrido de habitación
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-600">
                      Aún no hay videos cargados para esta habitación.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl border border-[#eadfce] p-6">
                <h2 className="text-xl font-black text-[#2b2118]">
                  Descripción
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {room.description ||
                    "Habitación cómoda y acogedora, ideal para una estadía tranquila."}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-[#eadfce] p-6">
                <h2 className="text-xl font-black text-[#2b2118]">
                  Características
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <span>☕ Cafetería</span>
                  <span>🚿 Baño privado</span>
                  <span>📶 WiFi</span>
                  <span>🌅 Terraza</span>
                  <span>📺 TV</span>
                  <span>🧺 Toallas</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-[#eadfce] shadow-sm p-6">
              <p className="text-sm text-gray-500">Precio por noche</p>
              <h2 className="text-4xl font-black text-[#2b2118] mt-1">
                S/ {Number(room.price_per_night).toFixed(2)}
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-600">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <Link
                to={`/reservar?roomId=${room.id}`}
                className="mt-6 block text-center bg-[#4b250f] text-white px-6 py-4 rounded-xl font-black hover:bg-[#2f1608]"
              >
                Reservar ahora
              </Link>

              <div className="mt-5 bg-green-50 text-green-700 rounded-2xl p-4 text-sm">
                ✅ Cancelación gratuita hasta 24 horas antes del check-in.
              </div>
            </div>

            <div className="mt-5 bg-[#f4eadc] rounded-3xl border border-[#eadfce] p-6">
              <h3 className="font-black text-[#2b2118]">¿Necesitas ayuda?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Escríbenos por WhatsApp para resolver tus dudas.
              </p>

              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block bg-white border border-[#eadfce] px-5 py-3 rounded-xl font-bold text-[#4b250f]"
              >
                Contactar
              </a>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}