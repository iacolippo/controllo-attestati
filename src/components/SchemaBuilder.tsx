"use client";

import { useState, useEffect } from "react";

export interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface SavedSchema {
  name: string;
  fields: FieldDefinition[];
}

interface SchemaBuilderProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

const FIELD_TYPES = ["string", "number", "boolean", "array", "date"];
const STORAGE_KEY = "saved_schemas";

function getSavedSchemas(): SavedSchema[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedSchemas(schemas: SavedSchema[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
}

export default function SchemaBuilder({ fields, onChange }: SchemaBuilderProps) {
  const [savedSchemas, setSavedSchemasState] = useState<SavedSchema[]>([]);

  useEffect(() => {
    setSavedSchemasState(getSavedSchemas());
  }, []);

  const addField = () => {
    onChange([...fields, { name: "", description: "", type: "string" }]);
  };

  const updateField = (
    index: number,
    key: keyof FieldDefinition,
    value: string
  ) => {
    const updated = fields.map((f, i) =>
      i === index ? { ...f, [key]: value } : f
    );
    onChange(updated);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const saveSchema = () => {
    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) return;

    const name = prompt("Schema name:");
    if (!name?.trim()) return;

    const schemas = getSavedSchemas();
    const existing = schemas.findIndex((s) => s.name === name.trim());
    if (existing >= 0) {
      schemas[existing].fields = validFields;
    } else {
      schemas.push({ name: name.trim(), fields: validFields });
    }
    setSavedSchemas(schemas);
    setSavedSchemasState(schemas);
  };

  const loadSchema = (name: string) => {
    const schema = savedSchemas.find((s) => s.name === name);
    if (schema) onChange(schema.fields);
  };

  const deleteSchema = (name: string) => {
    const schemas = getSavedSchemas().filter((s) => s.name !== name);
    setSavedSchemas(schemas);
    setSavedSchemasState(schemas);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Output Schema</h2>
        <div className="flex items-center gap-2">
          {savedSchemas.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) loadSchema(e.target.value);
                  e.target.value = "";
                }}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Load saved...
                </option>
                {savedSchemas.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const name = prompt(
                    "Delete which schema?\n\n" +
                      savedSchemas.map((s) => `• ${s.name}`).join("\n")
                  );
                  if (name?.trim()) deleteSchema(name.trim());
                }}
                className="text-red-400 hover:text-red-600 p-1 text-sm"
                title="Delete a saved schema"
              >
                &times;
              </button>
            </div>
          )}
          <button
            onClick={saveSchema}
            className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Save Schema
          </button>
          <button
            onClick={addField}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Field
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">
          No fields defined yet. Click &quot;Add Field&quot; to start.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div
              key={i}
              className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-md p-3"
            >
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Field name *"
                  value={field.name}
                  onChange={(e) => updateField(i, "name", e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={field.description}
                  onChange={(e) =>
                    updateField(i, "description", e.target.value)
                  }
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(i, "type", e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeField(i)}
                className="text-red-400 hover:text-red-600 p-1 text-lg leading-none"
                title="Remove field"
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
