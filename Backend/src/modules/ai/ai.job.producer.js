export async function enqueueProjectGenerationJob({ projectId, prompt, userId }) {
  return {
    id: `job_${Date.now()}`,
    type: "generate-project",
    status: "queued",
    data: {
      projectId,
      prompt,
      userId,
    },
  };
}
