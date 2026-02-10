import { getJSONModel } from "../utils/llm.util.js";
import { CODER_PROMPT } from "../utils/prompts.js";

export const coderAgent = async (plan) => {
  const model = getJSONModel();

  const combinedPrompt = `
${CODER_PROMPT}

PLAN:
${JSON.stringify(plan, null, 2)}
`;

  const result = await model.generateContent(combinedPrompt);
  return JSON.parse(result.response.text());
};
