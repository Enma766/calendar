import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2, X, Star } from 'lucide-react';

// -----------------------------------------------------------------------------
// 🎨 CONFIGURACIÓN DE FONDOS (BACKGROUNDS)
// -----------------------------------------------------------------------------
// Instrucción: Reemplaza las URLs de abajo con las imágenes que desees para cada mes.
// Los meses van del 0 (Enero) al 11 (Diciembre).
const monthBackgrounds = [
  "https://images.unsplash.com/photo-1483366774974-98c92a95c93c?q=80&w=1920&auto=format&fit=crop", // Enero (Invierno/Nieve)
  "https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=1920&auto=format&fit=crop", // Febrero (San Valentín/Amor)
  "https://images.unsplash.com/photo-1490750967868-58cb75069ed6?q=80&w=1920&auto=format&fit=crop", // Marzo (Primavera/Flores)
  "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=1920&auto=format&fit=crop", // Abril (Lluvia/Verde)
  "https://images.unsplash.com/photo-1461301214746-1e790926d323?q=80&w=1920&auto=format&fit=crop", // Mayo (Flores/Campo)
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop", // Junio (Playa/Inicio Verano)
  "https://images.unsplash.com/photo-1504198266287-1659872e6584?q=80&w=1920&auto=format&fit=crop", // Julio (Sol/Vacaciones)
  "https://images.unsplash.com/photo-1505852903341-fc8d3db10436?q=80&w=1920&auto=format&fit=crop", // Agosto (Atardecer/Calor)
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=1920&auto=format&fit=crop", // Septiembre (Otoño/Hojas)
  "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=1920&auto=format&fit=crop", // Octubre (Halloween/Calabazas)
  "https://images.unsplash.com/photo-1463130456064-07a829871796?q=80&w=1920&auto=format&fit=crop", // Noviembre (Café/Lluvia)
  "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=1920&auto=format&fit=crop", // Diciembre (Navidad/Luces)
];

// -----------------------------------------------------------------------------
// 📅 CONFIGURACIÓN DE DATOS
// -----------------------------------------------------------------------------

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Festivos fijos (Mes - 1 porque los meses en JS empiezan en 0)
const fixedHolidays = [
  { month: 0, day: 1, title: "Año Nuevo" },
  { month: 0, day: 6, title: "Día de Reyes" },
  { month: 1, day: 14, title: "San Valentín" },
  { month: 4, day: 1, title: "Día del Trabajador" },
  { month: 8, day: 16, title: "Independencia (Ejemplo)" }, // Puedes editar esto
  { month: 9, day: 31, title: "Halloween" },
  { month: 10, day: 1, title: "Todos los Santos" },
  { month: 11, day: 25, title: "Navidad" },
  { month: 11, day: 31, title: "Nochevieja" }
];

