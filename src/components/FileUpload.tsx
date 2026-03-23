"use client";

import { useCallback, useRef, useState } from "react";

export interface DocumentFile {
  name: string;
  images: string[];
}

interface FileUploadProps {
  onDocumentsReady: (docs: DocumentFile[]) => void;
  documents: DocumentFile[];
}

export default function FileUpload({
  onDocumentsReady,
  documents,
}: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convertPdfToImages = useCallback(async (file: File) => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL("image/png"));
    }

    return images;
  }, []);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setLoading(true);
      try {
        const newDocs: DocumentFile[] = [];

        for (const file of Array.from(fileList)) {
          if (file.type === "application/pdf") {
            const images = await convertPdfToImages(file);
            newDocs.push({ name: file.name, images });
          } else if (file.type.startsWith("image/")) {
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            newDocs.push({ name: file.name, images: [dataUrl] });
          }
        }

        if (newDocs.length > 0) {
          onDocumentsReady([...documents, ...newDocs]);
        }
      } catch {
        alert("Failed to process one or more files.");
      } finally {
        setLoading(false);
      }
    },
    [convertPdfToImages, onDocumentsReady, documents]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeDocument = (index: number) => {
    onDocumentsReady(documents.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        {loading ? (
          <div className="text-blue-600">
            <svg
              className="animate-spin h-8 w-8 mx-auto mb-2"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing files...
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-1">
              Drop PDFs or images here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Select multiple files at once or add more later
            </p>
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="mt-3 space-y-1">
          {documents.map((doc, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm"
            >
              <span className="text-gray-700">
                {doc.name}{" "}
                <span className="text-gray-400">
                  ({doc.images.length} page{doc.images.length !== 1 ? "s" : ""})
                </span>
              </span>
              <button
                onClick={() => removeDocument(i)}
                className="text-red-400 hover:text-red-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
