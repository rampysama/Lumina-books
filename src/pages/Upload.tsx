import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Upload as UploadIcon, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractMetadataFromImage } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setStatus('');
    }
  };

  const processFile = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('Reading PDF...');
    setError(null);

    const path = 'books';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) throw new Error('Could not get canvas context');

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      setStatus('AI is analyzing the cover...');
      const metadata = await extractMetadataFromImage(base64Image);

      setStatus('Cataloging the volume...');
      
      const bookData = {
        ...metadata,
        thumbnail: canvas.toDataURL('image/jpeg', 0.5),
        userId: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        fileName: file.name,
        fileSize: file.size,
        pageCount: pdf.numPages,
      };

      await addDoc(collection(db, path), bookData);

      setStatus('Success! The volume has been cataloged.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Processing failed', err);
      if (err.message && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      setError(err.message || 'Failed to process book. Please try another file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-serif font-bold text-sepia-900">Add to the Collection</h1>
        <p className="text-xl text-sepia-800/60 font-serif italic">Upload your digital volumes and let AI curate your sanctuary.</p>
      </div>

      <div className="rounded-2xl border-4 border-dashed border-sepia-200 bg-white p-16 text-center shadow-sm transition-all hover:border-book-green/50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer space-y-6"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-sepia-50 text-book-green shadow-inner">
              <UploadIcon className="h-10 w-10" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold text-sepia-900">Select a PDF Volume</p>
              <p className="text-sepia-800/60 font-serif italic">Click to browse or drag your file here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-sepia-50 text-book-green shadow-inner">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold text-sepia-900">{file.name}</p>
              <p className="text-sepia-800/60 font-serif italic">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            
            {!loading && !status.includes('Success') && (
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => setFile(null)}
                  className="rounded-md border-2 border-sepia-200 px-10 py-3 font-bold text-sepia-800 hover:bg-sepia-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={processFile}
                  className="rounded-md bg-book-green px-12 py-3 font-bold text-white shadow-lg hover:bg-opacity-90 transition-all"
                >
                  Catalog Volume
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-10 flex flex-col items-center gap-6">
            <Loader2 className="h-10 w-10 animate-spin text-book-green" />
            <p className="text-lg font-serif font-bold text-book-green italic">{status}</p>
          </div>
        )}

        {!loading && status.includes('Success') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-col items-center gap-4 text-book-green"
          >
            <CheckCircle2 className="h-12 w-12" />
            <p className="text-2xl font-serif font-bold">{status}</p>
            <button 
              onClick={() => setStatus('')}
              className="mt-4 text-sm font-bold underline underline-offset-4 hover:text-sepia-900 transition-colors"
            >
              Catalog another volume
            </button>
          </motion.div>
        )}

        {error && (
          <div className="mt-10 flex flex-col items-center gap-4 text-book-red">
            <AlertCircle className="h-12 w-12" />
            <p className="text-lg font-serif font-bold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
