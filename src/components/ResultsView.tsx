"use client";

import * as XLSX from "xlsx";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface DocumentResult {
  name: string;
  result?: Record<string, unknown>;
  error?: string;
  usage?: TokenUsage | null;
}

interface ResultsViewProps {
  results: DocumentResult[];
}

function formatValue(value: unknown): string | number | boolean {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean" || typeof value === "number") return value;
  return String(value ?? "");
}

function exportToExcel(results: DocumentResult[]) {
  const successResults = results.filter((r) => r.result);
  if (successResults.length === 0) return;

  const rows = successResults.map((doc) => {
    const row: Record<string, string | number | boolean> = { "File": doc.name };
    for (const [key, value] of Object.entries(doc.result!)) {
      row[key] = formatValue(value);
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, "extraction-results.xlsx");
}

export default function ResultsView({ results }: ResultsViewProps) {
  const hasResults = results.some((r) => r.result);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Extraction Results</h2>
        {hasResults && (
          <button
            onClick={() => exportToExcel(results)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Export Excel
          </button>
        )}
      </div>
      <div className="space-y-4">
        {results.map((doc, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 font-medium text-sm text-gray-700">
              {doc.name}
            </div>
            {doc.error ? (
              <div className="px-4 py-3 text-sm text-red-600 bg-red-50">
                {doc.error}
              </div>
            ) : doc.result ? (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        Field
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(doc.result).map(([key, value]) => (
                      <tr
                        key={key}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-2 font-medium text-gray-700">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {doc.usage && (
                  <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                    <span>Input tokens: <span className="font-medium text-gray-700">{doc.usage.input_tokens.toLocaleString()}</span></span>
                    <span>Output tokens: <span className="font-medium text-gray-700">{doc.usage.output_tokens.toLocaleString()}</span></span>
                    <span>Total: <span className="font-medium text-gray-700">{(doc.usage.input_tokens + doc.usage.output_tokens).toLocaleString()}</span></span>
                  </div>
                )}
                <div className="px-4 py-2 border-t border-gray-100">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Raw JSON
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded-md overflow-auto text-xs">
                      {JSON.stringify(doc.result, null, 2)}
                    </pre>
                  </details>
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
