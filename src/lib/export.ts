import * as ExcelJS from 'exceljs';
import * as Papa from 'papaparse';

/**
 * Export data to JSON
 */
export function exportToJSON(data: any, filename: string = 'export.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, filename);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], filename: string = 'export.csv'): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Export data to Excel
 */
export async function exportToExcel(data: any[], filename: string = 'export.xlsx'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Add data rows
    data.forEach(item => {
      worksheet.addRow(Object.values(item));
    });
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data using Chrome downloads API (for background script)
 */
export async function exportWithChromeAPI(
  data: any,
  format: 'json' | 'csv' | 'xlsx',
  filename?: string
): Promise<void> {
  let blob: Blob;
  let defaultFilename: string;

  switch (format) {
    case 'csv':
      const csv = Papa.unparse(Array.isArray(data) ? data : [data]);
      blob = new Blob([csv], { type: 'text/csv' });
      defaultFilename = 'export.csv';
      break;

    case 'xlsx':
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');
      const dataArray = Array.isArray(data) ? data : [data];
      
      if (dataArray.length > 0) {
        // Add headers
        const headers = Object.keys(dataArray[0]);
        worksheet.addRow(headers);
        
        // Add data rows
        dataArray.forEach(item => {
          worksheet.addRow(Object.values(item));
        });
      }
      
      const excelBuffer = await workbook.xlsx.writeBuffer();
      blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      defaultFilename = 'export.xlsx';
      break;

    case 'json':
    default:
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      defaultFilename = 'export.json';
      break;
  }

  const url = URL.createObjectURL(blob);
  
  if (typeof chrome !== 'undefined' && chrome.downloads) {
    await chrome.downloads.download({
      url,
      filename: filename || defaultFilename,
      saveAs: true,
    });
  } else {
    // Fallback to regular download
    downloadBlob(blob, filename || defaultFilename);
  }
  
  URL.revokeObjectURL(url);
}
