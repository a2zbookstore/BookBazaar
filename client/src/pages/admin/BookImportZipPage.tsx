import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  FileArchive,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  Globe,
  ImageOff,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface ZipImportResult {
  success: number;
  failed: number;
  errors: string[];
  created: number;
  updated: number;
  imagesFromZip: number;
  imagesFetched: number;
  imagesNone: number;
  reportBase64: string;
}

function downloadReport(base64: string, filename: string) {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BookImportZipPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ZipImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/import-books-zip", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Import failed");
      }
      return res.json() as Promise<ZipImportResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Import complete",
        description: `${data.success} books imported, ${data.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      toast({
        title: "Invalid file",
        description: "Please select a .zip file",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      toast({ title: "Invalid file", description: "Please drop a .zip file", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Import Books (ZIP Bundle)</h1>
          <p className="text-sm text-gray-600 mt-2">
            Upload a .zip file containing your Excel spreadsheet and book images
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              ZIP Bundle Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-700">
                Drag &amp; drop your .zip file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">Maximum size: 100 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-green-800 truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button
              onClick={() => selectedFile && importMutation.mutate(selectedFile)}
              className="w-full"
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing... (this may take a while)" : "Import Books"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        {importMutation.isPending && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Progress value={undefined} className="w-full animate-pulse" />
              <p className="text-sm text-gray-500 text-center">
                Extracting ZIP, parsing Excel, uploading images to Cloudinary…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Books summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-800">{result.success}</p>
                  <p className="text-xs text-green-600">Imported</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-800">{result.created}</p>
                  <p className="text-xs text-blue-600">Created</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-800">{result.updated}</p>
                  <p className="text-xs text-purple-600">Updated</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-800">{result.failed}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              {/* Image summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-3">
                  <ImageIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{result.imagesFromZip}</p>
                    <p className="text-xs text-gray-500">From ZIP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-3">
                  <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{result.imagesFetched}</p>
                    <p className="text-xs text-gray-500">Auto-fetched</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-3">
                  <ImageOff className="h-5 w-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{result.imagesNone}</p>
                    <p className="text-xs text-gray-500">No image</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Errors ({result.errors.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Report */}
              {result.reportBase64 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadReport(result.reportBase64, `import-report-${Date.now()}.xlsx`)}
                >
                  Download Import Report (.xlsx)
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* How-to guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              How to prepare your ZIP bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create a folder and put your <strong>books.xlsx</strong> file inside.</li>
              <li>
                Add image files named after the ISBN of each book:
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-gray-500">
                  <li><code className="bg-gray-100 px-1 rounded">9780143127550.jpg</code> — primary image (imageUrl)</li>
                  <li><code className="bg-gray-100 px-1 rounded">9780143127550_2.jpg</code> — second image (imageUrl2)</li>
                  <li><code className="bg-gray-100 px-1 rounded">9780143127550_3.jpg</code> — third image (imageUrl3)</li>
                </ul>
              </li>
              <li>Supported formats: <strong>.jpg, .jpeg, .png, .webp</strong></li>
              <li>Select the entire folder, right-click → "Send to" → "Compressed (zipped) folder", then upload here.</li>
            </ol>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Images in the ZIP take priority over URLs in the Excel. If no image is provided for a
                book, the system automatically fetches one from Google Books or Open Library using the ISBN.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
    </div>
  );
}
