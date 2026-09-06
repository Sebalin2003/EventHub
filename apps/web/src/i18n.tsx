import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Language = 'es' | 'en'

const messages = {
  es: {
    language: 'Idioma', spanish: 'Español', english: 'English', platform: 'plataforma',
    home: 'Inicio', explore: 'Explorar', favorites: 'Mis favoritos', tickets: 'Mis entradas', purchases: 'Mis compras',
    logout: 'Salir', login: 'Iniciar sesión', nav: 'Navegación principal', notifications: 'Notificaciones', closeNotification: 'Cerrar notificación', breadcrumbs: 'Migas de pan', backToTop: 'Volver arriba',
    resetDemo: 'Restablecer demo', exploreGuest: 'Explorar sin cuenta →', signInBody: 'Accedé con tu cuenta o probá un perfil de demostración.', demo: 'Demostración', credentials: 'Con credenciales', attendee: 'Asistente', attendeeDesc: 'Comprá entradas y gestioná tus tickets y favoritos', organizerRole: 'Organizador', organizerDesc: 'Creá eventos y gestioná ventas y estadísticas', staffDesc: 'Escaneá y validá entradas en el recinto', adminRole: 'Administrador', adminDesc: 'Supervisá usuarios, organizadores y sistema', selectDemo: 'Seleccioná un perfil de demostración', userNotFound: 'Usuario no encontrado', enterAs: 'Entrar como', email: 'Email', password: 'Contraseña',
    logoutTitle: '¿Cerrar sesión?', logoutMessage: 'Tendrás que volver a iniciar sesión para acceder a tus entradas y compras.', logoutConfirm: 'Sí, salir', cancel: 'Cancelar',
    saved: 'Evento guardado en favoritos.', removed: 'Evento quitado de favoritos.',
    heroLabel: 'La plataforma de eventos', heroTitle: 'Descubre eventos', heroEmphasis: 'que importan.', heroBody: 'Conferencias, talleres, recitales y más. Encontrá tu próxima experiencia.',
    searchEvents: 'Buscar eventos', searchPlaceholder: 'Buscá eventos, artistas o lugares...', search: 'Buscar', featured: 'Eventos destacados', viewAll: 'Ver todos →', byCategory: 'Por categoría', filterCategory: 'Filtrar por categoría',
    all: 'Todo', conferences: 'Conferencias', workshops: 'Talleres', networking: 'Networking', webinars: 'Webinars', concerts: 'Recitales', exhibitions: 'Exposiciones',
    exploreTitle: 'Explorar eventos', exploreBody: 'Buscá por nombre, ciudad u organizador.', category: 'Categoría', modality: 'Modalidad', sort: 'Ordenar', allF: 'Todas', conference: 'Conferencia', workshop: 'Taller', webinar: 'Webinar', concert: 'Recital', exhibition: 'Exposición', inPerson: 'Presencial', online: 'Online', hybrid: 'Híbrido', date: 'Fecha', popularity: 'Popularidad', price: 'Precio', event: 'evento', events: 'eventos', noEvents: 'No encontramos eventos', noEventsBody: 'Probá otra búsqueda o recuperá todos los resultados.', clearFilters: 'Limpiar filtros',
    favoritesBody: 'Eventos guardados para volver cuando quieras.', noFavorites: 'Todavía no guardaste eventos', noFavoritesBody: 'Abrí el detalle de un evento y usá el corazón para guardarlo.',
    free: 'Gratis', from: 'Desde', occupied: 'ocupado', nearlySoldOut: 'Casi agotado', viewEvent: 'Ver detalle de',
    eventInfo: 'Información del evento', dateTime: 'Fecha y hora', duration: 'Duración', until: 'Hasta', venue: 'Recinto', location: 'Ubicación', organizer: 'Organizador', capacity: 'Capacidad', people: 'personas', about: 'Sobre el evento', numberedSeats: 'Localidades numeradas', numberedSeatsBody: 'Podrás elegir sector, fila y asiento antes de reservar.', seatsOnMap: 'asientos en el mapa', cancellationPolicy: 'Política de cancelación', entryTickets: 'Entradas', finalPrices: 'Precios finales antes de pagar', removeFavorite: 'Quitar de favoritos', saveFavorite: 'Guardar en favoritos', activeHold: 'HOLD activo', heldOne: 'localidad reservada temporalmente', heldMany: 'localidades reservadas temporalmente', available: 'disponibles', soldOut: 'Agotado', maxTickets: 'Máximo {count} entradas por usuario.', chooseTickets: 'Elegir entradas', eventSoldOut: 'Evento agotado',
    checkout: 'Checkout', checkoutBody: 'Revisá la selección y confirmá el pago.', selectTickets: 'Seleccionar entradas', typeQuantitySeat: 'Tipo, cantidad y localidad', ticketType: 'Tipo de entrada', quantity: 'Cantidad', reserveContinue: 'Reservar y continuar', paymentMethod: 'Medio de pago', paymentData: 'Datos usados solo durante esta simulación', card: 'Tarjeta', paypal: 'PayPal', mercadoPago: 'Mercado Pago', cardNumber: 'Número de tarjeta', cardName: 'Nombre en la tarjeta', expiration: 'Vencimiento', demoResult: 'Resultado de demostración', approved: 'Pago aprobado', declined: 'Pago rechazado', demoHelp: 'Este control existe únicamente para verificar ambos estados del demo.', confirmPurchase: 'Confirmar compra', orderSummary: 'Resumen del pedido', seats: 'Localidades', serviceFee: 'Cargo de servicio (4%)', total: 'Total', cancelBack: 'Cancelar y volver', processing: 'Procesando pago', processingBody: 'Estamos validando la operación simulada. No cierres esta vista.',
  },
  en: {
    language: 'Language', spanish: 'Español', english: 'English', platform: 'platform',
    home: 'Home', explore: 'Explore', favorites: 'My favorites', tickets: 'My tickets', purchases: 'My purchases',
    logout: 'Log out', login: 'Sign in', nav: 'Main navigation', notifications: 'Notifications', closeNotification: 'Close notification', breadcrumbs: 'Breadcrumbs', backToTop: 'Back to top',
    resetDemo: 'Reset demo', exploreGuest: 'Explore as guest →', signInBody: 'Sign in with your account or try a demo profile.', demo: 'Demo', credentials: 'With credentials', attendee: 'Attendee', attendeeDesc: 'Buy tickets and manage your tickets and favorites', organizerRole: 'Organizer', organizerDesc: 'Create events and manage sales and analytics', staffDesc: 'Scan and validate tickets at the venue', adminRole: 'Administrator', adminDesc: 'Monitor users, organizers, and the system', selectDemo: 'Select a demo profile', userNotFound: 'User not found', enterAs: 'Sign in as', email: 'Email', password: 'Password',
    logoutTitle: 'Log out?', logoutMessage: 'You will need to sign in again to access your tickets and purchases.', logoutConfirm: 'Yes, log out', cancel: 'Cancel',
    saved: 'Event saved to favorites.', removed: 'Event removed from favorites.',
    heroLabel: 'The event platform', heroTitle: 'Discover events', heroEmphasis: 'that matter.', heroBody: 'Conferences, workshops, concerts, and more. Find your next experience.',
    searchEvents: 'Search events', searchPlaceholder: 'Search events, artists, or places...', search: 'Search', featured: 'Featured events', viewAll: 'View all →', byCategory: 'By category', filterCategory: 'Filter by category',
    all: 'All', conferences: 'Conferences', workshops: 'Workshops', networking: 'Networking', webinars: 'Webinars', concerts: 'Concerts', exhibitions: 'Exhibitions',
    exploreTitle: 'Explore events', exploreBody: 'Search by name, city, or organizer.', category: 'Category', modality: 'Format', sort: 'Sort', allF: 'All', conference: 'Conference', workshop: 'Workshop', webinar: 'Webinar', concert: 'Concert', exhibition: 'Exhibition', inPerson: 'In person', online: 'Online', hybrid: 'Hybrid', date: 'Date', popularity: 'Popularity', price: 'Price', event: 'event', events: 'events', noEvents: 'No events found', noEventsBody: 'Try another search or restore all results.', clearFilters: 'Clear filters',
    favoritesBody: 'Saved events you can revisit anytime.', noFavorites: 'You have not saved any events yet', noFavoritesBody: 'Open an event detail page and use the heart to save it.',
    free: 'Free', from: 'From', occupied: 'occupied', nearlySoldOut: 'Almost sold out', viewEvent: 'View details for',
    eventInfo: 'Event information', dateTime: 'Date and time', duration: 'Duration', until: 'Until', venue: 'Venue', location: 'Location', organizer: 'Organizer', capacity: 'Capacity', people: 'people', about: 'About this event', numberedSeats: 'Reserved seating', numberedSeatsBody: 'Choose your section, row, and seat before reserving.', seatsOnMap: 'seats on the map', cancellationPolicy: 'Cancellation policy', entryTickets: 'Tickets', finalPrices: 'Final prices before payment', removeFavorite: 'Remove from favorites', saveFavorite: 'Save to favorites', activeHold: 'Active HOLD', heldOne: 'seat temporarily reserved', heldMany: 'seats temporarily reserved', available: 'available', soldOut: 'Sold out', maxTickets: 'Maximum {count} tickets per user.', chooseTickets: 'Choose tickets', eventSoldOut: 'Event sold out',
    checkout: 'Checkout', checkoutBody: 'Review your selection and confirm payment.', selectTickets: 'Select tickets', typeQuantitySeat: 'Type, quantity, and seat', ticketType: 'Ticket type', quantity: 'Quantity', reserveContinue: 'Reserve and continue', paymentMethod: 'Payment method', paymentData: 'Data used only for this simulation', card: 'Card', paypal: 'PayPal', mercadoPago: 'Mercado Pago', cardNumber: 'Card number', cardName: 'Name on card', expiration: 'Expiration', demoResult: 'Demo result', approved: 'Payment approved', declined: 'Payment declined', demoHelp: 'This control is only available to verify both demo states.', confirmPurchase: 'Confirm purchase', orderSummary: 'Order summary', seats: 'Seats', serviceFee: 'Service fee (4%)', total: 'Total', cancelBack: 'Cancel and go back', processing: 'Processing payment', processingBody: 'We are validating the simulated transaction. Do not close this view.',
  },
} as const

type MessageKey = keyof typeof messages.es
type I18nValue = { language: Language; locale: string; setLanguage: (language: Language) => void; t: (key: MessageKey, values?: Record<string, string | number>) => string }
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('eventhub-language') === 'en' ? 'en' : 'es')
  useEffect(() => { localStorage.setItem('eventhub-language', language); document.documentElement.lang = language }, [language])
  const value = useMemo<I18nValue>(() => ({
    language,
    locale: language === 'es' ? 'es-AR' : 'en-US',
    setLanguage,
    t: (key, values) => Object.entries(values ?? {}).reduce((text, [name, replacement]) => text.replace(`{${name}}`, String(replacement)), messages[language][key] as string),
  }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n()
  return <label className={compact ? 'language-select language-select--compact' : 'language-select'}><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="es">ES</option><option value="en">EN</option></select></label>
}
