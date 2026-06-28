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

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStatusLabel(status) {
  return statusLabels[status] || status || "Sin estado";
}

function getPercentage(value, total) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    alert("No hay información para exportar.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(";")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function StatisticsAdmin() {
  const [data, setData] = useState({
    bookings: [],
    inquiries: [],
    rooms: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatistics() {
    try {
      setLoading(true);
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
      console.error("Error cargando estadísticas:", err);
      setError(err.message || "No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatistics();
  }, []);

  const stats = useMemo(() => {
    const confirmedBookings = data.bookings.filter(
      (booking) => booking.status === "confirmed"
    );

    const pendingBookings = data.bookings.filter((booking) =>
      ["pending", "pending_payment"].includes(booking.status)
    );

    const cancelledBookings = data.bookings.filter((booking) =>
      ["cancelled", "rejected"].includes(booking.status)
    );

    const completedBookings = data.bookings.filter(
      (booking) => booking.status === "completed"
    );

    const pendingInquiries = data.inquiries.filter(
      (inquiry) => inquiry.status === "pending"
    );

    const totalConfirmedAmount = confirmedBookings.reduce(
      (sum, booking) => sum + Number(booking.total_amount || 0),
      0
    );

    const totalRegisteredAmount = data.bookings.reduce(
      (sum, booking) => sum + Number(booking.total_amount || 0),
      0
    );

    const averageBookingAmount =
      data.bookings.length > 0
        ? totalRegisteredAmount / data.bookings.length
        : 0;

    return {
      totalBookings: data.bookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      cancelledBookings: cancelledBookings.length,
      completedBookings: completedBookings.length,
      totalInquiries: data.inquiries.length,
      pendingInquiries: pendingInquiries.length,
      totalRooms: data.rooms.length,
      activeRooms: data.rooms.filter((room) => room.status === "active").length,
      inactiveRooms: data.rooms.filter((room) => room.status === "inactive")
        .length,
      maintenanceRooms: data.rooms.filter(
        (room) => room.status === "maintenance"
      ).length,
      totalConfirmedAmount,
      totalRegisteredAmount,
      averageBookingAmount,
    };
  }, [data]);

  const bookingsByStatus = useMemo(() => {
    const statusOrder = [
      "pending",
      "pending_payment",
      "confirmed",
      "completed",
      "cancelled",
      "rejected",
    ];

    return statusOrder
      .map((status) => {
        const count = data.bookings.filter(
          (booking) => booking.status === status
        ).length;

        return {
          status,
          label: getStatusLabel(status),
          count,
          percentage: getPercentage(count, data.bookings.length),
        };
      })
      .filter((item) => item.count > 0);
  }, [data.bookings]);

  const roomRanking = useMemo(() => {
    const rankingMap = {};

    data.bookings.forEach((booking) => {
      const roomName =
        booking.room_name ||
        data.rooms.find((room) => Number(room.id) === Number(booking.room_id))
          ?.name ||
        "Habitación no identificada";

      if (!rankingMap[roomName]) {
        rankingMap[roomName] = {
          roomName,
          bookings: 0,
          amount: 0,
          confirmedAmount: 0,
          pendingAmount: 0,
        };
      }

      rankingMap[roomName].bookings += 1;
      rankingMap[roomName].amount += Number(booking.total_amount || 0);

      if (booking.status === "confirmed") {
        rankingMap[roomName].confirmedAmount += Number(
          booking.total_amount || 0
        );
      }

      if (["pending", "pending_payment"].includes(booking.status)) {
        rankingMap[roomName].pendingAmount += Number(booking.total_amount || 0);
      }
    });

    return Object.values(rankingMap).sort((a, b) => {
      if (b.bookings !== a.bookings) return b.bookings - a.bookings;
      return b.amount - a.amount;
    });
  }, [data.bookings, data.rooms]);

  const topBookedRoom = roomRanking[0];

  const topRevenueRoom = useMemo(() => {
    if (roomRanking.length === 0) return null;

    return [...roomRanking].sort((a, b) => b.amount - a.amount)[0];
  }, [roomRanking]);

  const customerRanking = useMemo(() => {
    const customerMap = {};

    data.bookings.forEach((booking) => {
      const customerName =
        booking.customer_name ||
        booking.full_name ||
        booking.customer_full_name ||
        "Cliente no identificado";

      const customerPhone =
        booking.customer_phone || booking.phone || booking.customer_phone_number || "";

      const key = `${customerName}-${customerPhone}`;

      if (!customerMap[key]) {
        customerMap[key] = {
          customerName,
          customerPhone,
          bookings: 0,
          amount: 0,
          lastBooking: null,
        };
      }

      customerMap[key].bookings += 1;
      customerMap[key].amount += Number(booking.total_amount || 0);

      const currentDate = booking.check_in || booking.created_at;

      if (
        currentDate &&
        (!customerMap[key].lastBooking ||
          new Date(currentDate) > new Date(customerMap[key].lastBooking))
      ) {
        customerMap[key].lastBooking = currentDate;
      }
    });

    return Object.values(customerMap)
      .sort((a, b) => {
        if (b.bookings !== a.bookings) return b.bookings - a.bookings;
        return b.amount - a.amount;
      })
      .slice(0, 8);
  }, [data.bookings]);

  const monthlySummary = useMemo(() => {
    const summaryMap = {};

    data.bookings.forEach((booking) => {
      const baseDate = booking.check_in || booking.created_at;

      if (!baseDate) return;

      const date = new Date(baseDate);

      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          month: key,
          bookings: 0,
          confirmedBookings: 0,
          amount: 0,
          confirmedAmount: 0,
        };
      }

      summaryMap[key].bookings += 1;
      summaryMap[key].amount += Number(booking.total_amount || 0);

      if (booking.status === "confirmed") {
        summaryMap[key].confirmedBookings += 1;
        summaryMap[key].confirmedAmount += Number(booking.total_amount || 0);
      }
    });

    return Object.values(summaryMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [data.bookings]);

  const bestMonthByBookings = useMemo(() => {
    if (monthlySummary.length === 0) return null;

    return [...monthlySummary].sort((a, b) => b.bookings - a.bookings)[0];
  }, [monthlySummary]);

  const bestMonthByRevenue = useMemo(() => {
    if (monthlySummary.length === 0) return null;

    return [...monthlySummary].sort((a, b) => b.amount - a.amount)[0];
  }, [monthlySummary]);

  const maxMonthlyBookings = useMemo(() => {
    return Math.max(...monthlySummary.map((item) => item.bookings), 1);
  }, [monthlySummary]);

  const roomsWithoutBookings = useMemo(() => {
    const bookedRoomNames = new Set(
      data.bookings.map((booking) => booking.room_name).filter(Boolean)
    );

    return data.rooms
      .filter((room) => !bookedRoomNames.has(room.name))
      .map((room) => room.name)
      .slice(0, 6);
  }, [data.bookings, data.rooms]);

  function handleExportBookings() {
    const rows = data.bookings.map((booking) => ({
      codigo: booking.booking_code || booking.id,
      cliente: booking.customer_name || "",
      telefono: booking.customer_phone || booking.phone || "",
      habitacion: booking.room_name || "",
      fecha_ingreso: booking.check_in || "",
      fecha_salida: booking.check_out || "",
      noches: booking.nights || "",
      huespedes: booking.guests_count || "",
      total: booking.total_amount || 0,
      estado: getStatusLabel(booking.status),
      creado: booking.created_at || "",
    }));

    exportToCsv("reservas_casa_huespedes.csv", rows);
  }

  function handleExportInquiries() {
    const rows = data.inquiries.map((inquiry) => ({
      cliente: inquiry.customer_name || "",
      telefono: inquiry.phone || "",
      correo: inquiry.email || "",
      asunto: inquiry.subject || "",
      mensaje: inquiry.message || "",
      estado: inquiry.status || "",
      creado: inquiry.created_at || "",
    }));

    exportToCsv("consultas_casa_huespedes.csv", rows);
  }

  function handleExportRooms() {
    const rows = data.rooms.map((room) => ({
      id: room.id,
      habitacion: room.name || "",
      capacidad: room.capacity || "",
      precio_por_noche: room.price_per_night || 0,
      estado: room.status || "",
      descripcion: room.description || "",
      imagen: room.main_image_url || "",
    }));

    exportToCsv("habitaciones_casa_huespedes.csv", rows);
  }

  function handleExportRoomRanking() {
    const rows = roomRanking.map((room, index) => ({
      ranking: index + 1,
      habitacion: room.roomName,
      reservas: room.bookings,
      total_registrado: room.amount,
      total_confirmado: room.confirmedAmount,
      total_pendiente: room.pendingAmount,
    }));

    exportToCsv("ranking_habitaciones_casa_huespedes.csv", rows);
  }

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
              Estadísticas
            </h1>

            <p className="text-slate-600 mt-3">
              Indicadores para entender qué habitaciones se mueven más, cuánto
              se registra y dónde hay mayor actividad.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportBookings}
              className="bg-brand-gold text-brand-navy px-5 py-3 rounded-full font-black hover:bg-brand-goldDark transition"
            >
              Exportar reservas
            </button>

            <button
              type="button"
              onClick={handleExportInquiries}
              className="bg-white border border-slate-200 text-brand-dark px-5 py-3 rounded-full font-black hover:bg-slate-100 transition"
            >
              Exportar consultas
            </button>

            <button
              type="button"
              onClick={handleExportRooms}
              className="bg-white border border-slate-200 text-brand-dark px-5 py-3 rounded-full font-black hover:bg-slate-100 transition"
            >
              Exportar habitaciones
            </button>

            <button
              type="button"
              onClick={loadStatistics}
              className="bg-brand-ocean text-white px-5 py-3 rounded-full font-black hover:bg-brand-dark transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-bold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-8 text-center font-bold text-slate-500">
            Cargando estadísticas...
          </div>
        ) : (
          <>
            {/* Métricas principales */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4 mt-8">
              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Reservas totales</p>
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
                <p className="text-slate-500 font-bold">Canceladas</p>
                <h2 className="text-3xl font-black text-red-600 mt-2">
                  {stats.cancelledBookings}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Promedio reserva</p>
                <h2 className="text-3xl font-black text-blue-600 mt-2">
                  {formatMoney(stats.averageBookingAmount)}
                </h2>
              </article>

              <article className="bg-brand-dark rounded-2xl border border-brand-dark p-5">
                <p className="text-white/70 font-bold">Total confirmado</p>
                <h2 className="text-3xl font-black text-brand-gold mt-2">
                  {formatMoney(stats.totalConfirmedAmount)}
                </h2>
              </article>
            </div>

            {/* Métricas secundarias */}
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Total registrado</p>
                <h2 className="text-2xl font-black text-brand-dark mt-2">
                  {formatMoney(stats.totalRegisteredAmount)}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Consultas pendientes</p>
                <h2 className="text-2xl font-black text-yellow-600 mt-2">
                  {stats.pendingInquiries}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Habitaciones activas</p>
                <h2 className="text-2xl font-black text-blue-600 mt-2">
                  {stats.activeRooms}
                </h2>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-slate-500 font-bold">Mantenimiento</p>
                <h2 className="text-2xl font-black text-yellow-600 mt-2">
                  {stats.maintenanceRooms}
                </h2>
              </article>
            </div>

            {/* Insights rápidos */}
            <div className="grid lg:grid-cols-3 gap-5 mt-8">
              <article className="bg-brand-ocean text-white rounded-3xl p-6">
                <p className="text-white/70 font-bold">
                  Habitación más reservada
                </p>

                <h2 className="text-2xl font-black mt-3">
                  {topBookedRoom?.roomName || "Sin información"}
                </h2>

                <p className="text-white/80 mt-2">
                  {topBookedRoom
                    ? `${topBookedRoom.bookings} reserva(s) registradas`
                    : "Aún no hay reservas suficientes."}
                </p>
              </article>

              <article className="bg-brand-gold text-brand-navy rounded-3xl p-6">
                <p className="text-brand-navy/70 font-bold">
                  Habitación con más ingreso
                </p>

                <h2 className="text-2xl font-black mt-3">
                  {topRevenueRoom?.roomName || "Sin información"}
                </h2>

                <p className="text-brand-navy/80 mt-2">
                  {topRevenueRoom
                    ? `${formatMoney(topRevenueRoom.amount)} registrados`
                    : "Aún no hay reservas suficientes."}
                </p>
              </article>

              <article className="bg-white border border-slate-200 rounded-3xl p-6">
                <p className="text-slate-500 font-bold">Mes con más actividad</p>

                <h2 className="text-2xl font-black text-brand-dark mt-3">
                  {bestMonthByBookings?.month || "Sin información"}
                </h2>

                <p className="text-slate-600 mt-2">
                  {bestMonthByBookings
                    ? `${bestMonthByBookings.bookings} reserva(s)`
                    : "Aún no hay movimiento mensual."}
                </p>
              </article>
            </div>

            {/* Gráficos principales */}
            <div className="grid xl:grid-cols-2 gap-6 mt-8">
              {/* Reservas por estado */}
              <article className="bg-white rounded-3xl border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark">
                      Reservas por estado
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Permite ver si hay muchas reservas pendientes,
                      confirmadas o canceladas.
                    </p>
                  </div>

                  <Link
                    to="/admin/reservas"
                    className="bg-brand-ocean text-white px-4 py-2 rounded-full font-black text-sm"
                  >
                    Ver reservas
                  </Link>
                </div>

                {bookingsByStatus.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-bold">
                    Aún no hay reservas para graficar.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {bookingsByStatus.map((item) => (
                      <div key={item.status}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-black text-brand-dark">
                            {item.label}
                          </span>

                          <span className="font-bold text-slate-500">
                            {item.count} reserva(s)
                          </span>
                        </div>

                        <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-ocean"
                            style={{
                              width: `${Math.max(item.percentage, 5)}%`,
                            }}
                          />
                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          {item.percentage}% del total
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {/* Movimiento mensual */}
              <article className="bg-white rounded-3xl border border-slate-200 p-6">
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">
                    Movimiento mensual
                  </h2>

                  <p className="text-slate-500 text-sm mt-1">
                    Muestra en qué meses hubo más actividad de reservas.
                  </p>
                </div>

                {monthlySummary.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-bold">
                    Aún no hay información mensual para mostrar.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {monthlySummary.map((item) => {
                      const percentage = getPercentage(
                        item.bookings,
                        maxMonthlyBookings
                      );

                      return (
                        <div key={item.month}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-black text-brand-dark">
                              {item.month}
                            </span>

                            <span className="font-bold text-slate-500">
                              {item.bookings} reserva(s) ·{" "}
                              {formatMoney(item.amount)}
                            </span>
                          </div>

                          <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-dark"
                              style={{
                                width: `${Math.max(percentage, 8)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>

            {/* Ranking habitaciones y clientes */}
            <div className="grid xl:grid-cols-2 gap-6 mt-8">
              {/* Habitaciones */}
              <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark">
                      Ranking de habitaciones
                    </h2>

                    <p className="text-slate-500 text-sm mt-1">
                      Compara qué habitaciones se reservan más y cuáles generan
                      mayor monto.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportRoomRanking}
                    className="bg-white border border-slate-200 text-brand-dark px-4 py-2 rounded-full font-black text-sm hover:bg-slate-100"
                  >
                    Exportar
                  </button>
                </div>

                {roomRanking.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-bold">
                    Aún no hay habitaciones reservadas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left px-5 py-4">#</th>
                          <th className="text-left px-5 py-4">Habitación</th>
                          <th className="text-left px-5 py-4">Reservas</th>
                          <th className="text-left px-5 py-4">Total</th>
                          <th className="text-left px-5 py-4">Confirmado</th>
                        </tr>
                      </thead>

                      <tbody>
                        {roomRanking.slice(0, 8).map((room, index) => (
                          <tr
                            key={room.roomName}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-black text-brand-dark">
                              #{index + 1}
                            </td>

                            <td className="px-5 py-4 font-black text-brand-dark">
                              {room.roomName}
                            </td>

                            <td className="px-5 py-4">
                              {room.bookings} reserva(s)
                            </td>

                            <td className="px-5 py-4 font-bold">
                              {formatMoney(room.amount)}
                            </td>

                            <td className="px-5 py-4 font-bold text-green-700">
                              {formatMoney(room.confirmedAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              {/* Clientes */}
              <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-2xl font-black text-brand-dark">
                    Clientes con más reservas
                  </h2>

                  <p className="text-slate-500 text-sm mt-1">
                    Ayuda a identificar huéspedes frecuentes o de mayor
                    movimiento.
                  </p>
                </div>

                {customerRanking.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-bold">
                    Aún no hay clientes con reservas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customerRanking.map((customer, index) => (
                      <div
                        key={`${customer.customerName}-${index}`}
                        className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="font-black text-brand-dark">
                            #{index + 1} {customer.customerName}
                          </p>

                          <p className="text-slate-500 text-sm mt-1">
                            📞 {customer.customerPhone || "-"} · Última reserva:{" "}
                            {formatDate(customer.lastBooking)}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="font-black text-brand-dark">
                            {customer.bookings} reserva(s)
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatMoney(customer.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            {/* Habitaciones sin movimiento */}
            <article className="bg-white rounded-3xl border border-slate-200 p-6 mt-8">
              <h2 className="text-2xl font-black text-brand-dark">
                Habitaciones sin movimiento
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Habitaciones que todavía no aparecen en reservas registradas.
                Puede servir para revisar precio, foto o descripción.
              </p>

              {roomsWithoutBookings.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 p-5 font-bold">
                  Todas las habitaciones tienen movimiento registrado o aún no
                  hay suficiente data para comparar.
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                  {roomsWithoutBookings.map((roomName) => (
                    <span
                      key={roomName}
                      className="bg-slate-50 border border-slate-200 text-slate-700 rounded-full px-4 py-2 font-bold"
                    >
                      {roomName}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </>
        )}
      </section>
    </main>
  );
}