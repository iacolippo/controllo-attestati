import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface FieldDefinition {
  name: string;
  description?: string;
  type?: string;
}

function buildJsonSchema(fields: FieldDefinition[]) {
  const properties: Record<string, object> = {};
  const required: string[] = [];

  for (const field of fields) {
    const prop: Record<string, unknown> = {};
    const fieldType = field.type || "string";

    switch (fieldType) {
      case "number":
        prop.type = "number";
        break;
      case "boolean":
        prop.type = "boolean";
        break;
      case "date":
        prop.type = "string";
        prop.description = (field.description ? field.description + ". " : "") + "Format: DD/MM/YYYY";
        properties[field.name] = prop;
        required.push(field.name);
        continue;
      case "array":
        prop.type = "array";
        prop.items = { type: "string" };
        break;
      default:
        prop.type = "string";
    }

    if (field.description) {
      prop.description = field.description;
    }

    properties[field.name] = prop;
    required.push(field.name);
  }

  return {
    type: "object" as const,
    properties,
    required,
    additionalProperties: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, fields, apiKey } = body as {
      images: string[];
      fields: FieldDefinition[];
      apiKey: string;
    };

    if (!apiKey) {
      return NextResponse.json(
        { error: "Paradigm API key is required" },
        { status: 400 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: "No fields defined" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://paradigm.lighton.ai/api/v2",
    });

    const imageMessages: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
      images.map((img) => ({
        type: "image_url" as const,
        image_url: { url: img },
      }));

    const response = await client.chat.completions.create({
      model: "alfred-ft5",
      messages: [
        {
          role: "system",
          content:
            "You are a document data extraction assistant. Extract the requested fields from the document images provided. Be precise and accurate. If a field cannot be found, use an empty string for text, 0 for numbers, false for booleans, or an empty array for arrays.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following fields from this document:",
            },
            ...imageMessages,
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extraction",
          strict: true,
          schema: buildJsonSchema(fields),
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    const usage = response.usage
      ? {
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
        }
      : null;

    return NextResponse.json({ result: JSON.parse(content), usage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
