import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Star, Clock, RotateCw } from 'lucide-react';
// IMPORTAMOS EL PLUGIN DE NOTIFICACIONES DE CAPACITOR
import { LocalNotifications } from '@capacitor/local-notifications';

// -----------------------------------------------------------------------------
// 🎨 CONFIGURACIÓN DE FONDOS
// -----------------------------------------------------------------------------
const monthBackgrounds = [
  "/calendarimg/January.jpg",
  "/calendarimg/February.jpg",
  "/calendarimg/March.jpg", 
  "/calendarimg/April.jpeg", 
  "/calendarimg/May.jpeg", 
  "/calendarimg/June.jpeg", 
  "/calendarimg/July.jpeg", 
  "/calendarimg/August.jpeg", 
  "/calendarimg/September.jpeg", 
  "/calendarimg/October.jpg", 
  "/calendarimg/November.jpg", 
  "/calendarimg/December.jpg", 
];

const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const fixedHolidays = [
  { month: 0, day: 1, title: "Año Nuevo" },
  { month: 0, day: 6, title: "Día de Reyes" },
  { month: 1, day: 14, title: "San Valentín" },
  { month: 4, day: 1, title: "Día del Trabajador" },
  { month: 8, day: 16, title: "Independencia" },
  { month: 9, day: 31, title: "Halloween" },
  { month: 10, day: 1, title: "Todos los Santos" },
  { month: 11, day: 25, title: "Navidad" },
  { month: 11, day: 31, title: "Nochevieja" }
];

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : {};
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [newEventText, setNewEventText] = useState("");
  const [newEventTime, setNewEventTime] = useState(""); // Formato HH:MM
  const [isAnnual, setIsAnnual] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Solicitar permisos de notificación al cargar la app por primera vez
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.log("Notificaciones no soportadas en este entorno (web).");
      }
    };
    requestPermissions();
    
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsPanelOpen(true);
  };

  const formatDateKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const formatAnnualKey = (date) => `${date.getMonth()}-${date.getDate()}`;
  // FUNCIÓN ACTUALIZADA: Añade el evento y programa la notificación
  const addEvent = async (e) => {
    e.preventDefault();
    if (!newEventText.trim()) return;
    
    // Si es anual, la llave solo tiene mes y día. Si no, tiene año, mes y día.
    const key = isAnnual ? formatAnnualKey(selectedDate) : formatDateKey(selectedDate);
    const eventId = Math.floor(Date.now() / 1000); 
    
    const newEvent = { 
      id: eventId, 
      text: newEventText,
      time: newEventTime, // Guardamos la hora (puede estar vacía)
      isAnnual: isAnnual  // Guardamos si se repite cada año
    };
    
    setEvents({ ...events, [key]: [...(events[key] || []), newEvent] });
    
    // Limpiamos el formulario
    setNewEventText("");
    setNewEventTime("");
    setIsAnnual(false);
    setShowTimePicker(false);

    // --- LÓGICA DE NOTIFICACIONES ---
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      
      if (permStatus.display === 'granted') {
        const notifDate = new Date(selectedDate);
        
        // Si el usuario eligió una hora, configuramos esa hora
        if (newEvent.time) {
          const [hours, minutes] = newEvent.time.split(':');
          notifDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        } else {
          // Si no eligió hora, por defecto a las 9:00 AM
          notifDate.setHours(9, 0, 0, 0);
        }

        if (notifDate > new Date() || newEvent.isAnnual) {
          // Si el evento es en el pasado pero es anual, programamos para el próximo año
          if (notifDate <= new Date() && newEvent.isAnnual) {
             notifDate.setFullYear(new Date().getFullYear() + 1);
          }
          
          let scheduleOptions = { at: notifDate };
          
          // Si es anual, le decimos a Capacitor que lo repita cada año
          if (newEvent.isAnnual) {
            scheduleOptions = {
               on: {
                  month: notifDate.getMonth() + 1, // Capacitor usa meses 1-12
                  day: notifDate.getDate(),
                  hour: notifDate.getHours(),
                  minute: notifDate.getMinutes()
               }
            }
          }

          await LocalNotifications.schedule({
            notifications: [
              {
                title: newEvent.isAnnual ? '🎉 Celebración Hoy' : '🗓️ Evento Hoy',
                body: newEvent.text,
                id: eventId,
                schedule: scheduleOptions,
                smallIcon: 'ic_stat_icon_config_sample'
              }
            ]
          });
        }
      }
    } catch (error) {
      console.log("No se pudo programar la notificación.");
    }
  };

  // FUNCIÓN ACTUALIZADA: Borra el evento y cancela la notificación
  const deleteEvent = async (dateKey, eventId, isEventAnnual) => {
    // Determinamos qué llave usar para borrar basándonos en si el evento es anual
    const keyToDelete = isEventAnnual ? dateKey.split('-').slice(1).join('-') : dateKey;
    const actualKey = isEventAnnual ? keyToDelete : dateKey;

    const updatedEvents = events[actualKey].filter(ev => ev.id !== eventId);
    
    if (updatedEvents.length === 0) {
      const newEvents = { ...events };
      delete newEvents[actualKey];
      setEvents(newEvents);
    } else {
      setEvents({ ...events, [actualKey]: updatedEvents });
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: eventId }] });
    } catch (error) {
      console.log("No se pudo cancelar la notificación.");
    }
  };

  // FUNCIÓN NUEVA: Obtiene todos los eventos de un día (normales + anuales)
  const getEventsForDay = (date) => {
    const normalKey = formatDateKey(date);
    const annualKey = formatAnnualKey(date);
    
    const normalEvents = events[normalKey] || [];
    const annualEvents = events[annualKey] || [];
    
    return [...normalEvents, ...annualEvents];
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10 mx-auto"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === dateToCheck.toDateString();
      const isSelected = selectedDate.toDateString() === dateToCheck.toDateString();
      const holiday = fixedHolidays.find(h => h.month === currentDate.getMonth() && h.day === day);
      
      // NUEVO: Usamos la nueva función para obtener todos los eventos del día
      const dayEvents = getEventsForDay(dateToCheck);
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div key={day} className="flex flex-col items-center justify-start h-14">
          <button 
            onClick={() => handleDateClick(day)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium relative transition-all
              ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'text-white'}
              ${isSelected && !isToday ? 'bg-white/30 text-white ring-2 ring-white' : ''}
              ${!isToday && !isSelected ? 'hover:bg-white/20' : ''}
            `}
          >
            {day}
          </button>
          
          <div className="flex gap-1 mt-1">
            {holiday && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>}
            {hasEvents && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-black min-h-screen w-full flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md h-[100dvh] relative flex flex-col shadow-2xl overflow-hidden bg-slate-900">
        
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${monthBackgrounds[currentDate.getMonth()]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col pt-12 pb-6 px-4">
          
          <div className="flex justify-between items-center mb-8 px-2">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
                {monthNames[currentDate.getMonth()]}
              </h1>
              <p className="text-blue-300 font-medium text-lg drop-shadow-md">
                {currentDate.getFullYear()}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all">
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="self-start ml-2 mb-6 px-4 py-1.5 rounded-full bg-blue-600/80 text-white text-sm font-semibold backdrop-blur-md border border-blue-400/30 active:scale-95 transition-transform"
          >
            Ir a Hoy
          </button>

          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="text-center text-white/60 font-medium text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Panel inferior */}
        <div 
          className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsPanelOpen(false)}
        ></div>

        <div className={`
          absolute bottom-0 left-0 w-full bg-white rounded-t-[2rem] z-50 flex flex-col
          transition-transform duration-300 ease-out transform shadow-[0_-10px_40px_rgba(0,0,0,0.3)]
          ${isPanelOpen ? 'translate-y-0' : 'translate-y-full'}
        `} style={{ height: '70dvh' }}> {/* Aumenté un poco la altura para el nuevo formulario */}
          
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2"></div>

          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()]}
              </p>
              <h2 className="text-2xl font-black text-slate-800">
                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </h2>
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50/50">
            {/* Festivos */}
            {fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate()) && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-800">{fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate()).title}</h4>
                  <p className="text-xs text-yellow-600 font-medium">Día Festivo</p>
                </div>
              </div>
            )}
            
            {/* Eventos de Usuario Actualizados con Hora y Repetición */}
            {getEventsForDay(selectedDate).map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                  <span className="text-slate-700 font-medium">{event.text}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {event.time && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <Clock size={10} /> {event.time}
                      </span>
                    )}
                    {event.isAnnual && (
                      <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <RotateCw size={10} /> Cada año
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => deleteEvent(formatDateKey(selectedDate), event.id, event.isAnnual)} 
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {(!getEventsForDay(selectedDate).length && !fixedHolidays.find(h => h.month === selectedDate.getMonth() && h.day === selectedDate.getDate())) && (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No hay eventos para hoy</p>
                <p className="text-sm text-gray-400">Añade una celebración abajo</p>
              </div>
            )}
          </div>

          {/* Formulario para añadir evento MEJORADO */}
          <form onSubmit={addEvent} className="p-4 bg-white border-t border-gray-100 safe-area-bottom flex flex-col gap-3">
            
            <div className="flex gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
              <input 
                type="text" 
                value={newEventText} 
                onChange={(e) => setNewEventText(e.target.value)} 
                placeholder="Ej. Cumpleaños de..." 
                className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700 placeholder-gray-400"
              />
              <button 
                type="submit" 
                disabled={!newEventText.trim()} 
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 disabled:opacity-50 disabled:bg-gray-400"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Opciones Adicionales (Hora y Anual) */}
            <div className="flex justify-between items-center px-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${showTimePicker || newEventTime ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  <Clock size={14} />
                  {newEventTime || 'Hora'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnnual(!isAnnual)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${isAnnual ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  <RotateCw size={14} />
                  Anual
                </button>
              </div>
              
              {/* Selector de hora nativo (aparece si se activa el botón) */}
              {showTimePicker && (
                <input 
                  type="time" 
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 outline-none focus:border-blue-400"
                />
              )}
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}