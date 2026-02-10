import { getJSONModel } from "../utils/llm.util.js";
import { REVIEWER_PROMPT } from "../utils/prompts.js";

function extractJSON(text) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("❌ No JSON object found in reviewer response");
  }

  return text.slice(firstBrace, lastBrace + 1);
}

export const reviewerAgent = async (fileTree) => {
  const model = getJSONModel();

  const combinedPrompt = `
${REVIEWER_PROMPT}

IMPORTANT:
- Convert output into THIS exact JSON format:

{
  "index.html": { "file": { "contents": "..." } },
  "style.css": { "file": { "contents": "..." } },
  "script.js": { "file": { "contents": "..." } }
}

NO arrays.
NO flattenedFiles.
NO markdown.
PURE JSON ONLY.

INPUT FILES:
${JSON.stringify(fileTree, null, 2)}
`;

  const result = await model.generateContent(combinedPrompt);

  const raw = result.response.text();
  console.log("RAW REVIEWER OUTPUT:\n", raw);

  return JSON.parse(raw);
};
