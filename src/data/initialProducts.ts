import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Audífonos Inalámbricos Noise Cancelling Pro',
    description: 'Audífonos circumaurales de alta fidelidad con cancelación de ruido activa avanzada, batería de hasta 30 horas, estuche de carga rígido y micrófono HD para llamadas.',
    price: 120,
    category: 'Electrónica',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Botas de Montaña Impermeables Trekking',
    description: 'Botas ergonómicas reforzadas con membrana impermeable Breath-Tex, suela antideslizante Vibram y plantilla con amortiguación de impacto.',
    price: 95,
    category: 'Calzado',
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-12').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    name: 'Cafetera Espresso Premium Automática',
    description: 'Cafetera de acero inoxidable con espumador de leche a presión de 15 bares, molinillo integrado y programador de temperatura digital.',
    price: 210,
    category: 'Hogar',
    stock: 5,
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebd02f2a888?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    name: 'Chaqueta De Lino Elegante Casual',
    description: 'Chaqueta ligera de corte moderno confeccionada en 100% lino orgánico de alta frescura. Ideal para eventos formales y semi-formales.',
    price: 78,
    category: 'Ropa',
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-18').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    name: 'Gafas de Sol Estilo Aviador Titanio',
    description: 'Montura ultraligera de titanio con cristales polarizados con protección UV400 completa y tratamiento antirrayaduras.',
    price: 45,
    category: 'Accesorios',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-20').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000006',
    name: 'Lámpara de Escritorio LED Inteligente',
    description: 'Lámpara de diseño nórdico con brillo regulable, puerto de carga inalámbrica Qi rápido integrado y 4 modos de color táctiles.',
    price: 52,
    category: 'Hogar',
    stock: 10,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-22').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000007',
    name: 'Reloj Deportivo Inteligente GPS FitTrack',
    description: 'Reloj inteligente resistente al agua (5 ATM) con pulsómetro óptico continuo, GPS integrado, monitoreo del sueño y más de 30 modos deportivos.',
    price: 135,
    category: 'Electrónica',
    stock: 9,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-25').toISOString()
  },
  {
    id: 'a0000000-0000-4000-8000-000000000008',
    name: 'Zapatillas de Running Ultraligeras Aero',
    description: 'Tenis deportivos con tejido transpirable Fly-Knit, plantilla viscoelástica de retorno de energía y diseño aerodinámico.',
    price: 88,
    category: 'Calzado',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date('2026-01-28').toISOString()
  }
];