export default function App() {
  // Estado para la fecha actual que se muestra en el calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado para la fecha seleccionada por el usuario
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Estado para los eventos personalizados (se guardan en localStorage)
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : {};
  });

  // Estado para el modal de añadir evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventText, setNewEventText] = useState("");

  // Guardar eventos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  // --- Lógica del Calendario ---

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    setIsModalOpen(true);
  };

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  // --- Lógica de Eventos ---

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEventText.trim()) return;

    const key = formatDateKey(selectedDate);
    const currentEvents = events[key] || [];
    
    const newEvent = {
      id: Date.now(),
      text: newEventText,
      type: 'personal'
    };

    setEvents({
      ...events,
      [key]: [...currentEvents, newEvent]
    });

    setNewEventText("");
  };

  const deleteEvent = (dateKey, eventId) => {
    const currentEvents = events[dateKey];
    const updatedEvents = currentEvents.filter(ev => ev.id !== eventId);
    
    if (updatedEvents.length === 0) {
      const newEvents = { ...events };
      delete newEvents[dateKey];
      setEvents(newEvents);
    } else {
      setEvents({
        ...events,
        [dateKey]: updatedEvents
      });
    }
  };

  // --- Renderizado de Celdas ---

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const days = [];

    // Relleno días vacíos del mes anterior
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-white/10 border border-white/10 rounded-lg backdrop-blur-sm opacity-50"></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(dateToCheck);
      
      const isToday = new Date().toDateString() === dateToCheck.toDateString();
      const isSelected = selectedDate.toDateString() === dateToCheck.toDateString();
      
      // Buscar festivos fijos
      const holiday = fixedHolidays.find(h => h.month === currentDate.getMonth() && h.day === day);
      
      // Buscar eventos personales
      const dayEvents = events[dateKey] || [];

      days.push(
        <div 
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-24 p-2 border border-white/20 rounded-lg cursor-pointer transition-all duration-200
            hover:bg-white/30 hover:scale-[1.02] hover:shadow-lg overflow-hidden flex flex-col relative
            ${isToday ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-400' : 'bg-white/20 backdrop-blur-md'}
            ${isSelected ? 'ring-2 ring-white' : ''}
          `}
        >
          {/* Número del día */}
          <div className="flex justify-between items-start">
            <span className={`text-lg font-bold ${isToday ? 'text-blue-100' : 'text-white'} drop-shadow-md`}>
              {day}
            </span>
            {holiday && (
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 drop-shadow-sm" />
            )}
          </div>

          {/* Indicadores de eventos (puntos) */}
          <div className="flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
            {holiday && (
              <div className="text-[10px] leading-tight text-yellow-100 font-medium truncate bg-yellow-500/40 px-1 rounded">
                {holiday.title}
              </div>
            )}
            {dayEvents.map((ev) => (
              <div key={ev.id} className="text-[10px] leading-tight text-white font-medium truncate bg-purple-500/40 px-1 rounded">
                {ev.text}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 transition-all duration-700 ease-in-out bg-cover bg-center bg-no-repeat bg-fixed text-slate-800"
      style={{ backgroundImage: `url(${monthBackgrounds[currentDate.getMonth()]})` }}
    >
      {/* Capa oscura para mejorar legibilidad general */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row gap-6">
        
        {/* --- COLUMNA IZQUIERDA: Calendario Principal --- */}
        <div className="flex-1 bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          {/* Header del Calendario */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg capitalize flex items-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              {monthNames[currentDate.getMonth()]} <span className="text-white/70">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-2 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
              >
                Hoy
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Grid de Días de la Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {daysOfWeek.map(day => (
              <div key={day} className="text-white/80 font-semibold uppercase text-sm tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de Días del Mes */}
          <div className="grid grid-cols-7 gap-2 lg:gap-3">
            {renderCalendarDays()}
          </div>
        </div>

        {/* --- COLUMNA DERECHA / MODAL MÓVIL: Panel de Eventos --- */}
        {isModalOpen && (
          <div className="lg:w-96 w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 lg:static fixed bottom-0 left-0 lg:h-auto h-[70vh] z-50 rounded-b-none lg:rounded-b-3xl">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {daysOfWeek[selectedDate.getDay()]}
                </span>
                <h3 className="text-3xl font-bold text-slate-800">
                  {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="lg:hidden p-2 bg-slate-200 rounded-full hover:bg-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Eventos del Día */}
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
              {/* Festivos en este día */}
              {fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate()) && (
                <div className="bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="font-bold text-yellow-800">
                      {fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate()).title}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">Día festivo</p>
                </div>
              )}

              {/* Eventos personales */}
              {(!events[formatDateKey(selectedDate)] || events[formatDateKey(selectedDate)].length === 0) && 
               !fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate()) ? (
                <div className="text-center text-slate-400 py-10">
                  <p>No hay eventos para este día.</p>
                  <p className="text-sm">¡Añade uno abajo!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events[formatDateKey(selectedDate)]?.map((event) => (
                    <div key={event.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group">
                      <span className="text-slate-700 font-medium">{event.text}</span>
                      <button 
                        onClick={() => deleteEvent(formatDateKey(selectedDate), event.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario para añadir evento */}
            <form onSubmit={addEvent} className="mt-auto pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-600 mb-2">Añadir celebración o nota</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEventText}
                  onChange={(e) => setNewEventText(e.target.value)}
                  placeholder="Ej: Cumpleaños de María"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!newEventText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                >
                  <Plus size={24} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}