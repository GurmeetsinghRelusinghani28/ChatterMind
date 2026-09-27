/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "../config/axios";

const flattenFileTree = (tree, parentPath = "") => {
  return Object.entries(tree || {}).flatMap(([name, node]) => {
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (typeof node?.file?.contents === "string") {
      return [{ path, content: node.file.contents }];
    }
    return node && typeof node === "object" ? flattenFileTree(node, path) : [];
  });
};

const GithubExportButton = ({ fileTree, defaultRepoName = "aichatapplication-project" }) => {
  const [connected, setConnected] = useState(false);
  const [repoName, setRepoName] = useState(defaultRepoName);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Remove old callback tokens from the address bar. The current flow uses an HttpOnly cookie.
    if (params.has("github_token") || params.has("github_connected")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    axios.get("/api/github/status", { withCredentials: true })
      .then(({ data }) => setConnected(Boolean(data.connected)))
      .catch(() => setConnected(false));
  }, []);

  const connectGithub = () => {
    window.location.assign(`${apiUrl}/api/github/login`);
  };

  const uploadProject = async () => {
    const files = flattenFileTree(fileTree);
    if (!repoName.trim() || files.length === 0) {
      setError("Enter a repository name and add at least one file first.");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/github/upload-project", {
        repoName: repoName.trim(),
        files,
      }, { withCredentials: true });
      window.alert(`Repository created successfully: ${data.repositoryUrl}`);
    } catch (uploadError) {
      if (uploadError.response?.status === 401) setConnected(false);
      setError(uploadError.response?.data?.error || "Unable to export project to GitHub.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-b border-slate-700 p-3 space-y-2">
      {!connected ? (
        <button
          type="button"
          onClick={connectGithub}
          className="w-full rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
        >
          🔗 Connect GitHub Account
        </button>
      ) : (
        <>
          <input
            value={repoName}
            onChange={(event) => setRepoName(event.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white outline-none"
            placeholder="Repository name"
            aria-label="GitHub repository name"
          />
          <button
            type="button"
            onClick={uploadProject}
            disabled={isUploading}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading Code..." : "🚀 Export Project to GitHub"}
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
};

export default GithubExportButton;