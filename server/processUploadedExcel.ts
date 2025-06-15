import { BookImporter } from './bookImporter';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processUploadedExcel() {
  try {
    const excelPath = path.join(__dirname, '../attached_assets/A_1750010813166.xlsx');
    console.log('Processing Excel file:', excelPath);
    
    const result = await BookImporter.importFromExcel(excelPath);
    
    console.log('Import Results:');
    console.log(`✓ Successfully imported: ${result.success} books`);
    console.log(`✗ Failed to import: ${result.failed} books`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Failed to process Excel file:', error);
    throw error;
  }
}

// Run the import
processUploadedExcel()
  .then((result) => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  });