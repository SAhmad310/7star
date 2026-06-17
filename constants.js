module.exports = {
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PRODUCTION: 'in_production',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  SERVICE_TYPES: {
    STICKER_CUTTING: 'sticker-cutting',
    LASER_CUTTING: 'laser-cutting',
    TSHIRT_PRINTING: 'tshirt-printing',
    ACRYLIC_NAMEPLATE: 'acrylic-nameplate'
  },
  
  FILE_TYPES: {
    ALLOWED: ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf', 'application/illustrator', 'application/postscript'],
    MAX_SIZE: 20 * 1024 * 1024 // 20MB
  },
  
  STATUS_CLASSES: {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    in_production: 'status-production',
    ready: 'status-ready',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  }
};