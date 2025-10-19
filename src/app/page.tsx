'use client';

import { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Stack,
} from '@mui/material';
import { CloudUpload, Download, CheckCircle, Mail } from '@mui/icons-material';

interface Replacement {
  originalUrl: string;
  shortUrl: string;
  code: string;
}

interface ShortenResult {
  success: boolean;
  modifiedHtml: string;
  replacements: Replacement[];
  stats: {
    urlsShortened: number;
  };
}

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            mb: 5,
            animation: 'fadeIn 0.6s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-20px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Mail
              sx={{
                fontSize: 48,
                background: 'linear-gradient(135deg, #1976d2 0%, #0288d1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #1976d2 0%, #0288d1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              Email URL Shortener
            </Typography>
          </Box>

          <Box
            sx={{
              height: 4,
              width: 60,
              background: 'linear-gradient(90deg, #1976d2 0%, #0288d1 100%)',
              mx: 'auto',
              borderRadius: 2,
              mb: 2,
            }}
          />

          <Typography
            variant="body1"
            color="textSecondary"
            sx={{
              fontSize: '1.05rem',
              maxWidth: 500,
              mx: 'auto',
              fontWeight: 500,
            }}
          >
            Shorten your URLs here! (Saved in a DB so the link will always point to the same place)
          </Typography>
        </Box>

        {!result && (
          <Paper sx={{ p: 4, mb: 2 }}>
            <Box
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: '#1976d2',
                  bgcolor: '#f0f7ff',
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <CloudUpload sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Drag and drop your HTML file here
              </Typography>
              <Typography variant="body2" color="textSecondary">
                or click to browse
              </Typography>
              {file && (
                <Typography variant="body2" sx={{ mt: 2, color: '#1976d2', fontWeight: 'bold' }}>
                  {file.name}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleShorten}
              disabled={!file || loading}
              sx={{ mt: 3 }}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Processing...' : 'Shorten URLs'}
            </Button>
          </Paper>
        )}

        {result && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CheckCircle sx={{ color: 'success.main' }} />
                <Typography variant="h5">
                  {result.stats.urlsShortened} Links Found
                </Typography>
              </Box>

              <Box
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 300,
                  overflowY: 'auto',
                  mb: 3,
                }}
              >
                <Stack spacing={2}>
                  {result.replacements.map((replacement: Replacement, idx: number) => (
                    <Box key={idx}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }} color="textSecondary">
                        {replacement.originalUrl}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography sx={{ color: '#666' }}>→</Typography>
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: 'break-all', color: '#1976d2', fontWeight: 'bold' }}
                        >
                          {replacement.shortUrl}
                        </Typography>
                      </Box>
                      {idx < result.replacements.length - 1 && <Box sx={{ borderTop: '1px solid #ddd', mt: 1 }} />}
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleDownload}
                  startIcon={<Download />}
                >
                  Download Modified HTML
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setError(null);
                  }}
                >
                  Process Another File
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}