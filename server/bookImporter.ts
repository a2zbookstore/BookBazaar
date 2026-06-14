import XLSX from 'xlsx';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { InsertBook } from '@shared/schema';
import { CloudinaryService } from './cloudinaryService';

interface BookRow {
  id?: number;
  title?: string;
  author?: string;
  isbn?: string;
  price?: number;
  costPrice?: number;
  category?: string;
  categories?: string; // comma-separated for multi-category
  subcategory?: string;
  condition?: string;
  binding?: string;
  description?: string;
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  language?: string;
  edition?: string;
  weight?: number;
  dimensions?: string;
  stock?: number;
  featured?: boolean;
  bestseller?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  boxSet?: boolean;
  isHidden?: boolean;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

interface BookCoverData {
  imageUrl: string;
  source: 'google' | 'openlibrary' | 'fallback';
}

export interface SuccessRecord {
  rowNumber: number;
  action: 'created' | 'updated';
  title?: string;
  author?: string;
  isbn?: string;
  price?: number;
  category?: string;
  subcategory?: string;
  condition?: string;
  binding?: string;
  stock?: number;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

export interface FailedRecord {
  rowNumber: number;
  title?: string;
  author?: string;
  isbn?: string;
  price?: number;
  reason: string;
}

export interface DetailedImportResult {
  success: number;
  failed: number;
  errors: string[];
  created: number;
  updated: number;
  imagesFromZip?: number;
  imagesFetched?: number;
  imagesNone?: number;
  reportBase64: string;
}

export class BookImporter {
  private static async fetchBookCover(isbn: string): Promise<BookCoverData | null> {
    const cleanISBN = isbn.replace(/[^0-9X]/g, '');
    
    // Try Google Books API first
    try {
      const googleResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
      );
      const googleData = await googleResponse.json();
      
      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0];
        if (book.volumeInfo?.imageLinks?.thumbnail) {
          return {
            imageUrl: book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'),
            source: 'google'
          };
        }
      }
    } catch (error) {
      console.log(`Google Books API failed for ISBN ${isbn}:`, error.message);
    }

    // Try Open Library API
    try {
      const openLibraryResponse = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`
      );
      const openLibraryData = await openLibraryResponse.json();
      
      const bookKey = `ISBN:${cleanISBN}`;
      if (openLibraryData[bookKey]?.cover?.medium) {
        return {
          imageUrl: openLibraryData[bookKey].cover.medium,
          source: 'openlibrary'
        };
      }
    } catch (error) {
      console.log(`Open Library API failed for ISBN ${isbn}:`, error.message);
    }

    // Try alternative Open Library cover URL
    try {
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`;
      const response = await fetch(coverUrl, { method: 'HEAD' });
      if (response.ok) {
        return {
          imageUrl: coverUrl,
          source: 'openlibrary'
        };
      }
    } catch (error) {
      console.log(`Open Library cover direct URL failed for ISBN ${isbn}:`, error.message);
    }

