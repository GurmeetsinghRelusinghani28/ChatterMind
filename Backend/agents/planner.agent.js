import { getJSONModel } from "../utils/llm.util.js";
import { PLANNER_PROMPT } from "../utils/prompts.js";
import { retry } from "../utils/retry.util.js";

export const plannerAgent = async (userPrompt) => {
  const model = getJSONModel();

  return retry(async () => {
    const result = await model.generateContent(`
${PLANNER_PROMPT}

USER REQUEST:
${userPrompt}
`);
    return JSON.parse(result.response.text());
  });
};
