import React, { useState, useMemo } from 'react';
import { Order, Product } from '../../../types';
import { exportToExcel } from '../../../utils/excelExport';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Calendar,
  Download,
  Users,
  ShoppingBag,
  CheckCircle2,
  Package,
  TrendingUp,
  Filter,
  DollarSign
} from 'lucide-react';

interface ReportsSectionProps {
  orders: Order[];
  products: Product[];
}

const CATEGORY_COLORS = [
  '#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#4f46e5', '#ca8a04', '#be123c', '#0d9488'
];

export const ReportsSection: React.FC<ReportsSectionProps> = ({ orders, products }) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'stock_category' | 'approved_sales' | 'paid_orders' | 'frequent_customers'
  >('stock_category');

  // Date range state for reports 2 and 3
  const todayISO = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoISO = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [salesStartDate, setSalesStartDate] = useState(thirtyDaysAgoISO);
  const [salesEndDate, setSalesEndDate] = useState(todayISO);

  const [paidStartDate, setPaidStartDate] = useState(thirtyDaysAgoISO);
  const [paidEndDate, setPaidEndDate] = useState(todayISO);

  // ----------------------------------------------------
  // 1. REPORT: STOCK BY CATEGORY (Pie Chart)
  // ----------------------------------------------------
  const stockByCategoryData = useMemo(() => {
    const categoryMap: Record<string, { count: number; totalStock: number }> = {};

    products.forEach(p => {
      const cat = p.category || 'Sin Categoría';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, totalStock: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].totalStock += Number(p.stock) || 0;
    });

    return Object.keys(categoryMap).map(cat => ({
      name: cat,
      productTypes: categoryMap[cat].count,
      value: categoryMap[cat].totalStock
    }));
  }, [products]);

  // Total stock count across all products
  const totalStockSum = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [products]);

  // ----------------------------------------------------
  // 2. REPORT: APPROVED SALES BY DATE RANGE (Table + Excel)
  // ----------------------------------------------------
  const approvedSalesFiltered = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'Aprobado') return false;
      const orderDate = (o.createdAt || '').split('T')[0];
      return orderDate >= salesStartDate && orderDate <= salesEndDate;
    });
  }, [orders, salesStartDate, salesEndDate]);

  const totalApprovedSalesAmount = useMemo(() => {
    return approvedSalesFiltered.reduce((sum, o) => sum + o.total, 0);
  }, [approvedSalesFiltered]);

  const handleExportApprovedSales = () => {
    const exportData = approvedSalesFiltered.map(o => ({
      'N° Solicitud': o.orderNumber || o.id.slice(0, 8),
      'Cliente': o.customerName,
      'Teléfono': o.customerPhone,
      'Modalidad de Pago': o.paymentType === 'cuotas_2' ? '2 Cuotas' : o.paymentType === 'cuotas_4' ? '4 Cuotas' : 'Contado',
      'Monto Total (C$)': o.total,
      'Abonado (C$)': o.totalPaid || 0,
      'Estado Crédito': o.creditStatus || 'En Proceso',
      'Fecha Aprobación': new Date(o.createdAt).toLocaleDateString('es-NI')
    }));

    exportToExcel(
      exportData,
      `Ventas_Aprobadas_${salesStartDate}_al_${salesEndDate}`,
      'Ventas Aprobadas'
    );
  };

  // ----------------------------------------------------
  // 3. REPORT: PAID ORDERS BY DATE RANGE (Table + Excel)
  // ----------------------------------------------------
  const paidOrdersFiltered = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'Aprobado') return false;
      if (o.creditStatus !== 'Pagado') return false;
      const orderDate = (o.createdAt || '').split('T')[0];
      return orderDate >= paidStartDate && orderDate <= paidEndDate;
    });
  }, [orders, paidStartDate, paidEndDate]);

  const totalPaidOrdersAmount = useMemo(() => {
    return paidOrdersFiltered.reduce((sum, o) => sum + o.total, 0);
  }, [paidOrdersFiltered]);

  const handleExportPaidOrders = () => {
    const exportData = paidOrdersFiltered.map(o => ({
      'N° Solicitud': o.orderNumber || o.id.slice(0, 8),
      'Cliente': o.customerName,
      'Teléfono': o.customerPhone,
      'Modalidad': o.paymentType === 'cuotas_2' ? '2 Cuotas' : o.paymentType === 'cuotas_4' ? '4 Cuotas' : 'Contado',
      'Total Solicitud (C$)': o.total,
      'Total Pagado (C$)': o.totalPaid || o.total,
      'Estado': 'Pagado / Saldado',
      'Fecha Creación': new Date(o.createdAt).toLocaleDateString('es-NI')
    }));

    exportToExcel(
      exportData,
      `Solicitudes_Pagadas_${paidStartDate}_al_${paidEndDate}`,
      'Solicitudes Pagadas'
    );
  };

  // ----------------------------------------------------
  // 4. REPORT: TOP 10 MOST SOLD PRODUCTS (Bar Chart)
  // ----------------------------------------------------
  const top10ProductsData = useMemo(() => {
    const productSalesMap: Record<string, { title: string; totalQuantity: number; totalRevenue: number }> = {};

    orders.forEach(o => {
      if (o.status === 'Aprobado') {
        o.items.forEach(item => {
          const key = item.productId || item.title;
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              title: item.title,
              totalQuantity: 0,
              totalRevenue: 0
            };
          }
          productSalesMap[key].totalQuantity += item.quantity;
          productSalesMap[key].totalRevenue += item.quantity * item.price;
        });
      }
    });

    const sorted = Object.values(productSalesMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
    return sorted.slice(0, 10);
  }, [orders]);

  // ----------------------------------------------------
  // 5. REPORT: FREQUENT CUSTOMERS (Table + Excel)
  // ----------------------------------------------------
  const frequentCustomersData = useMemo(() => {
    const customerMap: Record<
      string,
      {
        name: string;
        phone: string;
        totalOrdersCount: number;
        approvedOrdersCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    > = {};

    orders.forEach(o => {
      // Group by phone number if available, or lowercased customer name
      const key = (o.customerPhone && o.customerPhone.trim()) ? o.customerPhone.trim() : o.customerName.trim().toLowerCase();

      if (!customerMap[key]) {
        customerMap[key] = {
          name: o.customerName,
          phone: o.customerPhone || 'N/D',
          totalOrdersCount: 0,
          approvedOrdersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.createdAt
        };
      }

      customerMap[key].totalOrdersCount += 1;
      if (o.status === 'Aprobado') {
        customerMap[key].approvedOrdersCount += 1;
        customerMap[key].totalSpent += o.total;
      }

      if (new Date(o.createdAt) > new Date(customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = o.createdAt;
      }
    });

    return Object.values(customerMap).sort((a, b) => b.approvedOrdersCount - a.approvedOrdersCount || b.totalSpent - a.totalSpent);
  }, [orders]);

  const handleExportFrequentCustomers = () => {
    const exportData = frequentCustomersData.map(c => ({
      'Nombre Cliente': c.name,
      'Teléfono Contacto': c.phone,
      'Solicitudes Totales': c.totalOrdersCount,
      'Solicitudes Aprobadas': c.approvedOrdersCount,
      'Total Comprado (C$)': c.totalSpent,
      'Última Solicitud': new Date(c.lastOrderDate).toLocaleDateString('es-NI')
    }));

    exportToExcel(
      exportData,
      `Clientes_Frecuentes_${todayISO}`,
      'Clientes Frecuentes'
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs for Reports */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('stock_category')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
            activeReportTab === 'stock_category'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <PieChartIcon className="w-4 h-4 text-emerald-400" />
          <span>Existencia por Categoría</span>
        </button>

        <button
          onClick={() => setActiveReportTab('approved_sales')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
            activeReportTab === 'approved_sales'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Ventas Aprobadas</span>
        </button>

        <button
          onClick={() => setActiveReportTab('paid_orders')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
            activeReportTab === 'paid_orders'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Solicitudes Pagadas</span>
        </button>

        <button
          onClick={() => setActiveReportTab('frequent_customers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
            activeReportTab === 'frequent_customers'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Clientes Frecuentes</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. STOCK BY CATEGORY (PieChart) */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'stock_category' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-600" />
                  <span>Existencia de Productos por Categoría</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Distribución del stock físico disponible agrupado por cada categoría registrada.
                </p>
              </div>

              <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-right">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Stock Total Físico:</span>
                <span className="text-xl font-black text-emerald-700">{totalStockSum} unidades</span>
              </div>
            </div>

            {stockByCategoryData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No hay productos en inventario para graficar.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Pie Chart Visualizer */}
                <div className="lg:col-span-7 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={105}
                        innerRadius={45}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {stockByCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value} unidades en inventario`, 'Stock']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Table Breakdown */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                    Desglose por Categoría
                  </h4>
                  <div className="divide-y divide-slate-200/80 max-h-64 overflow-y-auto space-y-2 pt-1">
                    {stockByCategoryData.map((item, idx) => {
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      const percentage = totalStockSum > 0 ? Math.round((item.value / totalStockSum) * 100) : 0;

                      return (
                        <div key={item.name} className="pt-2 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="text-[10px] text-slate-400">({item.productTypes} productos)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 block">{item.value} unid.</span>
                            <span className="text-[10px] text-slate-500 font-bold">{percentage}% del total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. APPROVED SALES BY DATE RANGE */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'approved_sales' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Reporte de Ventas Aprobadas</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Consulta y exporta todas las solicitudes aprobadas en el rango de fechas seleccionado.
              </p>
            </div>

            <button
              onClick={handleExportApprovedSales}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar en Excel (.xlsx)</span>
            </button>
          </div>

          {/* Date Picker Filters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha Inicio:</span>
              </label>
              <input
                type="date"
                value={salesStartDate}
                onChange={e => setSalesStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha Fin:</span>
              </label>
              <input
                type="date"
                value={salesEndDate}
                onChange={e => setSalesEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Aprobado en Rango:</span>
              <span className="text-base font-black text-emerald-600">C$ {totalApprovedSalesAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">N° Solicitud</th>
                  <th className="p-3.5">Cliente / Teléfono</th>
                  <th className="p-3.5">Modalidad</th>
                  <th className="p-3.5 text-right">Monto (C$)</th>
                  <th className="p-3.5 text-right">Abonado (C$)</th>
                  <th className="p-3.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {approvedSalesFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      No se encontraron ventas aprobadas en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  approvedSalesFiltered.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        #{o.orderNumber || o.id.slice(0, 8)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{o.customerName}</div>
                        <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {o.paymentType === 'cuotas_2' && '2 Cuotas'}
                        {o.paymentType === 'cuotas_4' && '4 Cuotas'}
                        {(!o.paymentType || o.paymentType === 'contado') && 'Contado'}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        C$ {o.total.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600">
                        C$ {(o.totalPaid || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('es-NI')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. PAID ORDERS BY DATE RANGE */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'paid_orders' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Reporte de Solicitudes Totalmente Pagadas</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Muestra las solicitudes cuya deuda fue saldada por completo (100% abonado) por rango de fechas.
              </p>
            </div>

            <button
              onClick={handleExportPaidOrders}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar en Excel (.xlsx)</span>
            </button>
          </div>

          {/* Date Picker Filters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha Inicio:</span>
              </label>
              <input
                type="date"
                value={paidStartDate}
                onChange={e => setPaidStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha Fin:</span>
              </label>
              <input
                type="date"
                value={paidEndDate}
                onChange={e => setPaidEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Saldado en Rango:</span>
              <span className="text-base font-black text-emerald-600">C$ {totalPaidOrdersAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-950 text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">N° Solicitud</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Teléfono</th>
                  <th className="p-3.5">Modalidad</th>
                  <th className="p-3.5 text-right">Monto Total</th>
                  <th className="p-3.5">Estado Crédito</th>
                  <th className="p-3.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paidOrdersFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                      No hay solicitudes saldadas/pagadas en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  paidOrdersFiltered.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        #{o.orderNumber || o.id.slice(0, 8)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{o.customerName}</td>
                      <td className="p-3.5 text-slate-600">{o.customerPhone}</td>
                      <td className="p-3.5 text-slate-700 font-semibold">
                        {o.paymentType === 'cuotas_2' && '2 Cuotas'}
                        {o.paymentType === 'cuotas_4' && '4 Cuotas'}
                        {(!o.paymentType || o.paymentType === 'contado') && 'Contado'}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-700">
                        C$ {o.total.toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          PAGADO
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('es-NI')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* ---------------------------------------------------- */}
      {/* 5. FREQUENT CUSTOMERS */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'frequent_customers' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Reporte de Clientes Más Frecuentes</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Identifica a los clientes recurrentes según sus solicitudes de compra y número de teléfono.
              </p>
            </div>

            <button
              onClick={handleExportFrequentCustomers}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar en Excel (.xlsx)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Teléfono de Contacto</th>
                  <th className="p-3.5 text-center">Solicitudes Totales</th>
                  <th className="p-3.5 text-center">Solicitudes Aprobadas</th>
                  <th className="p-3.5 text-right">Total Comprado (C$)</th>
                  <th className="p-3.5">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium">
                {frequentCustomersData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      No hay clientes registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  frequentCustomersData.map(c => (
                    <tr key={c.phone + c.name} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900">{c.name}</td>
                      <td className="p-3.5 font-mono text-slate-700">{c.phone}</td>
                      <td className="p-3.5 text-center font-bold text-slate-600">
                        {c.totalOrdersCount}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {c.approvedOrdersCount}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        C$ {c.totalSpent.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(c.lastOrderDate).toLocaleDateString('es-NI')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
