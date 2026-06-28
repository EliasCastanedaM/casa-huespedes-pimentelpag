import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardData } from "../../services/api";

const statusLabels = {
  pending: "Pendiente",
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  completed: "Finalizada",
};

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState({
    bookings: [],
    inquiries: [],
    rooms: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError("");

      const dashboardData = await getDashboardData();

      setData({
        bookings: Array.isArray(dashboardData.bookings)
          ? dashboardData.bookings
          : [],
        inquiries: Array.isArray(dashboardData.inquiries)
          ? dashboardData.inquiries
          : [],
        rooms: Array.isArray(dashboardData.rooms) ? dashboardData.rooms : [],
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar el dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const pendingBookings = data.bookings.filter((booking) =>
      ["pending", "pending_payment"].includes(booking.status)
    );

    const confirmedBookings = data.bookings.filter(
      (booking) => booking.status === "confirmed"
    );

    const pendingInquiries = data.inquiries.filter(
      (inquiry) => inquiry.status === "pending"
    );

    const activeRooms = data.rooms.filter((room) => room.status === "active");

    const totalSales = data.bookings
      .filter((booking) => booking.status === "confirmed")
      .reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);

    return {
      totalBookings: data.bookings.length,
      pendingBookings: pendingBookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingInquiries: pendingInquiries.length,
      activeRooms: activeRooms.length,
      totalSales,
    };
  }, [data]);

  const latestBookings = data.bookings.slice(0, 5);
  const latestInquiries = data.inquiries.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <section className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="uppercase tracking-[0.25em] text-sm font-black text-brand-ocean">
              Panel administrativo
            </p>

            <h1 className="text-4xl md:text-5xl font-black text-brand-dark mt-2">
              Dashboard
            </h1>

            <p className="text-slate-600 mt-3">
              Resumen general de reservas, consultas y habitaciones.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="bg-white border border-slate-200 text-brand-dark px-5 py-3 rounded-full font-black hover:bg-slate-100 transition"
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-bold">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-8 text-center font-bold text-slate-500">
            Cargando dashboard...
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4 mt-8">
              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Reservas</p>
                <h2 className="text-3xl font-black text-brand-dark mt-2">
                  {stats.totalBookings}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Pendientes</p>
                <h2 className="text-3xl font-black text-orange-600 mt-2">
                  {stats.pendingBookings}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Confirmadas</p>
                <h2 className="text-3xl font-black text-green-600 mt-2">
                  {stats.confirmedBookings}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Consultas pendientes</p>
                <h2 className="text-3xl font-black text-yellow-600 mt-2">
                  {stats.pendingInquiries}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Habitaciones activas</p>
                <h2 className="text-3xl font-black text-blue-600 mt-2">
                  {stats.activeRooms}
                </h2>
              </article>

              <article className="bg-brand-dark rounded-2xl border border-brand-dark p-5">
                <p className="text-white/70 font-bold">Total confirmado</p>
                <h2 className="text-3xl font-black text-brand-gold mt-2">
                  {formatMoney(stats.totalSales)}
                </h2>
              </article>
            </div>

            <div className="grid xl:grid-cols-2 gap-6 mt-8">
              <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark">
                      Últimas reservas
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Solicitudes recibidas recientemente.
                    </p>
                  </div>

                  <Link
                    to="/admin/reservas"
                    className="bg-brand-ocean text-white px-4 py-2 rounded-full font-black text-sm"
                  >
                    Ver todo
                  </Link>
                </div>

                {latestBookings.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-bold">
                    No hay reservas registradas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {latestBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="font-black text-brand-dark">
                            {booking.customer_name || "Cliente"}
                          </p>
                          <p className="text-slate-500 text-sm">
                            {booking.room_name || "Habitación"} ·{" "}
                            {formatDate(booking.check_in)} ·{" "}
                            {booking.nights} noche(s)
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="font-black text-brand-dark">
                            {formatMoney(booking.total_amount)}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {statusLabels[booking.status] || booking.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark">
                      Últimas consultas
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Mensajes recibidos desde la web.
                    </p>
                  </div>

                  <Link
                    to="/admin/consultas"
                    className="bg-brand-ocean text-white px-4 py-2 rounded-full font-black text-sm"
                  >
                    Ver todo
                  </Link>
                </div>

                {latestInquiries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-bold">
                    No hay consultas registradas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {latestInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="p-5">
                        <p className="font-black text-brand-dark">
                          {inquiry.customer_name}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          📞 {inquiry.phone || "-"} · ✉️{" "}
                          {inquiry.email || "-"}
                        </p>
                        <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                          {inquiry.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mt-8">
              <Link
                to="/admin/reservas"
                className="bg-brand-ocean text-white rounded-3xl p-6 font-black hover:bg-brand-dark transition"
              >
                Gestionar reservas →
              </Link>

              <Link
                to="/admin/consultas"
                className="bg-brand-gold text-brand-navy rounded-3xl p-6 font-black hover:bg-brand-goldDark transition"
              >
                Revisar consultas →
              </Link>

              <Link
                to="/admin/horarios"
                className="bg-white border border-slate-200 text-brand-dark rounded-3xl p-6 font-black hover:bg-slate-100 transition"
              >
                Configurar horarios →
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}