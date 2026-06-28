import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="w-full sticky top-0 z-50 bg-[#fbf7ef]/95 backdrop-blur-md border-b border-[#eadfce]">
      <nav className="max-w-7xl mx-auto px-5 md:px-8 h-[76px] flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="/#inicio" className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-full border border-[#a87545] text-[#a87545] flex items-center justify-center font-black text-sm">
            CH
          </div>

          <div className="leading-tight">
            <p className="font-black text-[#2d261f] text-sm md:text-base">
              Casa Huéspedes
            </p>
            <p className="text-xs text-[#8b7b6d] tracking-wide">Pimentel</p>
          </div>
        </a>

        {/* Links desktop */}
        
        <div className="hidden lg:flex items-center justify-center gap-7 flex-1">
           <Link
            to="/turismo#inicio-turismo"
            className="text-xs font-black uppercase tracking-wide text-[#5f5147] hover:text-[#a87545] transition pb-2"
          >
            Conoce Pimentel
          </Link>

          <a
            href="/#inicio"
            className="text-xs font-black uppercase tracking-wide text-[#a87545] border-b-2 border-[#a87545] pb-2"
          >
            Inicio
          </a>

          <a
            href="/#habitaciones"
            className="text-xs font-black uppercase tracking-wide text-[#5f5147] hover:text-[#a87545] transition pb-2"
          >
            Habitaciones
          </a>

          <a
            href="/#servicios-extras"
            className="text-xs font-black uppercase tracking-wide text-[#5f5147] hover:text-[#a87545] transition pb-2"
          >
            Servicios
          </a>

          <a
            href="/#galeria"
            className="text-xs font-black uppercase tracking-wide text-[#5f5147] hover:text-[#a87545] transition pb-2"
          >
            Galería
          </a>

         
          <a
            href="/#disponibilidad"
            className="text-xs font-black uppercase tracking-wide text-[#5f5147] hover:text-[#a87545] transition pb-2"
          >
            Reservas
          </a>
        </div>

        {/* Redes + botón */}
        <div className="hidden xl:flex items-center gap-3">
          <a
            href="https://www.facebook.com/casadehuespedespimentel/?locale=es_LA"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="w-9 h-9 rounded-full border border-[#eadfce] text-[#a87545] flex items-center justify-center font-black hover:bg-[#a87545] hover:text-white transition"
          >
            f
          </a>

          <a
            href="https://www.tiktok.com/@casahuespedespimentel"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="w-9 h-9 rounded-full border border-[#eadfce] text-[#a87545] flex items-center justify-center font-black hover:bg-[#a87545] hover:text-white transition"
          >
            ♪
          </a>

          <a
            href="https://www.instagram.com/casahuespedes.pimentel/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="w-9 h-9 rounded-full border border-[#eadfce] text-[#a87545] flex items-center justify-center font-black hover:bg-[#a87545] hover:text-white transition"
          >
            ◎
          </a>

          <a
            href="/#disponibilidad"
            className="ml-2 bg-[#a87545] text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wide hover:bg-[#8f623a] transition whitespace-nowrap shadow-sm"
          >
            Reservar ahora
          </a>
        </div>

        {/* Botones tablet / móvil */}
        <div className="flex xl:hidden items-center gap-2">
         

          <a
            href="/#disponibilidad"
            className="bg-[#a87545] text-white px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wide"
          >
            Reservar
          </a>
        </div>
      </nav>
    </header>
  );
}