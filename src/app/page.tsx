"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import FileUpload, { DocumentFile } from "@/components/FileUpload";
import SchemaBuilder, { FieldDefinition } from "@/components/SchemaBuilder";
import ResultsView, { DocumentResult } from "@/components/ResultsView";

function Home() {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("paradigm_api_key") || "");
  }, []);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([
    { name: "Nome Cognome", description: "Nome completo della persona ricevente l'attestato", type: "string" },
    { name: "Luogo di Nascita", description: "Luogo di nascita della persona", type: "string" },
    { name: "Data di Nascita", description: "Data di nascita della persona", type: "string" },
    { name: "Nome del corso", description: "Nome del corso frequentato", type: "string" },
  ]);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("paradigm_api_key", key);
  };

  const handleDocumentsReady = useCallback((docs: DocumentFile[]) => {
    setDocuments(docs);
    setResults([]);
    setError(null);
  }, []);

  const handleExtract = async () => {
    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      setError("Please define at least one field with a name.");
      return;
    }
    if (documents.length === 0) {
      setError("Please upload at least one document.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please enter your Paradigm API key.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: documents.length });

    const allResults: DocumentResult[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      setProgress({ current: i + 1, total: documents.length });

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: doc.images,
            fields: validFields,
            apiKey: apiKey.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          allResults.push({ name: doc.name, error: data.error || "Extraction failed" });
        } else {
          allResults.push({ name: doc.name, result: data.result });
        }
      } catch {
        allResults.push({ name: doc.name, error: "Network error" });
      }

      setResults([...allResults]);
    }

    setLoading(false);
  };

  const canExtract =
    documents.length > 0 &&
    fields.some((f) => f.name.trim()) &&
    apiKey.trim() &&
    !loading;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Controllo Attestati</h1>
        <a
          href="https://lighton.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 transition-all duration-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-500">Powered by</span>
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-violet-500 transition-all">
            LightOn – Paradigm
          </span>
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
          </svg>
        </a>
      </div>

      <div className="space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paradigm API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Your Paradigm API key"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Stored locally in your browser. Never sent to our servers.
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documents
          </label>
          <FileUpload
            onDocumentsReady={handleDocumentsReady}
            documents={documents}
          />
        </div>

        {/* Schema Builder */}
        <SchemaBuilder fields={fields} onChange={setFields} />

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={!canExtract}
          className="w-full bg-green-600 text-white py-2.5 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              Extracting {progress.current}/{progress.total}...
            </span>
          ) : (
            `Extract Data${documents.length > 1 ? ` (${documents.length} files)` : ""}`
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && <ResultsView results={results} />}
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });
