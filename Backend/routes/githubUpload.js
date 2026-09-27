import { Router } from "express";
import { Octokit } from "@octokit/rest";

const router = Router();

const getToken = (req) => req.cookies.github_access_token || req.body.token;

router.post("/upload-project", async (req, res) => {
  const { repoName, files } = req.body;
  const token = getToken(req);

  if (!token || !repoName || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "repoName and a non-empty files array are required" });
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(repoName)) {
    return res.status(400).json({ error: "Repository name contains invalid characters" });
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: repository } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      auto_init: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    const owner = user.login;
    const { data: ref } = await octokit.rest.git.getRef({ owner, repo: repoName, ref: "heads/main" });
    const baseCommitSha = ref.object.sha;
    const { data: baseCommit } = await octokit.rest.git.getCommit({ owner, repo: repoName, commit_sha: baseCommitSha });
    const baseTreeSha = baseCommit.tree?.sha;
    if (!baseTreeSha) {
      throw new Error("GitHub did not return a base tree for the initialized repository");
    }

    const tree = await Promise.all(files.map(async ({ path, content }) => {
      if (typeof path !== "string" || typeof content !== "string") {
        throw new Error("Each file must contain string path and content values");
      }
      const normalizedPath = path.replace(/^\/+/, "");
      if (!normalizedPath || normalizedPath.split("/").includes("..")) {
        throw new Error("File paths must stay inside the repository");
      }

      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo: repoName,
        content: Buffer.from(content, "utf8").toString("base64"),
        encoding: "base64",
      });
      return { path: normalizedPath, mode: "100644", type: "blob", sha: blob.sha };
    }));

    const { data: createdTree } = await octokit.rest.git.createTree({
      owner,
      repo: repoName,
      base_tree: baseTreeSha,
      tree,
    });
    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo: repoName,
      message: "Export project from AiChatApplication",
      tree: createdTree.sha,
      parents: [baseCommitSha],
    });
    await octokit.rest.git.updateRef({ owner, repo: repoName, ref: "heads/main", sha: commit.sha });

    return res.status(201).json({ repositoryUrl: repository.html_url, commitSha: commit.sha });
  } catch (error) {
    console.error("GitHub project upload failed:", error);
    const status = error.status === 401 ? 401 : error.status === 422 ? 422 : 502;
    return res.status(status).json({ error: error.message || "GitHub upload failed" });
  }
});

export default router;