    return null;
  }

  private static async downloadAndSaveImage(imageUrl: string, isbn: string): Promise<string | null> {
    try {
      // Upload directly to Cloudinary from URL for permanent storage
      const uploadResult = await CloudinaryService.uploadFromUrl(
        imageUrl,
        'a2z-bookshop/books',
        `book-${isbn}-${Date.now()}`
      );
      
      console.log(`Image uploaded to Cloudinary for ISBN ${isbn}:`, {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      });
      
      return uploadResult.secure_url;
    } catch (error) {
      console.error(`Failed to upload image to Cloudinary for ISBN ${isbn}:`, error);
      return null;
    }
  }

  static async importFromExcel(filePath: string): Promise<DetailedImportResult> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      created: 0,
      updated: 0,
    };
    const successRows: SuccessRecord[] = [];
    const failedRows: FailedRecord[] = [];

    try {
      // Read Excel/CSV file
      const ext = filePath.split('.').pop()?.toLowerCase();
      const workbook = ext === 'csv'
        ? XLSX.readFile(filePath, { type: 'file', raw: false })
        : XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      // Auto-detect header row: skip a banner row if row 1 contains no recognised column names.
      // The styled template/export puts a decorative title in row 1 and real headers in row 2.
      const KNOWN_HEADERS = new Set(['id','title','author','isbn','price','cost price','category','categories',
        'subcategory','condition','binding','description','publisher','published year','pages','language',
        'edition','weight','dimensions','stock','featured','bestseller','trending','new arrival',
        'box set','hidden','image url','image url 2','image url 3']);
      const firstRowIsHeader = (data[0] as string[]).some(
        v => v && KNOWN_HEADERS.has(String(v).toLowerCase().trim())
      );
      const headerRowIndex = firstRowIsHeader ? 0 : 1;

      // Get headers
      const headers = data[headerRowIndex] as string[];
      const rows = data.slice(headerRowIndex + 1) as any[][];

      // Get all categories and subcategories for mapping
      const categories = await storage.getCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));

      const allSubcategories = await storage.getSubCategories();
      const subcategoryMap = new Map(allSubcategories.map(sub => [sub.name.toLowerCase(), sub]));

      // Preload existing ISBNs from DB for duplicate checking
      const { books: existingBooks } = await storage.getBooks({ limit: 100000, includeHidden: true, includeOutOfStock: true });
      const existingIsbnSet = new Set(existingBooks.filter(b => b.isbn).map(b => b.isbn!.trim()));
      const seenIsbnSet = new Set<string>(); // tracks ISBNs within this batch

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + headerRowIndex + 2; // Excel row number
        let bookData: BookRow = {};
        try {
          // Map row data to book object
          bookData = {};
          headers.forEach((header, index) => {
            const value = row[index];
            const normalizedHeader = header.toLowerCase().trim();
            
            switch (normalizedHeader) {
              case 'id':
                bookData.id = parseInt(value) || undefined;
                break;
              case 'title':
              case 'name':
                bookData.title = value?.toString().trim();
                break;
              case 'author':
                bookData.author = value?.toString().trim();
                break;
              case 'isbn':
              case 'item code':
              case 'item_code':
                bookData.isbn = value?.toString().trim();
                break;
              case 'price':
              case 'selling price':
              case 'selling_price':
                bookData.price = parseFloat(value) || 0;
                break;
              case 'cost price':
              case 'cost_price':
              case 'costprice':
                bookData.costPrice = parseFloat(value) || undefined;
                break;
              case 'category':
                bookData.category = value?.toString().trim();
                break;
              case 'categories':
                bookData.categories = value?.toString().trim();
                break;
              case 'subcategory':
              case 'sub_category':
              case 'sub category':
                bookData.subcategory = value?.toString().trim();
                break;
              case 'condition':
                bookData.condition = value?.toString().trim() || 'Good';
                break;
              case 'binding':
                bookData.binding = value?.toString().trim() || 'No Binding';
                break;
              case 'description':
                bookData.description = value?.toString().trim();
                break;
              case 'publisher':
                bookData.publisher = value?.toString().trim();
                break;
              case 'published_year':
              case 'published year':
              case 'year':
                bookData.publishedYear = parseInt(value) || undefined;
                break;
              case 'pages':
                bookData.pages = parseInt(value) || undefined;
                break;
              case 'language':
                bookData.language = value?.toString().trim() || 'English';
                break;
              case 'edition':
                bookData.edition = value?.toString().trim();
                break;
              case 'weight':
                bookData.weight = parseFloat(value) || undefined;
                break;
              case 'dimensions':
                bookData.dimensions = value?.toString().trim();
                break;
              case 'stock':
              case 'quantity':
              case 'qty':
                bookData.stock = parseInt(value) || 1;
                break;
              case 'featured':
                bookData.featured = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'bestseller':
              case 'best_seller':
              case 'best seller':
                bookData.bestseller = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'trending':
                bookData.trending = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'new_arrival':
              case 'new arrival':
              case 'newarrival':
                bookData.newArrival = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'box_set':
              case 'box set':
              case 'boxset':
                bookData.boxSet = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'hidden':
              case 'is_hidden':
              case 'is hidden':
                bookData.isHidden = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1;
                break;
              case 'image_url_2':
              case 'image url 2':
              case 'imageurl2':
                bookData.imageUrl2 = value?.toString().trim();
                break;
              case 'image_url':
              case 'image url':
              case 'imageurl':
                bookData.imageUrl = value?.toString().trim();
                break;
              case 'image_url_3':
              case 'image url 3':
              case 'imageurl3':
                bookData.imageUrl3 = value?.toString().trim();
                break;
            }
          });

          // Validate required fields
          if (!bookData.title) {
            throw new Error(`Row ${rowNumber}: Title is required`);
          }

          // If no author is provided, try to fetch from API using ISBN
          if (!bookData.author && bookData.isbn) {
            try {
              const coverData = await this.fetchBookCover(bookData.isbn);
              if (coverData && coverData.source === 'google') {
                // Try to extract author from Google Books API response
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${bookData.isbn}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.items && data.items[0] && data.items[0].volumeInfo) {
                    const volumeInfo = data.items[0].volumeInfo;
                    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
                      bookData.author = volumeInfo.authors.join(', ');
                    }
                    if (volumeInfo.publishedDate) {
                      const year = new Date(volumeInfo.publishedDate).getFullYear();
                      if (!isNaN(year)) {
                        bookData.publishedYear = year;
                      }
                    }
                    if (volumeInfo.publisher) {
                      bookData.publisher = volumeInfo.publisher;
                    }
                    if (volumeInfo.pageCount) {
                      bookData.pages = volumeInfo.pageCount;
                    }
                    if (volumeInfo.description) {
                      bookData.description = volumeInfo.description;
                    }
                  }
                }
              }
            } catch (error) {
              console.log(`Could not fetch additional data for ${bookData.isbn}`);
            }
          }

          // Set defaults for missing fields
          bookData.author = bookData.author || 'Unknown Author';
          bookData.price = bookData.price || 19.99;
          bookData.condition = bookData.condition || 'New';
          bookData.stock = bookData.stock || 10;
          bookData.language = bookData.language || 'English';
          bookData.description = bookData.description || `${bookData.title} - A comprehensive book in our collection.`;

          // ISBN uniqueness check (skip when updating an existing record by ID)
          if (bookData.isbn && !(bookData.id && bookData.id > 0)) {
            const normalizedIsbn = bookData.isbn.trim();
            if (seenIsbnSet.has(normalizedIsbn)) {
              throw new Error(`Row ${rowNumber}: Duplicate ISBN "${normalizedIsbn}" in this upload`);
            }
            if (existingIsbnSet.has(normalizedIsbn)) {
              throw new Error(`Row ${rowNumber}: ISBN "${normalizedIsbn}" already exists in the database`);
            }
            seenIsbnSet.add(normalizedIsbn);
          }

          // Get category ID - resolve from primary category or first of multi-category list
          let categoryId = 1; // Default to first category
          let resolvedCategoryIds: number[] = [];

          // Handle comma-separated multi-category column first
          if (bookData.categories) {
            const categoryNames = bookData.categories.split(',').map(s => s.trim().toLowerCase());
            for (const catName of categoryNames) {
              const foundId = categoryMap.get(catName);
              if (foundId) resolvedCategoryIds.push(foundId);
            }
          }

          // Fall back to single category column
          if (bookData.category) {
            const foundCategoryId = categoryMap.get(bookData.category.toLowerCase());
            if (foundCategoryId) {
              categoryId = foundCategoryId;
              if (!resolvedCategoryIds.includes(foundCategoryId)) {
                resolvedCategoryIds.push(foundCategoryId);
              }
            }
          } else if (resolvedCategoryIds.length > 0) {
            categoryId = resolvedCategoryIds[0];
          }

          // Resolve subcategory by name within parent category
          let subCategoryId: number | null = null;
          if (bookData.subcategory) {
            const subNormalized = bookData.subcategory.toLowerCase();
            const matchedSub = subcategoryMap.get(subNormalized);
            if (matchedSub) {
              // Optionally validate parent matches resolved categoryId
              if (!categoryId || matchedSub.categoryId === categoryId) {
                subCategoryId = matchedSub.id;
              } else {
                // Still use the subcategory even if parent differs
                subCategoryId = matchedSub.id;
              }
            }
          }

          // Fetch book cover image if ISBN is provided and no image URL already given
          let imageUrl = bookData.imageUrl || null;
          if (!imageUrl && bookData.isbn) {
            console.log(`Fetching cover for ISBN: ${bookData.isbn}`);
            const coverData = await this.fetchBookCover(bookData.isbn);
            if (coverData) {
              console.log(`Found cover from ${coverData.source} for ISBN: ${bookData.isbn}`);
              imageUrl = await this.downloadAndSaveImage(coverData.imageUrl, bookData.isbn);
              if (imageUrl) {
                console.log(`Downloaded and saved cover: ${imageUrl}`);
              }
            } else {
              console.log(`No cover found for ISBN: ${bookData.isbn}`);
            }
          }

          // Create book object
          const insertBook: InsertBook = {
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn || null,
            price: bookData.price.toString(),
            categoryId,
            subCategoryId,
            condition: bookData.condition || 'Good',
            binding: bookData.binding || 'No Binding',
            description: bookData.description || null,
            publisher: bookData.publisher || null,
            publishedYear: bookData.publishedYear || null,
            pages: bookData.pages || null,
            language: bookData.language || 'English',
            edition: bookData.edition || null,
            weight: bookData.weight != null ? bookData.weight.toString() : null,
            dimensions: bookData.dimensions || null,
            stock: bookData.stock || 1,
            featured: bookData.featured || false,
            bestseller: bookData.bestseller || false,
            trending: bookData.trending || false,
            newArrival: bookData.newArrival || false,
            boxSet: bookData.boxSet || false,
            isHidden: bookData.isHidden || false,
            costPrice: bookData.costPrice != null ? bookData.costPrice.toString() : null,
            imageUrl: imageUrl || null,
            imageUrl2: bookData.imageUrl2 || null,
            imageUrl3: bookData.imageUrl3 || null,
          };

          // Save to database — update if id present, otherwise create
          if (bookData.id && bookData.id > 0) {
            await storage.updateBook(bookData.id, insertBook);

            // Reassign multi-category via junction table
            if (resolvedCategoryIds.length > 0) {
              await storage.setBookCategories(bookData.id, resolvedCategoryIds);
            }

            results.success++;
            results.updated++;
            successRows.push({ rowNumber, action: 'updated', title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, category: bookData.category, subcategory: bookData.subcategory, condition: bookData.condition, binding: bookData.binding, stock: bookData.stock, publisher: bookData.publisher, publishedYear: bookData.publishedYear, language: bookData.language, imageUrl: insertBook.imageUrl ?? undefined, imageUrl2: insertBook.imageUrl2 ?? undefined, imageUrl3: insertBook.imageUrl3 ?? undefined });
            console.log(`✅ Successfully updated: ${bookData.title} by ${bookData.author} (ID: ${bookData.id})`);
          } else {
            const createdBook = await storage.createBook(insertBook);

            // Assign multi-category via junction table if multiple categories provided
            if (resolvedCategoryIds.length > 0) {
              await storage.setBookCategories(createdBook.id, resolvedCategoryIds);
            }

            results.success++;
            results.created++;
            successRows.push({ rowNumber, action: 'created', title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, category: bookData.category, subcategory: bookData.subcategory, condition: bookData.condition, binding: bookData.binding, stock: bookData.stock, publisher: bookData.publisher, publishedYear: bookData.publishedYear, language: bookData.language, imageUrl: insertBook.imageUrl ?? undefined, imageUrl2: insertBook.imageUrl2 ?? undefined, imageUrl3: insertBook.imageUrl3 ?? undefined });
            console.log(`✅ Successfully created: ${bookData.title} by ${bookData.author}`);
            console.log(`   Book ID: ${createdBook.id}, ISBN: ${bookData.isbn || 'N/A'}, Price: $${bookData.price}`);
          }

        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : `Row ${rowNumber}: Unknown error`;
          results.errors.push(errorMsg);
          failedRows.push({ rowNumber, title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, reason: errorMsg });
          console.error(`Failed to import row ${rowNumber}:`, error);
        }
      }

    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Import failed:', error);
    }

    return { ...results, reportBase64: BookImporter.buildReportExcel(successRows, failedRows).toString('base64') };
  }

  /**
   * Import books from an Excel file, using a pre-built image map from a ZIP bundle.
   * Images in the map take priority over URLs in the spreadsheet, which in turn take
   * priority over the automatic Google Books / OpenLibrary fetch.
   */
  static async importFromZip(
    excelPath: string,
    imageMap: Record<string, { slot1?: Buffer; slot2?: Buffer; slot3?: Buffer }>
  ): Promise<DetailedImportResult> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      created: 0,
      updated: 0,
      imagesFetched: 0,
      imagesNone: 0,
    };
    const successRows: SuccessRecord[] = [];
    const failedRows: FailedRecord[] = [];

    try {
      const ext = excelPath.split('.').pop()?.toLowerCase();
      const workbook = ext === 'csv'
        ? XLSX.readFile(excelPath, { type: 'file', raw: false })
        : XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const KNOWN_HEADERS = new Set(['id','title','author','isbn','price','cost price','category','categories',
        'subcategory','condition','binding','description','publisher','published year','pages','language',
        'edition','weight','dimensions','stock','featured','bestseller','trending','new arrival',
        'box set','hidden','image url','image url 2','image url 3']);
      const firstRowIsHeader = (data[0] as string[]).some(
        v => v && KNOWN_HEADERS.has(String(v).toLowerCase().trim())
      );
      const headerRowIndex = firstRowIsHeader ? 0 : 1;

      const headers = data[headerRowIndex] as string[];
      const rows = data.slice(headerRowIndex + 1) as any[][];

      const categories = await storage.getCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));

      const allSubcategories = await storage.getSubCategories();
      const subcategoryMap = new Map(allSubcategories.map(sub => [sub.name.toLowerCase(), sub]));

      // Preload existing ISBNs from DB for duplicate checking
      const { books: existingBooks } = await storage.getBooks({ limit: 100000, includeHidden: true, includeOutOfStock: true });
      const existingIsbnSet = new Set(existingBooks.filter(b => b.isbn).map(b => b.isbn!.trim()));
      const seenIsbnSet = new Set<string>(); // tracks ISBNs within this batch

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + headerRowIndex + 2;
        let bookData: BookRow = {};
        try {
          // Reuse the same header-mapping logic as importFromExcel
          bookData = {};
          headers.forEach((header, index) => {
            const value = row[index];
            const normalizedHeader = header.toLowerCase().trim();
            switch (normalizedHeader) {
              case 'id': bookData.id = parseInt(value) || undefined; break;
              case 'title': case 'name': bookData.title = value?.toString().trim(); break;
              case 'author': bookData.author = value?.toString().trim(); break;
              case 'isbn': case 'item code': case 'item_code': bookData.isbn = value?.toString().trim(); break;
              case 'price': case 'selling price': case 'selling_price': bookData.price = parseFloat(value) || 0; break;
              case 'cost price': case 'cost_price': case 'costprice': bookData.costPrice = parseFloat(value) || undefined; break;
              case 'category': bookData.category = value?.toString().trim(); break;
              case 'categories': bookData.categories = value?.toString().trim(); break;
              case 'subcategory': case 'sub_category': case 'sub category': bookData.subcategory = value?.toString().trim(); break;
              case 'condition': bookData.condition = value?.toString().trim() || 'Good'; break;
              case 'binding': bookData.binding = value?.toString().trim() || 'No Binding'; break;
              case 'description': bookData.description = value?.toString().trim(); break;
              case 'publisher': bookData.publisher = value?.toString().trim(); break;
              case 'published_year': case 'published year': case 'year': bookData.publishedYear = parseInt(value) || undefined; break;
              case 'pages': bookData.pages = parseInt(value) || undefined; break;
              case 'language': bookData.language = value?.toString().trim() || 'English'; break;
              case 'edition': bookData.edition = value?.toString().trim(); break;
              case 'weight': bookData.weight = parseFloat(value) || undefined; break;
              case 'dimensions': bookData.dimensions = value?.toString().trim(); break;
              case 'stock': case 'quantity': case 'qty': bookData.stock = parseInt(value) || 1; break;
              case 'featured': bookData.featured = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'bestseller': case 'best_seller': case 'best seller': bookData.bestseller = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'trending': bookData.trending = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'new_arrival': case 'new arrival': case 'newarrival': bookData.newArrival = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'box_set': case 'box set': case 'boxset': bookData.boxSet = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'hidden': case 'is_hidden': case 'is hidden': bookData.isHidden = value === true || value?.toString().toLowerCase() === 'yes' || value?.toString().toLowerCase() === 'true' || value === 1; break;
              case 'image_url': case 'image url': case 'imageurl': bookData.imageUrl = value?.toString().trim(); break;
              case 'image_url_2': case 'image url 2': case 'imageurl2': bookData.imageUrl2 = value?.toString().trim(); break;
              case 'image_url_3': case 'image url 3': case 'imageurl3': bookData.imageUrl3 = value?.toString().trim(); break;
            }
          });

          if (!bookData.title) {
            throw new Error(`Row ${rowNumber}: Title is required`);
          }

          bookData.author = bookData.author || 'Unknown Author';
          bookData.price = bookData.price || 19.99;
          bookData.condition = bookData.condition || 'New';
          bookData.stock = bookData.stock || 10;
          bookData.language = bookData.language || 'English';
          bookData.description = bookData.description || `${bookData.title} - A comprehensive book in our collection.`;

          // ISBN uniqueness check (skip when updating an existing record by ID)
          if (bookData.isbn && !(bookData.id && bookData.id > 0)) {
            const normalizedIsbn = bookData.isbn.trim();
            if (seenIsbnSet.has(normalizedIsbn)) {
              throw new Error(`Row ${rowNumber}: Duplicate ISBN "${normalizedIsbn}" in this upload`);
            }
            if (existingIsbnSet.has(normalizedIsbn)) {
              throw new Error(`Row ${rowNumber}: ISBN "${normalizedIsbn}" already exists in the database`);
            }
            seenIsbnSet.add(normalizedIsbn);
          }

          // Category resolution
          let categoryId = 1;
          let resolvedCategoryIds: number[] = [];
          if (bookData.categories) {
            for (const catName of bookData.categories.split(',').map(s => s.trim().toLowerCase())) {
              const foundId = categoryMap.get(catName);
              if (foundId) resolvedCategoryIds.push(foundId);
            }
          }
          if (bookData.category) {
            const foundCategoryId = categoryMap.get(bookData.category.toLowerCase());
            if (foundCategoryId) {
              categoryId = foundCategoryId;
              if (!resolvedCategoryIds.includes(foundCategoryId)) resolvedCategoryIds.push(foundCategoryId);
            }
          } else if (resolvedCategoryIds.length > 0) {
            categoryId = resolvedCategoryIds[0];
          }

          let subCategoryId: number | null = null;
          if (bookData.subcategory) {
            const matchedSub = subcategoryMap.get(bookData.subcategory.toLowerCase());
            if (matchedSub) subCategoryId = matchedSub.id;
          }

          const isbn = bookData.isbn;
          const bundle = isbn ? imageMap[isbn] : undefined;

          // --- Image slot 1 (imageUrl) ---
          let imageUrl: string | null = null;
          if (bundle?.slot1) {
            // Priority 1: image from ZIP
            imageUrl = await this.downloadAndSaveImageBuffer(bundle.slot1, isbn || `book-${rowNumber}`, 1);
          } else if (bookData.imageUrl) {
            // Priority 2: URL from Excel
            imageUrl = bookData.imageUrl;
          } else if (isbn) {
            // Priority 3: auto-fetch
            const coverData = await this.fetchBookCover(isbn);
            if (coverData) {
              imageUrl = await this.downloadAndSaveImage(coverData.imageUrl, isbn);
              if (imageUrl) results.imagesFetched++;
            }
          }
          if (!imageUrl) results.imagesNone++;

          // --- Image slot 2 (imageUrl2) ---
          let imageUrl2: string | null = bookData.imageUrl2 || null;
          if (bundle?.slot2) {
            imageUrl2 = await this.downloadAndSaveImageBuffer(bundle.slot2, isbn || `book-${rowNumber}`, 2);
          }

          // --- Image slot 3 (imageUrl3) ---
          let imageUrl3: string | null = bookData.imageUrl3 || null;
          if (bundle?.slot3) {
            imageUrl3 = await this.downloadAndSaveImageBuffer(bundle.slot3, isbn || `book-${rowNumber}`, 3);
          }

          const insertBook: InsertBook = {
            title: bookData.title,
            author: bookData.author,
            isbn: isbn || null,
            price: bookData.price.toString(),
            categoryId,
            subCategoryId,
            condition: bookData.condition || 'Good',
            binding: bookData.binding || 'No Binding',
            description: bookData.description || null,
            publisher: bookData.publisher || null,
            publishedYear: bookData.publishedYear || null,
            pages: bookData.pages || null,
            language: bookData.language || 'English',
            edition: bookData.edition || null,
            weight: bookData.weight != null ? bookData.weight.toString() : null,
            dimensions: bookData.dimensions || null,
            stock: bookData.stock || 1,
            featured: bookData.featured || false,
            bestseller: bookData.bestseller || false,
            trending: bookData.trending || false,
            newArrival: bookData.newArrival || false,
            boxSet: bookData.boxSet || false,
            isHidden: bookData.isHidden || false,
            costPrice: bookData.costPrice != null ? bookData.costPrice.toString() : null,
            imageUrl: imageUrl || null,
            imageUrl2: imageUrl2 || null,
            imageUrl3: imageUrl3 || null,
          };

          if (bookData.id && bookData.id > 0) {
            await storage.updateBook(bookData.id, insertBook);
            if (resolvedCategoryIds.length > 0) await storage.setBookCategories(bookData.id, resolvedCategoryIds);
            results.success++;
            results.updated++;
            successRows.push({ rowNumber, action: 'updated', title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, category: bookData.category, subcategory: bookData.subcategory, condition: bookData.condition, binding: bookData.binding, stock: bookData.stock, publisher: bookData.publisher, publishedYear: bookData.publishedYear, language: bookData.language, imageUrl: insertBook.imageUrl ?? undefined, imageUrl2: insertBook.imageUrl2 ?? undefined, imageUrl3: insertBook.imageUrl3 ?? undefined });
          } else {
            const createdBook = await storage.createBook(insertBook);
            if (resolvedCategoryIds.length > 0) await storage.setBookCategories(createdBook.id, resolvedCategoryIds);
            results.success++;
            results.created++;
            successRows.push({ rowNumber, action: 'created', title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, category: bookData.category, subcategory: bookData.subcategory, condition: bookData.condition, binding: bookData.binding, stock: bookData.stock, publisher: bookData.publisher, publishedYear: bookData.publishedYear, language: bookData.language, imageUrl: insertBook.imageUrl ?? undefined, imageUrl2: insertBook.imageUrl2 ?? undefined, imageUrl3: insertBook.imageUrl3 ?? undefined });
          }
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : `Row ${rowNumber}: Unknown error`;
          results.errors.push(errorMsg);
          failedRows.push({ rowNumber, title: bookData.title, author: bookData.author, isbn: bookData.isbn, price: bookData.price, reason: errorMsg });
        }
      }
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
    }

    return { ...results, reportBase64: BookImporter.buildReportExcel(successRows, failedRows).toString('base64') };
  }

  static buildReportExcel(successRows: SuccessRecord[], failedRows: FailedRecord[]): Buffer {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Success
    const successData = successRows.map(r => ({
      'Row #': r.rowNumber,
      'Action': r.action === 'created' ? 'Created' : 'Updated',
      'Title': r.title || '',
      'Author': r.author || '',
      'ISBN': r.isbn || '',
      'Price': r.price ?? '',
      'Category': r.category || '',
      'Subcategory': r.subcategory || '',
      'Condition': r.condition || '',
      'Binding': r.binding || '',
      'Stock': r.stock ?? '',
      'Publisher': r.publisher || '',
      'Published Year': r.publishedYear ?? '',
      'Language': r.language || '',
      'Image URL': r.imageUrl || '',
      'Image URL 2': r.imageUrl2 || '',
      'Image URL 3': r.imageUrl3 || '',
    }));
    const ws1 = XLSX.utils.json_to_sheet(successData.length > 0 ? successData : [{ 'Note': 'No books were imported successfully' }]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Import Success');

    // Sheet 2: Failed
    const failedData = failedRows.map(r => ({
      'Row #': r.rowNumber,
      'Title': r.title || '',
      'Author': r.author || '',
      'ISBN': r.isbn || '',
      'Price': r.price ?? '',
      'Failure Reason': r.reason,
    }));
    const ws2 = XLSX.utils.json_to_sheet(failedData.length > 0 ? failedData : [{ 'Note': 'No failures' }]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Import Failed');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private static async downloadAndSaveImageBuffer(
    buffer: Buffer,
    isbn: string,
    slot: number
  ): Promise<string | null> {
    try {
      const uploadResult = await CloudinaryService.uploadImage(
        buffer,
        'a2z-bookshop/books',
        `book-${isbn}-slot${slot}-${Date.now()}`
      );
      return uploadResult.secure_url;
    } catch (error) {
      console.error(`Failed to upload ZIP image for ${isbn} slot ${slot}:`, error);
      return null;
    }
  }
}