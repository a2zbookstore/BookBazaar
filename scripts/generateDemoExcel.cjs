/**
 * Generates a demo Excel file with all supported bulk-upload columns
 * Run: node scripts/generateDemoExcel.cjs
 */
const XLSX = require('xlsx');
const path = require('path');

const headers = [
  'title',
  'author',
  'isbn',
  'price',
  'cost price',
  'category',
  'categories',
  'subcategory',
  'condition',
  'binding',
  'description',
  'publisher',
  'published year',
  'pages',
  'language',
  'edition',
  'weight',
  'dimensions',
  'stock',
  'featured',
  'bestseller',
  'trending',
  'new arrival',
  'box set',
  'hidden',
  'image url 2',
  'image url 3',
];

// '-' placeholder ensures empty-looking columns still get a cell written
// (replace with actual URLs in image url 2 / image url 3 when uploading)
const _ = '-';

const rows = [
  // title | author | isbn | price | cost price | category | categories | subcategory
  // condition | binding | description | publisher | published year | pages | language
  // edition | weight | dimensions | stock
  // featured | bestseller | trending | new arrival | box set | hidden
  // image url 2 | image url 3
  ['The Great Gatsby','F. Scott Fitzgerald','9780743273565',12.99,7.50,
   'Fiction','Fiction, Classics','American Literature',
   'New','Paperback',
   'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
   'Scribner',2004,180,'English','1st',0.25,'19.8 x 12.9 x 1.1 cm',50,
   'yes','yes','no','no','no','no',_,_],

  ['To Kill a Mockingbird','Harper Lee','9780061935466',14.99,8.00,
   'Fiction','Fiction','Classic Fiction',
   'New','Paperback',
   'The unforgettable novel of a childhood in a sleepy Southern town.',
   'Harper Perennial',2002,336,'English','Perennial Modern Classics',0.35,'20.3 x 13.5 x 1.8 cm',40,
   'no','yes','no','no','no','no',_,_],

  ['1984','George Orwell','9780451524935',11.99,6.00,
   'Fiction','Fiction, Science Fiction','Dystopian',
   'New','Mass Market Paperback',
   'A chilling vision of a totalitarian society in which Big Brother watches every move.',
   'Signet Classic',1961,328,'English','Signet Classic Edition',0.30,'17.1 x 10.6 x 1.7 cm',60,
   'yes','yes','yes','no','no','no',_,_],

  ["Harry Potter and the Philosopher's Stone",'J.K. Rowling','9780439708180',9.99,5.00,
   'Children','Children, Fantasy','Fantasy',
   'New','Paperback',
   "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat.",
   'Scholastic',1998,320,'English','US Edition',0.40,'19.1 x 13.2 x 2.0 cm',100,
   'yes','yes','yes','yes','no','no',_,_],

  ['Atomic Habits','James Clear','9780735211292',18.99,10.00,
   'Self Help','Self Help, Business','Productivity',
   'New','Hardcover',
   'A revolutionary system to get 1% better every day.',
   'Avery',2018,320,'English','1st',0.45,'23.4 x 15.5 x 2.8 cm',75,
   'yes','yes','yes','no','no','no',_,_],

  ['Sapiens: A Brief History of Humankind','Yuval Noah Harari','9780062316097',17.99,9.50,
   'Non Fiction','Non Fiction, History','World History',
   'New','Paperback',
   'How did Homo sapiens evolve to dominate the planet? A dazzling journey through human history.',
   'Harper Perennial',2015,443,'English','Reprint',0.50,'20.3 x 13.2 x 2.5 cm',45,
   'no','yes','no','no','no','no',_,_],

  ['The Alchemist','Paulo Coelho','9780062315007',13.99,7.00,
   'Fiction','Fiction','Inspirational Fiction',
   'New','Paperback',
   'A fable about following your dream.',
   'HarperOne',1988,208,'English','25th Anniversary Edition',0.20,'20.3 x 13.7 x 1.3 cm',80,
   'no','no','yes','yes','no','no',_,_],

  ['Harry Potter Complete Box Set','J.K. Rowling','9780545162074',79.99,45.00,
   'Children','Children, Fantasy','Fantasy',
   'New','Paperback Box Set',
   'The complete Harry Potter series — all 7 books in a beautiful box set.',
   'Scholastic',2009,4100,'English','Box Set Edition',3.50,'21.0 x 14.0 x 18.0 cm',20,
   'yes','yes','yes','no','yes','no',_,_],

  ['Used Copy - The Catcher in the Rye','J.D. Salinger','9780316769174',6.99,2.00,
   'Fiction','Fiction','Classic Fiction',
   'Used - Good','Paperback',
   'The story of Holden Caulfield wandering around New York City after being expelled.',
   'Little, Brown and Company',1951,277,'English','Reissue',0.25,'19.7 x 13.0 x 1.4 cm',5,
   'no','no','no','no','no','no',_,_],

  ['Hidden Draft Book','Test Author','9780000000000',25.00,15.00,
   'Non Fiction','Non Fiction',_,
   'New','Hardcover',
   'A book hidden from the storefront. Set hidden=yes to keep off the store.',
   'Test Publisher',2024,200,'English','1st',0.40,'23.0 x 15.0 x 2.0 cm',0,
   'no','no','no','no','no','yes',_,_],
];

