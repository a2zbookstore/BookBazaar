import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BookImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiRequest('/api/admin/import-books', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.success} books. ${result.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import books",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      setImportProgress(0);
      importMutation.mutate(selectedFile);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Books</h1>
          <p className="text-gray-600 mt-2">
            Upload an Excel file to bulk import books with automatic cover image fetching
          </p>
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Upload your Excel file with book data
                </p>
                <label className="inline-block">
                  <Button variant="outline" className="cursor-pointer">
                    Choose Excel File
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Selected: {selectedFile.name}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {selectedFile && (
              <Button 
                onClick={handleImport} 
                className="w-full"
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importing..." : "Import Books"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Expected Format Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Excel File Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">Required columns:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>title</strong> - Book title</li>
                <li><strong>author</strong> - Book author</li>
                <li><strong>price</strong> - Book price (numeric)</li>
              </ul>
              
              <p className="font-medium mt-4">Optional columns:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>isbn</strong> - ISBN for automatic cover image fetching</li>
                <li><strong>category</strong> - Book category</li>
                <li><strong>condition</strong> - Book condition (New, Like New, Very Good, Good)</li>
                <li><strong>description</strong> - Book description</li>
                <li><strong>publisher</strong> - Publisher name</li>
                <li><strong>published_year</strong> - Publication year</li>
                <li><strong>pages</strong> - Number of pages</li>
                <li><strong>language</strong> - Book language (default: English)</li>
                <li><strong>stock</strong> - Stock quantity (default: 1)</li>
                <li><strong>featured</strong> - Featured book (true/false)</li>
              </ul>
              
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Image Fetching:</strong> When ISBN is provided, the system will automatically 
                  fetch book cover images from Google Books API and Open Library.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Import Progress */}
        {importMutation.isPending && (
          <Card>
            <CardHeader>
              <CardTitle>Import Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  Processing books and fetching cover images...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">{importResult.success}</p>
                  <p className="text-sm text-green-600">Books Imported</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">{importResult.failed}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Errors:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}