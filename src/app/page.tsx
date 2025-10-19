'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Loader2, CheckCircle2, Mail } from 'lucide-react';

export default function EmailShortener() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.html')) {
        setError('Please select an HTML file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleShorten = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const htmlContent = await file.text();

      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URLs');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.modifiedHtml) return;

    const element = document.createElement('a');
    const file = new Blob([result.modifiedHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'shortened-email.html';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Email URL Shortener</h1>
          </div>
          <p className="text-slate-300">Optimize your emails by shortening all URLs. Reduce file size for better deliverability.</p>
        </div>

        {/* Upload Card - Only show if no results */}
        {!result && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Upload Email Template</CardTitle>
              <CardDescription>Select an HTML email file to shorten all URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mb-3">
                  <Mail className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Drag and drop your HTML file here</p>
                  <p className="text-slate-400 text-sm">or click to browse</p>
                </div>
                {file && (
                  <p className="text-blue-400 text-sm font-medium">{file.name}</p>
                )}
              </div>

              {error && (
                <Alert className="mt-4 bg-red-900 border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleShorten}
                disabled={!file || loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Shorten URLs'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Dashboard - Only show if results exist */}
        {result && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">{result.stats.urlsShortened} Links Found</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scrollable Links List */}
              <div className="bg-slate-700 rounded-lg p-4 max-h-80 overflow-y-auto space-y-3">
                {result.replacements.map((replacement: Replacement, idx: number) => (
                  <div key={idx} className="text-sm">
                    <p className="text-slate-300 break-all truncate">{replacement.originalUrl}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400">→</span>
                      <p className="text-blue-400 break-all truncate">{replacement.shortUrl}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Modified HTML
              </Button>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                }}
                variant="outline"
                className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              >
                Process Another File
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}