const worksheetData = [headers, ...rows];
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column widths
worksheet['!cols'] = headers.map(h => {
  if (h === 'description') return { wch: 60 };
  if (['title', 'categories', 'author'].includes(h)) return { wch: 35 };
  if (['isbn', 'dimensions', 'publisher', 'subcategory', 'image url 2', 'image url 3'].includes(h)) return { wch: 28 };
  return { wch: 15 };
});

// Freeze the header row
worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

// Bold the header row cells
const range = XLSX.utils.decode_range(worksheet['!ref']);
for (let C = range.s.c; C <= range.e.c; C++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
  if (!worksheet[cellAddr]) continue;
  worksheet[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9E1F2' } } };
}

// ---- Column reference sheet ----
const refHeaders = ['#', 'Column Name', 'Required?', 'Accepted Values / Notes'];
const refRows = [
  [1,  'title',          'YES',  'Book title'],
  [2,  'author',         'NO',   'Defaults to "Unknown Author" if blank'],
  [3,  'isbn',           'NO',   '10 or 13 digit ISBN'],
  [4,  'price',          'YES',  'Selling price (number, e.g. 12.99)'],
  [5,  'cost price',     'NO',   'Cost / purchase price'],
  [6,  'category',       'NO',   'Primary category name (must match existing)'],
  [7,  'categories',     'NO',   'Comma-separated list of category names for multi-category'],
  [8,  'subcategory',    'NO',   'Subcategory name (must match existing)'],
  [9,  'condition',      'NO',   'New / Used - Good / Used - Acceptable etc.'],
  [10, 'binding',        'NO',   'Paperback / Hardcover / Mass Market Paperback / Box Set etc.'],
  [11, 'description',    'NO',   'Full book description'],
  [12, 'publisher',      'NO',   'Publisher name'],
  [13, 'published year', 'NO',   '4-digit year, e.g. 2023'],
  [14, 'pages',          'NO',   'Number of pages'],
  [15, 'language',       'NO',   'Defaults to English'],
  [16, 'edition',        'NO',   'e.g. 1st, 2nd, Revised'],
  [17, 'weight',         'NO',   'Weight in kg (decimal, e.g. 0.35)'],
  [18, 'dimensions',     'NO',   'e.g. 20.3 x 13.5 x 1.8 cm'],
  [19, 'stock',          'NO',   'Number of units in stock'],
  [20, 'featured',       'NO',   'yes / no'],
  [21, 'bestseller',     'NO',   'yes / no'],
  [22, 'trending',       'NO',   'yes / no'],
  [23, 'new arrival',    'NO',   'yes / no'],
  [24, 'box set',        'NO',   'yes / no'],
  [25, 'hidden',         'NO',   'yes = hidden from storefront; no = visible'],
  [26, 'image url 2',    'NO',   'Full URL to second product image'],
  [27, 'image url 3',    'NO',   'Full URL to third product image'],
];

const refSheet = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
refSheet['!cols'] = [{ wch: 4 }, { wch: 18 }, { wch: 12 }, { wch: 55 }];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');
XLSX.utils.book_append_sheet(workbook, refSheet, 'Column Reference');

const outputPath = path.join(__dirname, '..', 'demo_bulk_upload.xlsx');
XLSX.writeFile(workbook, outputPath);
console.log('Demo Excel created:', outputPath);
console.log('Sheets: Books (10 sample rows), Column Reference');
console.log('Columns:', headers.length);
