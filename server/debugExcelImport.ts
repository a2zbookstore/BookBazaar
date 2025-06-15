import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugExcelFile() {
  try {
    const excelPath = path.join(__dirname, '../attached_assets/A_1750010813166.xlsx');
    console.log('Reading Excel file:', excelPath);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Sheet name:', sheetName);
    console.log('Sheet range:', worksheet['!ref']);
    
    // Convert to JSON to see the actual data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\nFirst 20 rows of data:');
    jsonData.slice(0, 20).forEach((row: any, index) => {
      if (row && row.length > 0 && row.some((cell: any) => cell && cell.toString().trim())) {
        console.log(`Row ${index + 1}:`, row);
      }
    });
    
    // Count valid rows (non-empty rows with actual data)
    const validRows = jsonData.filter((row: any) => 
      row && row.length > 0 && 
      row.some((cell: any) => cell && cell.toString().trim()) &&
      row[0] && row[0].toString().trim() // Has title in first column
    );
    
    console.log('\nTotal rows in Excel:', jsonData.length);
    console.log('Valid data rows:', validRows.length);
    
    // Show headers
    if (jsonData.length > 0) {
      console.log('\nColumn Headers (Row 1):', jsonData[0]);
    }
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

debugExcelFile();