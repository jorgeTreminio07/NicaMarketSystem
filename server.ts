import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { INITIAL_PRODUCTS } from './src/data/initialProducts.js';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercent?: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: string;
  isDeleted?: boolean;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  paymentType?: 'contado' | 'cuotas_2' | 'cuotas_4';
  installmentCount?: number;
  paymentSchedule?: any[];
  paymentsHistory?: any[];
  totalPaid?: number;
  creditStatus?: 'En Proceso' | 'Pagado' | 'En Mora';
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  whatsappNumber: string;
  updatedAt?: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

// Password Hashing Helper
function hashPassword(password: string): string {
  const salt = 'nuestra_tienda_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASS = '850012cf-2945-4293-a2d5-6b2956d15cfb';

// Initial Store Settings
let storeSettings: StoreSettings = {
  id: 'default',
  name: 'NicaMarket',
  description: 'Explora nuestra tienda en línea. Todos los productos están organizados alfabéticamente. Filtra por categoría, busca lo que deseas e ingresa tu pedido directo por WhatsApp.',
  logoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  whatsappNumber: '50589098184',
  updatedAt: new Date().toISOString()
};

// Initial Users
let users: UserRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: DEFAULT_ADMIN_EMAIL,
    password_hash: DEFAULT_ADMIN_PASS,
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

function verifyAdminCredentials(email?: string, password?: string): boolean {
  if (!email || !password) return false;
  const cleanedEmail = email.trim().toLowerCase();
  const inputHash = hashPassword(password.trim());

  const user = users.find(u => u.email.toLowerCase() === cleanedEmail);
  if (!user) return false;

  const isPasswordValid = user.password_hash === inputHash;
  const isAdminRole = user.role === 'admin' || user.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

  return isPasswordValid && isAdminRole;
}

// Helper for generating unique 10-digit Solicitud ID
function generate10DigitNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Supabase Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xjiwhdnrxpsbbegqjicp.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaXdoZG5yeHBzYmJlZ3FqaWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNzkyMTgsImV4cCI6MjEwMDk1NTIxOH0.8y6PT2Uyn2ytdc4LfhyzSY_EWNPRmieoYYIaDyPEy3E';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, supabaseKey);

// Helper for logging Requests and Responses to Supabase 'api_logs' table
async function logApiCall(
  action: string,
  endpoint: string,
  method: string,
  requestPayload: any,
  responsePayload: any,
  statusCode = 200
) {
  try {
    await supabase.from('api_logs').insert([{
      action,
      endpoint,
      method,
      request_payload: requestPayload,
      response_payload: responsePayload,
      status_code: statusCode,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.log('Aviso al guardar log de API en Supabase:', err);
  }
}

// Helper Mappers for Supabase (Handling snake_case SQL columns)
function mapProductFromRow(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: String(row.description || ''),
    price: Number(row.price) || 0,
    discountPercent: Number(row.discount_percent || row.discountPercent) || 0,
    category: String(row.category || 'General'),
    stock: Number(row.stock) || 0,
    images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    isDeleted: row.is_deleted === true || row.isDeleted === true || false
  };
}

function mapProductToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    discount_percent: p.discountPercent || 0,
    category: p.category,
    stock: p.stock,
    images: p.images,
    created_at: p.createdAt,
    is_deleted: p.isDeleted || false
  };
}

import { generatePaymentSchedule, recalculateCreditState, getInstallmentCount } from './src/utils/paymentUtils';

function mapOrderFromRow(row: any): Order {
  const pType = row.payment_type || row.paymentType || 'contado';
  const history = Array.isArray(row.payments_history) ? row.payments_history : Array.isArray(row.paymentsHistory) ? row.paymentsHistory : [];
  let schedule = Array.isArray(row.payment_schedule) ? row.payment_schedule : Array.isArray(row.paymentSchedule) ? row.paymentSchedule : [];
  const total = Number(row.total) || 0;

  if (row.status === 'Aprobado' && schedule.length === 0) {
    schedule = generatePaymentSchedule(total, pType, row.created_at || row.createdAt);
  }

  const creditInfo = recalculateCreditState(total, schedule, history);

  return {
    id: String(row.id),
    orderNumber: String(row.order_number || row.orderNumber || generate10DigitNumber()),
    customerName: row.customer_name || row.customerName || '',
    customerPhone: row.customer_phone || row.customerPhone || '',
    items: Array.isArray(row.items) ? row.items : [],
    total,
    status: row.status || 'Pendiente',
    paymentType: pType,
    installmentCount: Number(row.installment_count) || getInstallmentCount(pType),
    paymentSchedule: creditInfo.updatedSchedule,
    paymentsHistory: history,
    totalPaid: creditInfo.totalPaid,
    creditStatus: row.status === 'Aprobado' ? (row.credit_status || creditInfo.creditStatus) : undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt,
    isDeleted: row.is_deleted === true || row.isDeleted === true || false
  };
}

function mapOrderToRow(o: Order) {
  const pType = o.paymentType || 'contado';
  return {
    id: o.id,
    order_number: o.orderNumber || generate10DigitNumber(),
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    items: o.items,
    total: o.total,
    status: o.status,
    payment_type: pType,
    installment_count: o.installmentCount || getInstallmentCount(pType),
    payment_schedule: o.paymentSchedule || [],
    payments_history: o.paymentsHistory || [],
    total_paid: o.totalPaid || 0,
    credit_status: o.creditStatus || 'En Proceso',
    created_at: o.createdAt,
    updated_at: o.updatedAt || new Date().toISOString(),
    is_deleted: o.isDeleted || false
  };
}

// In-memory initial data store as cache/fallback
let products: Product[] = [...INITIAL_PRODUCTS];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    orderNumber: '8492019481',
    customerName: 'María Rodríguez',
    customerPhone: '+505 88997766',
    items: [
      {
        productId: 'a0000000-0000-4000-8000-000000000001',
        productName: 'Audífonos Inalámbricos Noise Cancelling Pro',
        price: 120,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    total: 120,
    status: 'Pendiente',
    paymentType: 'cuotas_2',
    installmentCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    orderNumber: '8492019482',
    customerName: 'Carlos Gómez',
    customerPhone: '+505 87654321',
    items: [
      {
        productId: 'a0000000-0000-4000-8000-000000000005',
        productName: 'Gafas de Sol Estilo Aviador Titanio',
        price: 45,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'
      }
    ],
    total: 90,
    status: 'Pendiente',
    paymentType: 'contado',
    installmentCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    orderNumber: '8492019483',
    customerName: 'Ana López',
    customerPhone: '+505 85559999',
    items: [
      {
        productId: 'a0000000-0000-4000-8000-000000000006',
        productName: 'Lámpara de Escritorio LED Inteligente',
        price: 52,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    total: 52,
    status: 'Aprobado',
    paymentType: 'cuotas_4',
    installmentCount: 4,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1 + 1800000).toISOString()
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    orderNumber: '8492019484',
    customerName: 'Roberto Silva',
    customerPhone: '+505 84443322',
    items: [
      {
        productId: 'a0000000-0000-4000-8000-000000000003',
        productName: 'Cafetera Espresso Premium Automática',
        price: 210,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebd02f2a888?auto=format&fit=crop&w=800&q=80'
      }
    ],
    total: 210,
    status: 'Rechazado',
    paymentType: 'contado',
    installmentCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString()
  }
];

let orders: Order[] = [...INITIAL_ORDERS];

async function seedSupabase() {
  console.log('Reiniciando y poblando tablas en Supabase con datos iniciales...');
  
  // 1. Clean existing tables in Supabase
  try {
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.log('Aviso al limpiar órdenes:', e);
  }

  try {
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.log('Aviso al limpiar productos:', e);
  }

  // 2. Insert new products
  const productRows = INITIAL_PRODUCTS.map(mapProductToRow);
  const { error: prodErr } = await supabase.from('products').insert(productRows);
  if (prodErr) {
    console.error('Error insertando productos iniciales en Supabase:', prodErr.message);
  } else {
    console.log('[OK] Productos iniciales creados en Supabase.');
  }

  // 3. Insert new orders
  const orderRows = INITIAL_ORDERS.map(mapOrderToRow);
  const { error: ordErr } = await supabase.from('orders').insert(orderRows);
  if (ordErr) {
    console.error('Error insertando órdenes iniciales en Supabase:', ordErr.message);
  } else {
    console.log('[OK] Solicitudes/órdenes iniciales creadas en Supabase.');
  }

  products = [...INITIAL_PRODUCTS];
  orders = [...INITIAL_ORDERS];
}

async function clearSupabase() {
  console.log('Eliminando toda la información de la base de datos...');
  try {
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.log('Aviso al vaciar órdenes:', e);
  }
  try {
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.log('Aviso al vaciar productos:', e);
  }
  try {
    // Delete non-admin users from database
    await supabase.from('users').delete().neq('email', DEFAULT_ADMIN_EMAIL.toLowerCase()).neq('email', 'admin');
  } catch (e) {
    console.log('Aviso al vaciar usuarios:', e);
  }

  products = [];
  orders = [];

  // Keep admin user in memory
  users = users.filter(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || u.email.toLowerCase() === 'admin' || u.id === '00000000-0000-4000-8000-000000000001');
  if (users.length === 0) {
    users = [{
      id: '00000000-0000-4000-8000-000000000001',
      email: DEFAULT_ADMIN_EMAIL,
      password_hash: DEFAULT_ADMIN_PASS,
      role: 'admin',
      created_at: new Date().toISOString()
    }];
  }
}

async function loadDataFromSupabase() {
  console.log('Cargando datos persistentes guardados en Supabase...');
  try {
    const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
    if (!prodErr && prodData) {
      products = prodData.map(mapProductFromRow);
    } else {
      products = [];
    }

    const { data: ordData, error: ordErr } = await supabase.from('orders').select('*');
    if (!ordErr && ordData) {
      orders = ordData.map(mapOrderFromRow);
    } else {
      orders = [];
    }

    // Load Store Settings
    const { data: setArr, error: setErr } = await supabase.from('store_settings').select('*').limit(1);
    if (!setErr && setArr && setArr.length > 0) {
      const row = setArr[0];
      storeSettings = {
        id: row.id || 'default',
        name: row.name || 'NicaMarket',
        description: row.description || '',
        logoUrl: row.logo_url || row.logoUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        whatsappNumber: row.whatsapp_number || row.whatsappNumber || '50589098184',
        updatedAt: row.updated_at || new Date().toISOString()
      };
    } else {
      // Upsert default settings to Supabase
      try {
        await supabase.from('store_settings').upsert([{
          id: 'default',
          name: storeSettings.name,
          description: storeSettings.description,
          logo_url: storeSettings.logoUrl,
          whatsapp_number: storeSettings.whatsappNumber,
          updated_at: storeSettings.updatedAt
        }]);
      } catch (e) {
        console.log('Aviso al guardar configuración inicial en Supabase:', e);
      }
    }

    // Load Users
    const { data: usrArr, error: usrErr } = await supabase.from('users').select('*');
    if (!usrErr && usrArr && usrArr.length > 0) {
      users = usrArr.map((u: any) => ({
        id: String(u.id),
        email: String(u.email),
        password_hash: String(u.password_hash || u.passwordHash || ''),
        role: String(u.role || 'staff'),
        created_at: String(u.created_at || u.createdAt || new Date().toISOString())
      }));
    }

    // Always ensure default admin user exists
    const adminIdx = users.findIndex(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || u.email.toLowerCase() === 'admin');

    if (adminIdx >= 0) {
      users[adminIdx].role = 'admin';
    } else {
      users.unshift({
        id: '00000000-0000-4000-8000-000000000001',
        email: DEFAULT_ADMIN_EMAIL,
        password_hash: DEFAULT_ADMIN_PASS,
        role: 'admin',
        created_at: new Date().toISOString()
      });
    }

    const mainAdmin = users.find(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || u.email.toLowerCase() === 'admin')!;
    await supabase.from('users').upsert([{
      id: mainAdmin.id,
      email: mainAdmin.email,
      password_hash: DEFAULT_ADMIN_PASS,
      role: mainAdmin.role,
      created_at: mainAdmin.created_at
    }]);

    console.log(`Carga inicial desde Supabase completada: ${products.length} productos, ${orders.length} órdenes, ${users.length} usuarios.`);
  } catch (err) {
    console.log('Aviso al cargar datos desde Supabase:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===

  // Supabase connection check endpoint
  app.get('/api/supabase-status', async (req, res) => {
    try {
      // Test connectivity to Supabase
      const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet or permissions issue, but API connection reached Supabase host
        return res.json({
          configured: true,
          connected: true,
          url: SUPABASE_URL,
          status: 'conectado',
          message: 'Conexión con la API de Supabase exitosa.',
          details: error.message
        });
      }
      return res.json({
        configured: true,
        connected: true,
        url: SUPABASE_URL,
        status: 'conectado',
        message: 'Conexión activa y funcionando con Supabase.',
        recordCount: data
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al conectar con Supabase';
      return res.status(500).json({
        configured: true,
        connected: false,
        url: SUPABASE_URL,
        status: 'error',
        message
      });
    }
  });

  // Get products (Always sorted alphabetically by name as required, ignoring soft deleted)
  app.get('/api/products', async (req, res) => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        products = data.map(mapProductFromRow);
      }
    } catch (e) {
      console.log('Utilizando caché local para productos:', e);
    }
    const activeProducts = products.filter(p => !p.isDeleted);
    const sorted = [...activeProducts].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    res.json(sorted);
  });

  // Create new product
  app.post('/api/products', async (req, res) => {
    const { name, description, price, discountPercent, category, stock, images } = req.body;
    
    if (!name || !price) {
      const errRes = { error: 'Nombre y precio son obligatorios.' };
      logApiCall('CREATE_PRODUCT', '/api/products', 'POST', req.body, errRes, 400);
      return res.status(400).json(errRes);
    }

    const newProduct: Product = {
      id: randomUUID(),
      name: String(name).trim(),
      description: String(description || '').trim(),
      price: Number(price) || 0,
      discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
      category: String(category || 'General').trim(),
      stock: Math.max(0, Number(stock) || 0),
      images: Array.isArray(images) && images.length > 0 
        ? images.filter(img => typeof img === 'string' && img.trim().length > 0)
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);

    // Sync to Supabase in background
    try {
      await supabase.from('products').insert([mapProductToRow(newProduct)]);
    } catch (err) {
      console.log('Error guardando en Supabase, conservado en memoria local:', err);
    }

    logApiCall('CREATE_PRODUCT', '/api/products', 'POST', req.body, newProduct, 201);
    res.status(201).json(newProduct);
  });

  // Update existing product
  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      const errRes = { error: 'Producto no encontrado.' };
      logApiCall('UPDATE_PRODUCT', `/api/products/${id}`, 'PUT', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    const { name, description, price, discountPercent, category, stock, images } = req.body;

    products[index] = {
      ...products[index],
      name: name !== undefined ? String(name).trim() : products[index].name,
      description: description !== undefined ? String(description).trim() : products[index].description,
      price: price !== undefined ? Number(price) : products[index].price,
      discountPercent: discountPercent !== undefined ? Math.min(100, Math.max(0, Number(discountPercent) || 0)) : products[index].discountPercent,
      category: category !== undefined ? String(category).trim() : products[index].category,
      stock: stock !== undefined ? Math.max(0, Number(stock)) : products[index].stock,
      images: Array.isArray(images) && images.length > 0 ? images : products[index].images,
    };

    try {
      await supabase.from('products').upsert(mapProductToRow(products[index]));
    } catch (err) {
      console.log('Error actualizando Supabase:', err);
    }

    logApiCall('UPDATE_PRODUCT', `/api/products/${id}`, 'PUT', req.body, products[index], 200);
    res.json(products[index]);
  });

  // Quick stock patch
  app.patch('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    const product = products.find(p => p.id === id);

    if (!product) {
      const errRes = { error: 'Producto no encontrado.' };
      logApiCall('UPDATE_STOCK', `/api/products/${id}/stock`, 'PATCH', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    product.stock = Math.max(0, Number(stock) || 0);

    try {
      await supabase.from('products').update({ stock: product.stock }).eq('id', id);
    } catch (err) {
      console.log('Error actualizando stock en Supabase:', err);
    }

    logApiCall('UPDATE_STOCK', `/api/products/${id}/stock`, 'PATCH', req.body, product, 200);
    res.json(product);
  });

  // Soft Delete product
  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product || product.isDeleted) {
      const errRes = { error: 'Producto no encontrado.' };
      logApiCall('DELETE_PRODUCT', `/api/products/${id}`, 'DELETE', { id }, errRes, 404);
      return res.status(404).json(errRes);
    }

    product.isDeleted = true;
    products = products.filter(p => p.id !== id);

    try {
      await supabase.from('products').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.log('Error eliminando lógicamente en Supabase:', err);
    }

    const successRes = { success: true, message: 'Producto eliminado correctamente (borrado lógico).' };
    logApiCall('DELETE_PRODUCT', `/api/products/${id}`, 'DELETE', { id }, successRes, 200);
    res.json(successRes);
  });

  // Get orders (excluding soft deleted)
  app.get('/api/orders', async (req, res) => {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data && data.length > 0) {
        orders = data.map(mapOrderFromRow);
      }
    } catch (e) {
      console.log('Utilizando caché local para órdenes:', e);
    }
    const activeOrders = orders.filter(o => !o.isDeleted);
    const sorted = [...activeOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted);
  });

  // Create new order
  app.post('/api/orders', async (req, res) => {
    const { customerName, customerPhone, items, paymentType } = req.body;

    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      const errRes = { error: 'Faltan datos requeridos (nombre, teléfono o ítems).' };
      logApiCall('CREATE_ORDER', '/api/orders', 'POST', req.body, errRes, 400);
      return res.status(400).json(errRes);
    }

    const validPaymentType = (paymentType === 'cuotas_2' || paymentType === 'cuotas_4') ? paymentType : 'contado';

    let calculatedTotal = 0;
    const processedItems: OrderItem[] = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const itemPrice = prod ? prod.price : (Number(item.price) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      calculatedTotal += itemPrice * qty;

      return {
        productId: item.productId,
        productName: prod ? prod.name : String(item.productName || 'Producto'),
        price: itemPrice,
        quantity: qty,
        image: prod ? prod.images[0] : item.image
      };
    });

    const newOrder: Order = {
      id: randomUUID(),
      orderNumber: generate10DigitNumber(),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      items: processedItems,
      total: Math.round(calculatedTotal * 100) / 100,
      status: 'Pendiente',
      paymentType: validPaymentType,
      installmentCount: getInstallmentCount(validPaymentType),
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);

    try {
      await supabase.from('orders').insert([mapOrderToRow(newOrder)]);
    } catch (err) {
      console.log('Error registrando orden en Supabase:', err);
    }

    logApiCall('CREATE_ORDER', '/api/orders', 'POST', req.body, newOrder, 201);
    res.status(201).json(newOrder);
  });

  // Update order status & payment type (Aprobar, Rechazar o Cambiar Modalidad)
  app.put('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, paymentType } = req.body;

    if (status && status !== 'Aprobado' && status !== 'Rechazado' && status !== 'Pendiente') {
      const errRes = { error: 'Estado no válido. Debe ser Aprobado, Rechazado o Pendiente.' };
      logApiCall('UPDATE_ORDER_STATUS', `/api/orders/${id}/status`, 'PUT', req.body, errRes, 400);
      return res.status(400).json(errRes);
    }

    const order = orders.find(o => o.id === id);
    if (!order) {
      const errRes = { error: 'Solicitud no encontrada.' };
      logApiCall('UPDATE_ORDER_STATUS', `/api/orders/${id}/status`, 'PUT', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    const previousStatus = order.status;
    if (status) {
      order.status = status;
    }

    if (paymentType === 'contado' || paymentType === 'cuotas_2' || paymentType === 'cuotas_4') {
      order.paymentType = paymentType;
    }

    order.updatedAt = new Date().toISOString();

    // IF APPROVED, REST STOCK FOR THE INDICATED PRODUCTS & GENERATE PAYMENT SCHEDULE AUTOMATICALLY!
    if (status === 'Aprobado') {
      if (previousStatus !== 'Aprobado') {
        // Validation check FIRST: Verify stock sufficiency for all requested products
        for (const item of order.items) {
          const prod = products.find(p => p.id === item.productId);
          const currentStock = prod ? prod.stock : 0;
          if (!prod || currentStock < item.quantity) {
            order.status = previousStatus; // Revert status change
            const errRes = {
              error: `No se puede aprobar la solicitud: Stock insuficiente para el producto "${item.productName || prod?.name || 'Producto'}". Se solicitaron ${item.quantity} unidad(es), pero solo quedan ${currentStock} disponible(s) en inventario.`
            };
            logApiCall('UPDATE_ORDER_STATUS', `/api/orders/${id}/status`, 'PUT', req.body, errRes, 400);
            return res.status(400).json(errRes);
          }
        }

        // Subtract stock atomically
        for (const item of order.items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
            try {
              await supabase.from('products').update({ stock: prod.stock }).eq('id', prod.id);
            } catch (e) {
              console.log('Error actualizando stock en Supabase:', e);
            }
          }
        }
      }

      if (status) {
        order.status = status;
      }
      if (paymentType === 'contado' || paymentType === 'cuotas_2' || paymentType === 'cuotas_4') {
        order.paymentType = paymentType;
      }

      // Automatically generate payment schedule if not existing or if paymentType changed
      if (!order.paymentSchedule || order.paymentSchedule.length === 0 || paymentType) {
        order.paymentSchedule = generatePaymentSchedule(order.total, order.paymentType, order.createdAt);
      }
      if (!order.paymentsHistory) {
        order.paymentsHistory = [];
      }

      const creditState = recalculateCreditState(order.total, order.paymentSchedule, order.paymentsHistory);
      order.totalPaid = creditState.totalPaid;
      order.creditStatus = creditState.creditStatus;
      order.paymentSchedule = creditState.updatedSchedule;
    } else {
      if (status) {
        order.status = status;
      }
      if (paymentType === 'contado' || paymentType === 'cuotas_2' || paymentType === 'cuotas_4') {
        order.paymentType = paymentType;
      }
    }

    try {
      await supabase.from('orders').update({
        status: order.status,
        payment_type: order.paymentType || 'contado',
        installment_count: getInstallmentCount(order.paymentType),
        payment_schedule: order.paymentSchedule || [],
        payments_history: order.paymentsHistory || [],
        total_paid: order.totalPaid || 0,
        credit_status: order.creditStatus || 'En Proceso',
        updated_at: order.updatedAt
      }).eq('id', id);
    } catch (err) {
      console.log('Error actualizando orden en Supabase:', err);
    }

    const responsePayload = {
      order,
      message: status === 'Aprobado' 
        ? 'Solicitud aprobada, fechas de pago generadas y stock restado exitosamente.' 
        : 'Solicitud actualizada correctamente.'
    };

    logApiCall('UPDATE_ORDER_STATUS', `/api/orders/${id}/status`, 'PUT', req.body, responsePayload, 200);
    res.json(responsePayload);
  });

  // Add Abono (Cuota / Pago parcial o total)
  app.post('/api/orders/:id/abonos', async (req, res) => {
    const { id } = req.params;
    const { amount, note } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const errRes = { error: 'El monto del abono debe ser un número positivo mayor a 0.' };
      logApiCall('ADD_ABONO', `/api/orders/${id}/abonos`, 'POST', req.body, errRes, 400);
      return res.status(400).json(errRes);
    }

    const order = orders.find(o => o.id === id);
    if (!order) {
      const errRes = { error: 'Solicitud no encontrada.' };
      logApiCall('ADD_ABONO', `/api/orders/${id}/abonos`, 'POST', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    if (!order.paymentsHistory) order.paymentsHistory = [];
    if (!order.paymentSchedule || order.paymentSchedule.length === 0) {
      order.paymentSchedule = generatePaymentSchedule(order.total, order.paymentType, order.createdAt);
    }

    const newAbono = {
      id: randomUUID(),
      date: new Date().toISOString(),
      amount: Math.round(numAmount * 100) / 100,
      note: note ? String(note).trim() : undefined
    };

    order.paymentsHistory.push(newAbono);

    const creditState = recalculateCreditState(order.total, order.paymentSchedule, order.paymentsHistory);
    order.totalPaid = creditState.totalPaid;
    order.creditStatus = creditState.creditStatus;
    order.paymentSchedule = creditState.updatedSchedule;
    order.updatedAt = new Date().toISOString();

    try {
      await supabase.from('orders').update({
        payments_history: order.paymentsHistory,
        payment_schedule: order.paymentSchedule,
        total_paid: order.totalPaid,
        credit_status: order.creditStatus,
        updated_at: order.updatedAt
      }).eq('id', id);
    } catch (err) {
      console.log('Error actualizando abonos en Supabase:', err);
    }

    const responsePayload = {
      order,
      message: order.creditStatus === 'Pagado'
        ? '¡Abono registrado con éxito! La deuda ha sido SALDADA por completo (Estado: Pagado).'
        : `Abono de C$ ${newAbono.amount.toFixed(2)} registrado correctamente.`
    };

    logApiCall('ADD_ABONO', `/api/orders/${id}/abonos`, 'POST', req.body, responsePayload, 200);
    res.json(responsePayload);
  });

  // Update existing Abono
  app.put('/api/orders/:id/abonos/:abonoId', async (req, res) => {
    const { id, abonoId } = req.params;
    const { amount, note } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const errRes = { error: 'El monto del abono debe ser un número positivo mayor a 0.' };
      logApiCall('UPDATE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'PUT', req.body, errRes, 400);
      return res.status(400).json(errRes);
    }

    const order = orders.find(o => o.id === id);
    if (!order) {
      const errRes = { error: 'Solicitud no encontrada.' };
      logApiCall('UPDATE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'PUT', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    if (!order.paymentsHistory) order.paymentsHistory = [];
    const abonoIndex = order.paymentsHistory.findIndex(a => a.id === abonoId);
    if (abonoIndex === -1) {
      const errRes = { error: 'Abono no encontrado en la solicitud.' };
      logApiCall('UPDATE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'PUT', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    order.paymentsHistory[abonoIndex] = {
      ...order.paymentsHistory[abonoIndex],
      amount: Math.round(numAmount * 100) / 100,
      note: note !== undefined ? String(note).trim() : order.paymentsHistory[abonoIndex].note
    };

    if (!order.paymentSchedule || order.paymentSchedule.length === 0) {
      order.paymentSchedule = generatePaymentSchedule(order.total, order.paymentType, order.createdAt);
    }

    const creditState = recalculateCreditState(order.total, order.paymentSchedule, order.paymentsHistory);
    order.totalPaid = creditState.totalPaid;
    order.creditStatus = creditState.creditStatus;
    order.paymentSchedule = creditState.updatedSchedule;
    order.updatedAt = new Date().toISOString();

    try {
      await supabase.from('orders').update({
        payments_history: order.paymentsHistory,
        payment_schedule: order.paymentSchedule,
        total_paid: order.totalPaid,
        credit_status: order.creditStatus,
        updated_at: order.updatedAt
      }).eq('id', id);
    } catch (err) {
      console.log('Error actualizando abono en Supabase:', err);
    }

    const responsePayload = {
      order,
      message: 'Abono modificado correctamente. Estado de crédito recalculado.'
    };

    logApiCall('UPDATE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'PUT', req.body, responsePayload, 200);
    res.json(responsePayload);
  });

  // Delete existing Abono
  app.delete('/api/orders/:id/abonos/:abonoId', async (req, res) => {
    const { id, abonoId } = req.params;

    const order = orders.find(o => o.id === id);
    if (!order) {
      const errRes = { error: 'Solicitud no encontrada.' };
      logApiCall('DELETE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'DELETE', req.body, errRes, 404);
      return res.status(404).json(errRes);
    }

    if (!order.paymentsHistory) order.paymentsHistory = [];
    order.paymentsHistory = order.paymentsHistory.filter(a => a.id !== abonoId);

    if (!order.paymentSchedule || order.paymentSchedule.length === 0) {
      order.paymentSchedule = generatePaymentSchedule(order.total, order.paymentType, order.createdAt);
    }

    const creditState = recalculateCreditState(order.total, order.paymentSchedule, order.paymentsHistory);
    order.totalPaid = creditState.totalPaid;
    order.creditStatus = creditState.creditStatus;
    order.paymentSchedule = creditState.updatedSchedule;
    order.updatedAt = new Date().toISOString();

    try {
      await supabase.from('orders').update({
        payments_history: order.paymentsHistory,
        payment_schedule: order.paymentSchedule,
        total_paid: order.totalPaid,
        credit_status: order.creditStatus,
        updated_at: order.updatedAt
      }).eq('id', id);
    } catch (err) {
      console.log('Error eliminando abono en Supabase:', err);
    }

    const responsePayload = {
      order,
      message: 'Abono eliminado correctamente. Estado de crédito recalculado.'
    };

    logApiCall('DELETE_ABONO', `/api/orders/${id}/abonos/${abonoId}`, 'DELETE', req.body, responsePayload, 200);
    res.json(responsePayload);
  });

  // Delete order (Soft delete - Only permitted when order status is Aprobado or Rechazado)
  app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);

    if (!order || order.isDeleted) {
      const errRes = { error: 'Solicitud no encontrada.' };
      logApiCall('DELETE_ORDER', `/api/orders/${id}`, 'DELETE', { id }, errRes, 404);
      return res.status(404).json(errRes);
    }

    // REQUIREMENT: Solicitudes solo se pueden borrar una vez que su estado sea 'Aprobado' o 'Rechazado'
    if (order.status === 'Pendiente') {
      const errRes = { error: 'No se puede eliminar una solicitud en estado Pendiente. Debe ser Aprobada o Rechazada previamente.' };
      logApiCall('DELETE_ORDER', `/api/orders/${id}`, 'DELETE', { id }, errRes, 400);
      return res.status(400).json(errRes);
    }

    // If the order was approved, restore item quantities back to product stock!
    if (order.status === 'Aprobado' && order.items) {
      for (const item of order.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = Number(prod.stock) + Number(item.quantity);
          try {
            await supabase.from('products').update({ stock: prod.stock }).eq('id', prod.id);
          } catch (e) {
            console.log('Error devolviendo stock a Supabase:', e);
          }
        }
      }
    }

    order.isDeleted = true;
    orders = orders.filter(o => o.id !== id);

    try {
      await supabase.from('orders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.log('Error actualizando borrado lógico de orden en Supabase:', err);
    }

    const successRes = { success: true, message: 'Solicitud eliminada correctamente (borrado lógico).' };
    logApiCall('DELETE_ORDER', `/api/orders/${id}`, 'DELETE', { id }, successRes, 200);
    res.json(successRes);
  });

  // === STORE SETTINGS ENDPOINTS ===
  app.get('/api/store-settings', async (req, res) => {
    res.json(storeSettings);
  });

  app.put('/api/store-settings', async (req, res) => {
    const { name, description, logoUrl, whatsappNumber } = req.body;
    const targetName = name !== undefined ? String(name).trim() : storeSettings.name;
    const targetDescription = description !== undefined ? String(description).trim() : storeSettings.description;
    const targetLogoUrl = logoUrl !== undefined ? String(logoUrl).trim() : storeSettings.logoUrl;
    const targetWhatsappNumber = whatsappNumber !== undefined ? String(whatsappNumber).trim() : storeSettings.whatsappNumber;
    const updatedAt = new Date().toISOString();

    try {
      const { error: upsertErr } = await supabase.from('store_settings').upsert([{
        id: 'default',
        name: targetName,
        description: targetDescription,
        logo_url: targetLogoUrl,
        whatsapp_number: targetWhatsappNumber,
        updated_at: updatedAt
      }]);

      if (upsertErr) {
        console.error('Error haciendo upsert en store_settings:', upsertErr);
        // Fallback update
        const { error: updateErr } = await supabase.from('store_settings').update({
          name: targetName,
          description: targetDescription,
          logo_url: targetLogoUrl,
          whatsapp_number: targetWhatsappNumber,
          updated_at: updatedAt
        }).eq('id', 'default');

        if (updateErr) {
          console.error('Error haciendo update en store_settings:', updateErr);
          return res.status(400).json({
            error: `Error en la base de datos (Supabase): ${upsertErr.message || updateErr.message}. Deshabilita RLS en la tabla 'store_settings' o agrega una política de acceso (Policy).`
          });
        }
      }
    } catch (err: any) {
      console.error('Excepción al actualizar store_settings en Supabase:', err);
      return res.status(500).json({
        error: `Excepción al guardar en base de datos: ${err?.message || 'Error de conexión'}`
      });
    }

    storeSettings = {
      id: 'default',
      name: targetName,
      description: targetDescription,
      logoUrl: targetLogoUrl,
      whatsappNumber: targetWhatsappNumber,
      updatedAt
    };

    logApiCall('UPDATE_STORE_SETTINGS', '/api/store-settings', 'PUT', req.body, storeSettings, 200);
    res.json(storeSettings);
  });

  // === AUTHENTICATION & USERS ENDPOINTS ===
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const cleanedEmail = String(email).trim().toLowerCase();
    const rawPass = String(password).trim();
    const inputHash = hashPassword(rawPass);

    // Refresh users from Supabase DB on every login attempt
    try {
      const { data: dbUsers, error: dbErr } = await supabase.from('users').select('*');
      if (!dbErr && dbUsers && dbUsers.length > 0) {
        users = dbUsers.map((u: any) => ({
          id: String(u.id),
          email: String(u.email),
          password_hash: String(u.password_hash || u.passwordHash || ''),
          role: String(u.role || 'staff'),
          created_at: String(u.created_at || u.createdAt || new Date().toISOString())
        }));
      }
    } catch (e) {
      console.log('Aviso al consultar Supabase en login:', e);
    }

    // Look for matching user in users array (matching email, admin, or admin@admin.com)
    let matchedUser = users.find(u => {
      const dbEmail = u.email.toLowerCase();
      if (dbEmail === cleanedEmail) return true;
      if (cleanedEmail === 'admin' && (dbEmail === 'admin@admin.com' || u.role === 'admin')) return true;
      if (cleanedEmail === 'admin@admin.com' && dbEmail === 'admin') return true;
      return false;
    });

    let isPasswordValid = false;

    if (matchedUser) {
      const storedPass = matchedUser.password_hash;
      if (
        storedPass === rawPass ||
        storedPass === inputHash ||
        (rawPass === DEFAULT_ADMIN_PASS && (matchedUser.role === 'admin' || matchedUser.email.toLowerCase().includes('admin')))
      ) {
        isPasswordValid = true;
      }
    }

    // Hardcoded fallback for default admin account
    const isHardcodedAdminUser = cleanedEmail === 'admin' ||
                          cleanedEmail === 'admin@admin.com' ||
                          cleanedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

    const isHardcodedAdminPass = rawPass === '850012cf-2945-4293-a2d5-6b2956d15cfb' ||
                        rawPass === DEFAULT_ADMIN_PASS;

    if (!isPasswordValid && isHardcodedAdminUser && isHardcodedAdminPass) {
      if (!matchedUser) {
        matchedUser = {
          id: '00000000-0000-4000-8000-000000000001',
          email: DEFAULT_ADMIN_EMAIL,
          password_hash: rawPass,
          role: 'admin',
          created_at: new Date().toISOString()
        };
        users.unshift(matchedUser);
      }
      isPasswordValid = true;

      try {
        await supabase.from('users').upsert([{
          id: matchedUser.id,
          email: matchedUser.email,
          password_hash: rawPass,
          role: 'admin',
          created_at: matchedUser.created_at
        }]);
      } catch (err) {
        console.log('Error sincronizando admin en Supabase:', err);
      }
    }

    if (!matchedUser || !isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' });
    }

    const responseUser = {
      id: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      createdAt: matchedUser.created_at
    };

    logApiCall('USER_LOGIN', '/api/auth/login', 'POST', { email: cleanedEmail }, responseUser, 200);
    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      user: responseUser
    });
  });

  app.get('/api/users', async (req, res) => {
    try {
      const { data: dbUsers, error: dbErr } = await supabase.from('users').select('*');
      if (!dbErr && dbUsers) {
        const fetchedUsers = dbUsers.map((u: any) => ({
          id: String(u.id),
          email: String(u.email),
          password_hash: String(u.password_hash || u.passwordHash || u.password || ''),
          role: String(u.role || 'staff'),
          created_at: String(u.created_at || u.createdAt || new Date().toISOString())
        }));

        for (const fu of fetchedUsers) {
          const idx = users.findIndex(u => u.id === fu.id || u.email.toLowerCase() === fu.email.toLowerCase());
          if (idx >= 0) {
            users[idx] = fu;
          } else {
            users.push(fu);
          }
        }
      }
    } catch (e) {
      console.log('Aviso al consultar usuarios de la base de datos:', e);
    }

    // Always ensure admin exists
    if (!users.some(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || u.email.toLowerCase() === 'admin')) {
      users.unshift({
        id: '00000000-0000-4000-8000-000000000001',
        email: DEFAULT_ADMIN_EMAIL,
        password_hash: DEFAULT_ADMIN_PASS,
        role: 'admin',
        created_at: new Date().toISOString()
      });
    }

    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.created_at
    }));
    res.json(safeUsers);
  });

  app.post('/api/users', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const cleanedEmail = String(email).trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanedEmail)) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const newUser: UserRow = {
      id: randomUUID(),
      email: cleanedEmail,
      password_hash: String(password).trim(),
      role: role === 'admin' ? 'admin' : 'staff',
      created_at: new Date().toISOString()
    };

    // Attempt DB insertion first
    try {
      const { error: insErr } = await supabase.from('users').insert([{
        id: newUser.id,
        email: newUser.email,
        password_hash: newUser.password_hash,
        role: newUser.role,
        created_at: newUser.created_at
      }]);

      if (insErr) {
        console.error('Error insertando usuario en Supabase:', insErr);
        return res.status(400).json({
          error: `Error en la base de datos (Supabase): ${insErr.message}. Deshabilita RLS en la tabla 'users' o agrega una política de acceso.`
        });
      }
    } catch (err: any) {
      console.error('Excepción al insertar usuario en Supabase:', err);
      return res.status(500).json({
        error: `Excepción al guardar en base de datos: ${err?.message || 'Error de conexión'}`
      });
    }

    // Only add to in-memory state after successful DB insertion
    users.push(newUser);

    const safeUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.created_at
    };

    logApiCall('CREATE_USER', '/api/users', 'POST', { email: cleanedEmail, role: newUser.role }, safeUser, 201);
    res.status(201).json(safeUser);
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, role } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = users[userIndex];
    const isPrimaryAdmin = user.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
                          user.email.toLowerCase() === 'admin' ||
                          user.id === '00000000-0000-4000-8000-000000000001';

    if (isPrimaryAdmin) {
      return res.status(400).json({ error: 'El usuario administrador principal es intocable y no se puede editar.' });
    }

    let targetEmail = user.email;
    if (email && String(email).trim()) {
      targetEmail = String(email).trim().toLowerCase();
      if (users.some(u => u.id !== id && u.email.toLowerCase() === targetEmail)) {
        return res.status(400).json({ error: 'El correo electrónico ya está en uso por otro usuario.' });
      }
    }

    const targetPassword = (password && String(password).trim().length > 0) ? String(password).trim() : user.password_hash;
    const targetRole = role ? (role === 'admin' ? 'admin' : 'staff') : user.role;

    try {
      const { error: updErr } = await supabase.from('users').update({
        email: targetEmail,
        password_hash: targetPassword,
        role: targetRole
      }).eq('id', id);

      if (updErr) {
        console.error('Error actualizando usuario en Supabase:', updErr);
        return res.status(400).json({
          error: `Error al actualizar en la base de datos (Supabase): ${updErr.message}`
        });
      }
    } catch (err: any) {
      console.error('Excepción actualizando usuario en base de datos:', err);
      return res.status(500).json({ error: `Excepción en la base de datos: ${err?.message || 'Error de conexión'}` });
    }

    // Update in-memory state after DB success
    user.email = targetEmail;
    user.password_hash = targetPassword;
    user.role = targetRole;

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    };

    logApiCall('UPDATE_USER', `/api/users/${id}`, 'PUT', { email: user.email, role: user.role }, safeUser, 200);
    res.json(safeUser);
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isPrimaryAdmin = user.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
                          user.email.toLowerCase() === 'admin' ||
                          user.id === '00000000-0000-4000-8000-000000000001';

    if (isPrimaryAdmin) {
      return res.status(400).json({ error: 'El usuario administrador principal es intocable y no se puede eliminar.' });
    }

    try {
      const { error: delErr } = await supabase.from('users').delete().eq('id', id);
      if (delErr) {
        console.error('Error eliminando usuario en Supabase:', delErr);
        return res.status(400).json({
          error: `Error al eliminar en la base de datos (Supabase): ${delErr.message}`
        });
      }
    } catch (err: any) {
      console.error('Excepción eliminando usuario en base de datos:', err);
      return res.status(500).json({ error: `Excepción en la base de datos: ${err?.message || 'Error de conexión'}` });
    }

    users = users.filter(u => u.id !== id);

    res.json({ success: true, message: 'Usuario eliminado correctamente.' });
  });

  // === ADMIN PROTECTED SEED & CLEAR DATABASE ===
  app.post('/api/seed', async (req, res) => {
    const { email, password } = req.body || {};

    if (!verifyAdminCredentials(email, password)) {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren credenciales válidas del usuario administrador para poblar la base de datos.'
      });
    }

    try {
      await seedSupabase();
      res.json({
        success: true,
        message: 'Base de datos poblada correctamente por el usuario administrador.',
        productsCount: products.length,
        ordersCount: orders.length
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al poblar datos';
      res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/clear-all', async (req, res) => {
    const { email, password } = req.body || {};

    if (!verifyAdminCredentials(email, password)) {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren credenciales válidas del usuario administrador (admin@nombredelatienda.com) para vaciar la base de datos.'
      });
    }

    try {
      await clearSupabase();
      res.json({
        success: true,
        message: 'Toda la información de la base de datos ha sido eliminada por el usuario administrador.'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al vaciar datos';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // === VITE MIDDLEWARE SETUP ===
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    // Load stored data from Supabase on boot (No auto-wiping/seeding)
    await loadDataFromSupabase().catch(err => console.log('Error al cargar datos desde Supabase:', err));
  });
}

startServer();

