"use client";

export interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface SchemaBuilderProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

const FIELD_TYPES = ["string", "number", "boolean", "array"];

export default function SchemaBuilder({ fields, onChange }: SchemaBuilderProps) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Output Schema</h2>
        <button
          onClick={addField}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Field
        </button>
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
