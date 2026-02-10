import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../config/axios";
import { getWebContainer } from "../config/webContainer";

const Preview = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [webContainer, setWebContainer] = useState(null);
  const [runProcess, setRunProcess] = useState(null);

  useEffect(() => {
    let container;

    async function startPreview() {
      try {
        // 1️⃣ Get project data
        const res = await axios.get(`/projects/get-project/${id}`);
        const fileTree = res.data.fileTree;

        // 2️⃣ Boot web container
        container = await getWebContainer();
        setWebContainer(container);

        // 3️⃣ Mount project files
        await container.mount(fileTree);

        // 4️⃣ Install dependencies
        const install = await container.spawn("npm", ["install"]);
        await install.exit;

        // 5️⃣ Stop old process if exists
        if (runProcess) runProcess.kill();

        // 6️⃣ Start project
        const start = await container.spawn("npm", ["start"]);
        setRunProcess(start);

        // 7️⃣ Listen for preview URL
        container.on("server-ready", (port, url) => {
          setIframeUrl(url);
          setLoading(false);
        });
      } catch (err) {
        console.error("Preview error:", err);
        setLoading(false);
      }
    }

    startPreview();

    return () => {
      if (container && runProcess) {
        runProcess.kill();
      }
    };
  }, [id]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-900 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <h1 className="font-semibold text-lg">Live Preview</h1>

        {iframeUrl && (
          <button
            onClick={() => setIframeUrl(iframeUrl)}
            className="px-4 py-1 bg-blue-600 rounded-md"
          >
            Reload
          </button>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-grow bg-black">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Starting preview...
          </div>
        )}

        {iframeUrl && (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-none"
            title="Project Preview"
          />
        )}
      </div>
    </div>
  );
};

export default Preview;
