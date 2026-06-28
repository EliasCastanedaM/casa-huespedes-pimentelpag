import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@casahuespedespimentel.com",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const result = await loginAdmin(form);

      localStorage.setItem("adminToken", result.token);
      localStorage.setItem("adminUser", JSON.stringify(result.user));

      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
  <main
    className="fixed inset-0 z-50 flex items-center justify-center px-5 py-8 overflow-hidden"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800&auto=format&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
    <div className="absolute inset-0 bg-brand-dark/65" />

    <section className="relative z-10 w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-brand-dark text-brand-gold mx-auto flex items-center justify-center font-black text-xl">
          CH
        </div>

        <h1 className="text-3xl font-black text-brand-dark mt-5">
          Panel administrativo
        </h1>

        <p className="text-slate-500 mt-2">Casa Huéspedes Pimentel</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
            CORREO
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full bg-brand-sand border border-brand-border rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-black tracking-widest text-brand-navy mb-2">
            CONTRASEÑA
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            className="w-full bg-brand-sand border border-brand-border rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-gold text-brand-navy rounded-full py-4 font-black hover:bg-brand-goldDark transition disabled:opacity-60"
        >
          {isLoading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/"
          className="text-sm font-bold text-slate-500 hover:text-brand-ocean transition"
        >
          Volver a la web
        </Link>
      </div>
    </section>
  </main>
);
}