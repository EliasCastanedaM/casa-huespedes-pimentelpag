import { useEffect, useMemo, useState } from "react";
import {
  createBooking,
  getRoomAvailability,
  getRooms,
} from "../../services/api";
import "./Home.css";

const includedServices = [
  {
    icon: "☕",
    title: "Cafetería",
    description: "Espacio cómodo para iniciar el día durante la estadía.",
  },
  {
    icon: "🚿",
    title: "Baño privado",
    description: "Habitaciones con baño privado para mayor comodidad.",
  },
  {
    icon: "📶",
    title: "WiFi",
    description: "Conectividad disponible para huéspedes.",
  },
  {
    icon: "🌅",
    title: "Terraza",
    description: "Terraza con vista al mar para disfrutar Pimentel.",
  },
];

const extraServices = [
  {
    title: "Cocina equipada",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop",
    description:
      "Ambiente equipado para preparar alimentos durante la estadía.",
  },
  {
    title: "Lavado y planchado",
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=1200&auto=format&fit=crop",
    description: "Servicio de lavandería previa coordinación con el hospedaje.",
  },
  {
    title: "Taxi y estacionamiento",
    image:
      "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?q=80&w=1200&auto=format&fit=crop",
    description:
      "Apoyo en movilidad local y orientación sobre estacionamiento cercano.",
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop",
];

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

function normalizeRoomStatus(room, hasDateSelected) {
  if (!room) return "idle";

  if (!hasDateSelected) return "idle";

  const status = room.availability_status || room.status;

  if (status === "available") return "available";
  if (status === "blocked") return "blocked";
  if (status === "maintenance") return "blocked";
  if (status === "inactive") return "blocked";

  return status === "active" ? "available" : "blocked";
}

export default function Home() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const [availableRooms, setAvailableRooms] = useState([]);
  const [floorRooms, setFloorRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState("success");

  const [bookingForm, setBookingForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    document_number: "",
    room_id: "",
    check_in: "",
    check_in_time: "14:00",
    nights: 1,
    guests_count: 1,
    special_requests: "",
  });

  const hasDateSelected =
    Boolean(bookingForm.check_in) &&
    Boolean(bookingForm.nights) &&
    Number(bookingForm.nights) > 0;

  useEffect(() => {
    async function loadRooms() {
      try {
        setIsLoadingRooms(true);

        const roomsData = await getRooms();

        const activeRooms = Array.isArray(roomsData)
          ? roomsData.filter((room) => room.status === "active")
          : [];

        setAvailableRooms(activeRooms);
        setFloorRooms(
          activeRooms.map((room) => ({
            ...room,
            availability_status: "idle",
          }))
        );
      } catch (error) {
        console.error(error);
        setBookingError(
          "No se pudieron cargar las habitaciones desde la base de datos."
        );
      } finally {
        setIsLoadingRooms(false);
      }
    }

    loadRooms();
  }, []);

  useEffect(() => {
    async function checkAvailability() {
      if (!hasDateSelected) {
        setAvailabilityError("");
        setFloorRooms(
          availableRooms.map((room) => ({
            ...room,
            availability_status: "idle",
          }))
        );
        return;
      }

      try {
        setIsCheckingAvailability(true);
        setAvailabilityError("");

        const result = await getRoomAvailability({
          check_in: bookingForm.check_in,
          nights: bookingForm.nights,
          check_in_time: bookingForm.check_in_time,
        });

        const roomsResult = Array.isArray(result) ? result : result.rooms || [];

        setFloorRooms(roomsResult);
      } catch (error) {
        console.error(error);

        setAvailabilityError(
          "No se pudo validar la disponibilidad en tiempo real. Se muestran las habitaciones activas."
        );

        setFloorRooms(
          availableRooms.map((room) => ({
            ...room,
            availability_status: "available",
          }))
        );
      } finally {
        setIsCheckingAvailability(false);
      }
    }

    checkAvailability();
  }, [
    bookingForm.check_in,
    bookingForm.nights,
    bookingForm.check_in_time,
    availableRooms,
    hasDateSelected,
  ]);

  const featuredRooms = useMemo(() => {
    return availableRooms.slice(0, 4);
  }, [availableRooms]);

  function handleBookingChange(event) {
    const { name, value } = event.target;

    setBookingForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function handleSelectRoom(room) {
    const roomStatus = normalizeRoomStatus(room, hasDateSelected);

    if (roomStatus === "blocked") return;

    setBookingForm((prevForm) => ({
      ...prevForm,
      room_id: String(room.id),
      guests_count:
        Number(prevForm.guests_count) > Number(room.capacity || 1)
          ? room.capacity || 1
          : prevForm.guests_count,
    }));
  }

  function goToAvailability() {
    const section = document.getElementById("disponibilidad");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();

    setBookingMessage("");
    setBookingError("");
    setBookingMessageType("success");

    if (
      !bookingForm.full_name ||
      !bookingForm.phone ||
      !bookingForm.room_id ||
      !bookingForm.check_in ||
      !bookingForm.check_in_time ||
      !bookingForm.nights ||
      !bookingForm.guests_count
    ) {
      setBookingError(
        "Completa nombre, celular, habitación, fecha, hora, noches y huéspedes."
      );
      return;
    }

    try {
      setIsSubmittingBooking(true);

      const payload = {
        full_name: bookingForm.full_name,
        phone: bookingForm.phone,
        email: bookingForm.email || null,
        document_number: bookingForm.document_number || null,
        room_id: Number(bookingForm.room_id),
        check_in: bookingForm.check_in,
        check_in_time: bookingForm.check_in_time,
        nights: Number(bookingForm.nights),
        guests_count: Number(bookingForm.guests_count),
        special_requests: bookingForm.special_requests || null,
      };

      const result = await createBooking(payload);

      if (result.mode === "inquiry") {
        setBookingMessageType("warning");
        setBookingMessage(
          result.message ||
            "Tu solicitud fue enviada como consulta. El hospedaje se comunicará contigo para revisar la disponibilidad."
        );
      } else {
        setBookingMessageType("success");
        setBookingMessage(
          `Solicitud registrada correctamente. Código: ${
            result.booking?.booking_code || result.booking?.id || "pendiente"
          }`
        );
      }

      setBookingForm({
        full_name: "",
        phone: "",
        email: "",
        document_number: "",
        room_id: "",
        check_in: "",
        check_in_time: "14:00",
        nights: 1,
        guests_count: 1,
        special_requests: "",
      });
    } catch (error) {
      console.error(error);
      setBookingError(error.message || "No se pudo registrar la reserva.");
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  return (
    <main className="home-page">
      {/* HERO */}
      <section id="inicio" className="hotel-hero scroll-mt-32">
        <div className="hotel-hero-image">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800&auto=format&fit=crop"
            alt="Casa Huéspedes Pimentel"
          />

          <div className="hotel-hero-overlay" />

          <div className="home-section hotel-hero-content">
            <div className="hotel-hero-text">
              <p className="hotel-hero-kicker">
                Descanso · Playa · Pimentel
              </p>

              <h1>Un refugio cerca al mar.</h1>

              <p>
                Habitaciones cómodas, atención directa y una estadía tranquila
                para disfrutar el balneario de Pimentel.
              </p>

              <div className="hotel-hero-actions">
                <button
                  type="button"
                  onClick={goToAvailability}
                  className="hotel-btn-primary"
                >
                  Reservar ahora
                </button>

                <a href="#habitaciones" className="hotel-btn-light">
                  Ver habitaciones
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE RESERVA */}
        <div className="hotel-booking-bar">
          <div className="hotel-booking-inner">
            <div className="hotel-booking-grid">
              <div className="hotel-booking-field">
                <label>Check-in</label>

                <input
                  type="date"
                  name="check_in"
                  value={bookingForm.check_in}
                  min={getTomorrowDate()}
                  onChange={handleBookingChange}
                />
              </div>

              <div className="hotel-booking-field">
                <label>Noches</label>

                <input
                  type="number"
                  name="nights"
                  min="1"
                  value={bookingForm.nights}
                  onChange={handleBookingChange}
                />
              </div>

              <div className="hotel-booking-field">
                <label>Huéspedes</label>

                <input
                  type="number"
                  name="guests_count"
                  min="1"
                  value={bookingForm.guests_count}
                  onChange={handleBookingChange}
                />
              </div>

              <button
                type="button"
                onClick={goToAvailability}
                className="hotel-booking-button"
              >
                Ver disponibilidad
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ VIAJAR A PIMENTEL */}
      <StoryVideoSection
        id="por-que-pimentel"
        eyebrow="Destino"
        title="¿Por qué viajar a Pimentel?"
        description="Pimentel es un balneario tranquilo, ideal para caminar cerca al mar, visitar el muelle, disfrutar atardeceres y desconectarse en un ambiente costero sin complicaciones."
        videoSrc="/videos/pimentel.mp4"
        poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1800&auto=format&fit=crop"
      />

      {/* POR QUÉ HOSPEDARSE */}
      <StoryVideoSection
        id="nosotros"
        eyebrow="Hospedaje"
        title="¿Por qué hospedarse en Casa Huéspedes?"
        description="Porque tendrás una estadía sencilla, cómoda y cercana al mar. Casa Huéspedes Pimentel ofrece habitaciones funcionales, atención directa y una ubicación pensada para descansar durante tu visita."
        videoSrc="/videos/casa-huespedes.mp4"
        poster="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800&auto=format&fit=crop"
        reverse
      />

      {/* HABITACIONES */}
      <section
        id="habitaciones"
        className="home-section hotel-rooms-section scroll-mt-32"
      >
        <div className="hotel-section-header">
          <div>
            <p className="hotel-eyebrow">Alojamiento</p>

            <h2 className="hotel-title">Habitaciones para cada viajero</h2>
          </div>

          <a href="#disponibilidad" className="hotel-small-link">
            Ver disponibilidad →
          </a>
        </div>

        {isLoadingRooms ? (
          <div className="hotel-empty-card">Cargando habitaciones...</div>
        ) : featuredRooms.length === 0 ? (
          <div className="hotel-empty-card">
            No hay habitaciones disponibles por el momento.
          </div>
        ) : (
          <div className="hotel-room-grid">
            {featuredRooms.map((room) => (
              <article key={room.id} className="hotel-room-card">
                <img
                  src={
                    room.main_image_url ||
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={room.name}
                />

                <div className="hotel-room-card-content">
                  <h3>{room.name}</h3>

                  <div className="hotel-room-meta">
                    <span>👤 {room.capacity} huésped(es)</span>
                    <span>🛏 Hab. {room.id}</span>
                  </div>

                  <div className="hotel-room-footer">
                    <p className="hotel-price">
                      {formatMoney(room.price_per_night)}
                      <span> / noche</span>
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingForm((prev) => ({
                          ...prev,
                          room_id: String(room.id),
                        }));
                        goToAvailability();
                      }}
                      className="hotel-link-btn"
                    >
                      Elegir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SERVICIOS DESTACADOS */}
      <section id="servicios-incluidos" className="hotel-services-strip">
        <div className="home-section hotel-services-grid">
          {includedServices.map((service) => (
            <article key={service.title} className="hotel-service-item">
              <div className="hotel-service-icon">{service.icon}</div>

              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GALERÍA Y TESTIMONIO */}
      <section
        id="galeria"
        className="home-section hotel-gallery-section scroll-mt-32"
      >
        <div>
          <p className="hotel-eyebrow">Galería</p>

          <h2 className="hotel-title hotel-gallery-title">
            Espacios que invitan a quedarse
          </h2>
        </div>

        <div className="hotel-gallery-grid">
          {galleryImages.map((image) => (
            <img
              key={image}
              src={image}
              alt="Galería Casa Huéspedes Pimentel"
              className="hotel-gallery-img"
            />
          ))}
        </div>

        <div className="hotel-testimonial">
          <p className="hotel-eyebrow">Testimonio</p>

          <p className="hotel-testimonial-text">
            “Un lugar tranquilo para descansar y disfrutar Pimentel. La atención
            fue cercana y la estadía muy cómoda.”
          </p>

          <p className="hotel-testimonial-name">Huésped visitante</p>
          <p className="hotel-testimonial-place">Casa Huéspedes Pimentel</p>
        </div>
      </section>

      {/* EXTRAS */}
      <section
        id="servicios-extras"
        className="hotel-extras-section scroll-mt-32"
      >
        <div className="home-section">
          <div className="hotel-section-header">
            <div>
              <p className="hotel-eyebrow">Servicios</p>

              <h2 className="hotel-title">Servicios extras</h2>
            </div>

            <p className="hotel-section-description">
              Servicios adicionales coordinados directamente con el hospedaje,
              según disponibilidad.
            </p>
          </div>

          <div className="hotel-extra-grid">
            {extraServices.map((service) => (
              <article key={service.title} className="hotel-extra-card">
                <img src={service.image} alt={service.title} />

                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DISPONIBILIDAD */}
      <section
        id="disponibilidad"
        className="home-section hotel-availability-section scroll-mt-32"
      >
        <div className="hotel-availability-grid">
          <form onSubmit={handleBookingSubmit} className="hotel-form-card">
            <p className="hotel-eyebrow">Reserva online</p>

            <h2 className="hotel-title hotel-form-title">
              Datos del huésped
            </h2>

            <p className="hotel-form-description">
              Completa tus datos y el hospedaje revisará tu solicitud.
            </p>

            <div className="hotel-form-grid">
              <div className="hotel-field hotel-field-full">
                <label className="hotel-label">Nombre completo</label>
                <input
                  type="text"
                  name="full_name"
                  value={bookingForm.full_name}
                  onChange={handleBookingChange}
                  placeholder="Ej: María López"
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">DNI / Documento</label>
                <input
                  type="text"
                  name="document_number"
                  value={bookingForm.document_number}
                  onChange={handleBookingChange}
                  placeholder="Ej: 76543210"
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Celular</label>
                <input
                  type="text"
                  name="phone"
                  value={bookingForm.phone}
                  onChange={handleBookingChange}
                  placeholder="Ej: 999 999 999"
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field hotel-field-full">
                <label className="hotel-label">Correo</label>
                <input
                  type="email"
                  name="email"
                  value={bookingForm.email}
                  onChange={handleBookingChange}
                  placeholder="opcional"
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field hotel-field-full">
                <label className="hotel-label">Habitación</label>
                <select
                  name="room_id"
                  value={bookingForm.room_id}
                  onChange={handleBookingChange}
                  disabled={isLoadingRooms}
                  className="hotel-select"
                >
                  <option value="">
                    {isLoadingRooms
                      ? "Cargando habitaciones..."
                      : "Seleccionar habitación"}
                  </option>

                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} — Capacidad {room.capacity} persona(s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Fecha</label>
                <input
                  type="date"
                  name="check_in"
                  min={getTomorrowDate()}
                  value={bookingForm.check_in}
                  onChange={handleBookingChange}
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Hora de ingreso</label>
                <select
                  name="check_in_time"
                  value={bookingForm.check_in_time}
                  onChange={handleBookingChange}
                  className="hotel-select"
                >
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="22:00">22:00</option>
                  <option value="23:00">23:00</option>
                </select>
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Noches</label>
                <input
                  type="number"
                  name="nights"
                  min="1"
                  value={bookingForm.nights}
                  onChange={handleBookingChange}
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Huéspedes</label>
                <input
                  type="number"
                  name="guests_count"
                  min="1"
                  value={bookingForm.guests_count}
                  onChange={handleBookingChange}
                  className="hotel-input"
                />
              </div>

              <div className="hotel-field hotel-field-full">
                <label className="hotel-label">Comentario opcional</label>
                <textarea
                  rows="4"
                  name="special_requests"
                  value={bookingForm.special_requests}
                  onChange={handleBookingChange}
                  placeholder="Ej: Llegaré con mi familia, deseo consultar estacionamiento."
                  className="hotel-textarea"
                />
              </div>
            </div>

            {bookingError && (
              <div className="hotel-alert hotel-alert-error">{bookingError}</div>
            )}

            {bookingMessage && (
              <div
                className={`hotel-alert ${
                  bookingMessageType === "warning"
                    ? "hotel-alert-warning"
                    : "hotel-alert-success"
                }`}
              >
                {bookingMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingBooking}
              className="hotel-submit-button"
            >
              {isSubmittingBooking
                ? "Registrando solicitud..."
                : "Enviar solicitud"}
            </button>
          </form>

          <aside className="hotel-side-card">
            <p className="hotel-eyebrow">Disponibilidad</p>

            <h3 className="hotel-title hotel-side-title">
              Distribución del primer piso
            </h3>

            <p className="hotel-side-description">
              Selecciona fecha y noches para ver la disponibilidad actualizada.
            </p>

            <FloorPlan
              rooms={floorRooms}
              selectedRoomId={bookingForm.room_id}
              hasDateSelected={hasDateSelected}
              isChecking={isCheckingAvailability}
              onSelectRoom={handleSelectRoom}
            />

            {availabilityError && (
              <div className="hotel-alert hotel-alert-warning">
                {availabilityError}
              </div>
            )}

            <a
              href="https://wa.me/51901551287?text=Hola,%20quiero%20consultar%20disponibilidad%20en%20Casa%20Huéspedes%20Pimentel"
              target="_blank"
              rel="noreferrer"
              className="hotel-whatsapp-button"
            >
              Consultar por WhatsApp
            </a>
          </aside>
        </div>
      </section>

      {/* CTA */}
      <section className="hotel-cta">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1800&auto=format&fit=crop"
          alt="Pimentel"
        />

        <div className="home-section hotel-cta-content">
          <div className="hotel-cta-card">
            <div>
              <h2 className="hotel-title">¿Listo para visitar Pimentel?</h2>

              <p>
                Reserva ahora y coordina tu estadía directamente con el
                hospedaje.
              </p>
            </div>

            <button
              type="button"
              onClick={goToAvailability}
              className="hotel-btn-primary"
            >
              Reservar ahora
            </button>
          </div>
        </div>
      </section>

      <SocialDock />

      <FloatingSupportWidget
        isOpen={isSupportOpen}
        onOpen={() => setIsSupportOpen(true)}
        onClose={() => setIsSupportOpen(false)}
      />
    </main>
  );
}

function StoryVideoSection({
  id,
  eyebrow,
  title,
  description,
  videoSrc,
  poster,
  reverse = false,
}) {
  return (
    <section
      id={id}
      className={`home-section hotel-story-section scroll-mt-32 ${
        reverse ? "hotel-story-section-reverse" : ""
      }`}
    >
      <div className="hotel-story-copy">
        <p className="hotel-eyebrow">{eyebrow}</p>

        <h2 className="hotel-title hotel-story-title">{title}</h2>

        <p>{description}</p>
      </div>

      <div className="hotel-video-frame">
        <video controls muted playsInline poster={poster}>
          <source src={videoSrc} type="video/mp4" />
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    </section>
  );
}

function FloorPlan({
  rooms,
  selectedRoomId,
  hasDateSelected,
  isChecking,
  onSelectRoom,
}) {
  const firstFloorRooms = rooms.slice(0, 5);

  const slots = [
    {
      code: "101",
      room: firstFloorRooms[0],
      area: "room-1",
    },
    {
      code: "102",
      room: firstFloorRooms[1],
      area: "room-2",
    },
    {
      code: "103",
      room: firstFloorRooms[2],
      area: "room-3",
    },
    {
      code: "104",
      room: firstFloorRooms[3],
      area: "room-4",
    },
    {
      code: "105",
      room: firstFloorRooms[4],
      area: "room-5",
    },
  ];

  const availableCount = firstFloorRooms.filter(
    (room) => normalizeRoomStatus(room, hasDateSelected) === "available"
  ).length;

  const blockedCount = firstFloorRooms.filter(
    (room) => normalizeRoomStatus(room, hasDateSelected) === "blocked"
  ).length;

  return (
    <div className="floor-card">
      <div className="floor-legend">
        <div>
          <span className="floor-dot floor-dot-idle" />
          Pendiente
        </div>

        <div>
          <span className="floor-dot floor-dot-available" />
          Disponible
        </div>

        <div>
          <span className="floor-dot floor-dot-blocked" />
          Bloqueada
        </div>
      </div>

      <div className="floor-status-text">
        {isChecking
          ? "Consultando disponibilidad..."
          : hasDateSelected
            ? `${availableCount} disponible(s) y ${blockedCount} bloqueada(s) para la fecha seleccionada.`
            : "Selecciona una fecha para consultar disponibilidad."}
      </div>

      <div className="floor-plan">
        {slots.map((slot) => (
          <RoomBox
            key={slot.code}
            code={slot.code}
            room={slot.room}
            area={slot.area}
            selectedRoomId={selectedRoomId}
            hasDateSelected={hasDateSelected}
            onSelectRoom={onSelectRoom}
          />
        ))}

        <div className="floor-corridor">Pasillo</div>
        <div className="floor-reception">Recepción</div>
        <div className="floor-stairs">Escalera</div>
      </div>

      <div className="floor-note">
        Al seleccionar una habitación disponible del plano, se completa
        automáticamente en el formulario.
      </div>
    </div>
  );
}

function RoomBox({
  code,
  room,
  area,
  selectedRoomId,
  hasDateSelected,
  onSelectRoom,
}) {
  if (!room) {
    return (
      <div className={`floor-room floor-room-empty ${area}`}>
        <strong>Hab. {code}</strong>
        <span>Sin datos</span>
      </div>
    );
  }

  const roomStatus = normalizeRoomStatus(room, hasDateSelected);
  const isSelected = String(selectedRoomId) === String(room.id);
  const isBlocked = roomStatus === "blocked";

  return (
    <button
      type="button"
      onClick={() => onSelectRoom(room)}
      disabled={isBlocked}
      title={room.name}
      className={`floor-room ${area} floor-room-${roomStatus} ${
        isSelected ? "floor-room-selected" : ""
      }`}
    >
      <strong>Hab. {code}</strong>
      <span>{room.capacity || 1} persona(s)</span>

      <small>
        {!hasDateSelected
          ? "Pendiente"
          : isBlocked
            ? "Bloqueada"
            : "Disponible"}
      </small>
    </button>
  );
}

function SocialDock() {
  return (
    <div className="fixed left-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 bg-[#fbf7ef]/95 border border-[#eadfce] rounded-full px-2 py-4 shadow-xl backdrop-blur-md">
      <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black text-[#2d261f] tracking-[0.25em] uppercase">
        Síguenos
      </span>

      <a
        href="https://www.facebook.com/casadehuespedespimentel/?locale=es_LA"
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className="w-11 h-11 rounded-full bg-[#2b1d12] text-white grid place-items-center font-black text-lg hover:bg-[#a87545] transition"
      >
        f
      </a>

      <a
        href="https://www.tiktok.com/@casahuespedespimentel"
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
        className="w-11 h-11 rounded-full bg-[#2b1d12] text-white grid place-items-center font-black text-lg hover:bg-[#a87545] transition"
      >
        ♪
      </a>

      <a
        href="https://www.instagram.com/casahuespedes.pimentel/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        className="w-11 h-11 rounded-full bg-[#2b1d12] text-white grid place-items-center font-black text-lg hover:bg-[#a87545] transition"
      >
        ◎
      </a>
    </div>
  );
}

function FloatingSupportWidget({ isOpen, onOpen, onClose }) {
  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="hotel-floating-btn"
          aria-label="Abrir atención al cliente"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="hotel-support-card">
          <button
            type="button"
            onClick={onClose}
            className="hotel-support-close"
            aria-label="Cerrar atención al cliente"
          >
            ×
          </button>

          <div className="hotel-support-header">
            <h3>¿Necesitas ayuda?</h3>
            <p>Escríbenos por WhatsApp para consultar disponibilidad.</p>
          </div>

          <div className="hotel-support-body">
            <a
              href="https://wa.me/51901551287?text=Hola,%20quiero%20consultar%20disponibilidad%20en%20Casa%20Huéspedes%20Pimentel"
              target="_blank"
              rel="noreferrer"
              className="hotel-whatsapp-button"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}