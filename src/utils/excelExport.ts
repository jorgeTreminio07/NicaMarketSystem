import * as XLSX from 'xlsx';

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Reporte') {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar en el rango seleccionado.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
