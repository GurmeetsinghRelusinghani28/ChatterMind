import React, { useContext, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import { getWebContainer } from "../config/webContainer";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const isFileNode = (node) => {
  return node && node.file && typeof node.file.contents === "string";
};

const isFolderNode = (node) => {
  return node && typeof node === "object" && !node.file;
};

// Resolve nested file using path like "src/components/App.jsx"
const getFileByPath = (tree, path) => {
  if (!tree || !path) return null;

  return path.split("/").reduce((acc, part) => {
    if (!acc) return null;
    return acc[part];
  }, tree);
};


const Project = () => {
  const location = useLocation();

  const projectId = location.state?.project?._id;

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectType, setProjectType] = useState("html");
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("js");
  const [errors, setErrors] = useState([]);

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  function WriteAiMessage(message) {
    let messageObject;

    try {
      messageObject =
        typeof message === "string" ? JSON.parse(message) : message;
    } catch (error) {
      console.error("Invalid JSON:", message);
      return <p>Error processing AI message</p>;
    }

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={messageObject.text || ""}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  const send = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
    setMessage("");
  };

  useEffect(() => {
    const socket = initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log("Container Started");
      });
    }

    receiveMessage("project-message", (data) => {
      console.log("Received data:", data);

      if (data.sender._id === "ai") {
        const message =
          typeof data.message === "string"
            ? JSON.parse(data.message)
            : data.message;

        console.log("Parsed message:", message);

        if (message.fileTree) {
          webContainer?.mount(message.fileTree);
          setFileTree(message.fileTree || {});
        }

        setMessages((prevMessages) => [...prevMessages, data]);
      } else {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        console.log("Full Response:", res.data);
        setProject(res.data);
        // Ensure fileTree is always an object, even if undefined
        setFileTree(res.data.fileTree || {});

        if (res.data.fileTree) {
          detectProjectType(res.data.fileTree);
        }
      })
      .catch((err) => {
        console.log(err);
        // Set empty fileTree on error
        setFileTree({});
      });

    axios
      .get("users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  function detectProjectType(fileTree) {
    const files = Object.keys(fileTree);

    if (files.some((f) => f.includes("package.json"))) {
      const packageJson = fileTree["package.json"]?.file?.contents;
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson);
          if (pkg.dependencies?.react || pkg.devDependencies?.react) {
            setProjectType("react");
          } else {
            setProjectType("node");
          }
        } catch (e) {
          setProjectType("node");
        }
      }
    } else if (files.some((f) => f.includes(".html"))) {
      setProjectType("html");
    } else {
      setProjectType("unknown");
    }
  }

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: location.state.project._id,
        fileTree: ft,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // function addCollaborators() {
  //   console.log("Adding collaborators:", Array.from(selectedUserId));
  //   setIsModalOpen(false);
  // }

  // In Project.jsx frontend
  function addCollaborators() {
    const collaborators = Array.from(selectedUserId);

    console.log("Payload →", {
      projectId: project._id,
      users: collaborators,
    });

    if (collaborators.length === 0) {
      alert("Please select at least one user");
      return;
    }

    axios
      .put("/projects/addusers", {
        projectId: project._id,
        users: Array.from(selectedUserId), // ✅ MATCHES BACKEND
      })
      .then((res) => {
        console.log("SUCCESS:", res.data);

        if (res.data.project) {
          setProject(res.data.project);
        }

        setIsModalOpen(false);
        setSelectedUserId(new Set());

        alert(`Added ${res.data.addedCount} collaborators!`);
      })
      .catch((err) => {
        console.error("BACKEND ERROR:", err.response?.data);
        alert(err.response?.data?.message || "Failed to add collaborators");
      });
  }

  function scrollToBottom() {
    messageBox.current.scrollTop = messageBox.current.scrollHeight;
  }

  const addConsoleOutput = (type, message) => {
    setConsoleOutput((prev) => [
      ...prev,
      { type, message, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  // Function to generate HTML content from fileTree
  const generateHtmlContent = () => {
    if (!fileTree || !fileTree["index.html"]) {
      addConsoleOutput("error", "index.html file not found");
      return "";
    }

    // Get HTML content
    let htmlContent = fileTree["index.html"]?.file?.contents || "";

    // Get CSS content if exists
    const cssContent = fileTree["style.css"]?.file?.contents || "";

    // Get JS content if exists
    const jsContent = fileTree["script.js"]?.file?.contents || "";

    // Create a complete HTML document
    let finalHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Preview</title>
        <style>
            ${cssContent}
        </style>
    </head>
    <body>
    `;

    // Extract just the body content from the HTML
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      finalHtml += bodyMatch[1];
    } else {
      finalHtml += htmlContent;
    }

    // Add JavaScript
    if (jsContent) {
      finalHtml += `
        <script>
            try {
                ${jsContent}
            } catch (error) {
                console.error("Runtime Error:", error);
            }
        </script>
        `;
    }

    finalHtml += `
    </body>
    </html>
    `;

    return finalHtml;
  };

  // Function to create data URL for iframe
  const createDataUrl = () => {
    const htmlContent = generateHtmlContent();
    if (!htmlContent) return null;

    const blob = new Blob([htmlContent], { type: "text/html" });
    return URL.createObjectURL(blob);
  };

  const runProject = async () => {
    if (!webContainer || !fileTree) {
      addConsoleOutput("error", "WebContainer not ready yet or no files");
      return;
    }

    setIsLoading(true);
    setConsoleOutput([]);
    setErrors([]);

    try {
      // Mount the file tree
      await webContainer.mount(fileTree);

      // Determine project type and run accordingly
      if (projectType === "html") {
        const dataUrl = createDataUrl();
        if (dataUrl) {
          setIframeUrl(dataUrl);
          addConsoleOutput("success", "HTML project loaded successfully");
        }
      } else if (projectType === "node") {
        // Install dependencies
        addConsoleOutput("info", "Installing dependencies...");
        const installProcess = await webContainer.spawn("npm", ["install"]);

        installProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              addConsoleOutput("info", chunk);
            },
          }),
        );

        await installProcess.exit;

        // Start the server
        addConsoleOutput("info", "Starting server...");
        if (runProcess) runProcess.kill();

        const tempRunProcess = await webContainer.spawn("npm", ["start"]);

        tempRunProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              addConsoleOutput("info", chunk);
            },
          }),
        );

        setRunProcess(tempRunProcess);

        webContainer.on("server-ready", (port, url) => {
          setIframeUrl(url);
          addConsoleOutput("success", `Server started on ${url}`);
        });
      } else if (projectType === "react") {
        addConsoleOutput("info", "Installing dependencies...");

        const installProcess = await webContainer.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              addConsoleOutput("info", chunk);
            },
          }),
        );
        await installProcess.exit;

        addConsoleOutput("info", "Starting Vite dev server...");

        if (runProcess) runProcess.kill();

        const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

        devProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              addConsoleOutput("info", chunk);
            },
          }),
        );

        setRunProcess(devProcess);

        webContainer.on("server-ready", (port, url) => {
          console.log("React server ready:", url);
          setIframeUrl(url);
          addConsoleOutput("success", `React app running at ${url}`);
        });
      }

      setIsPreviewModalOpen(true);
    } catch (error) {
      addConsoleOutput("error", `Error: ${error.message}`);
      setErrors((prev) => [...prev, error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  const openPreviewModal = () => {
    runProject();
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (runProcess) {
      runProcess.kill();
      setRunProcess(null);
    }
    if (iframeUrl && iframeUrl.startsWith("blob:")) {
      URL.revokeObjectURL(iframeUrl);
      setIframeUrl(null);
    }
  };

  const createNewFile = () => {
    if (!newFileName.trim()) {
      addConsoleOutput("error", "Please enter a file name");
      return;
    }

    const fileName = newFileName.includes(".")
      ? newFileName
      : `${newFileName}.${newFileType}`;

    if (fileTree[fileName]) {
      addConsoleOutput("error", `File "${fileName}" already exists`);
      return;
    }

    let defaultContent = "";
    switch (newFileType) {
      case "js":
        defaultContent = "// JavaScript file\nconsole.log('Hello World!');";
        break;
      case "jsx":
        defaultContent =
          "// React component\nimport React from 'react';\n\nexport default function Component() {\n  return (\n    <div>\n      <h1>New Component</h1>\n    </div>\n  );\n}";
        break;
      case "css":
        defaultContent =
          "/* CSS file */\nbody {\n  margin: 0;\n  padding: 0;\n}";
        break;
      case "html":
        defaultContent =
          "<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>New HTML File</h1>\n</body>\n</html>";
        break;
      case "json":
        defaultContent = '{\n  "name": "new-file"\n}';
        break;
      default:
        defaultContent = "";
    }

    const newFileTree = {
      ...fileTree,
      [fileName]: {
        file: {
          contents: defaultContent,
        },
      },
    };

    setFileTree(newFileTree);
    saveFileTree(newFileTree);
    setNewFileName("");
    setIsCreateFileModalOpen(false);
    addConsoleOutput("success", `File "${fileName}" created successfully`);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isPreviewModalOpen) {
        closePreviewModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPreviewModalOpen]);

  //   const renderFileTree = (tree, parentPath = "") => {
  //   return Object.entries(tree).map(([name, node]) => {
  //     const currentPath = `${parentPath}/${name}`;

  //     // ✅ FILE
  //     if (isFileNode(node)) {
  //       return (
  //         <div
  //           key={currentPath}
  //           className="file-item"
  //           onClick={() => setSelectedFile({
  //             path: currentPath,
  //             contents: node.file.contents
  //           })}
  //         >
  //           📄 {name}
  //         </div>
  //       );
  //     }

  //     // 📁 FOLDER → recurse
  //     if (isFolderNode(node)) {
  //       return (
  //         <div key={currentPath} className="folder-item">
  //           <div className="folder-name">📁 {name}</div>
  //           <div className="folder-children">
  //             {renderFileTree(node, currentPath)}
  //           </div>
  //         </div>
  //       );
  //     }

  //     return null;
  //   });
  // };

 const renderFileTree = (tree, parentPath = "") => {
  if (!tree || typeof tree !== "object") return null;

  return Object.entries(tree).map(([name, node]) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    // 📄 FILE
    if (node?.file?.contents !== undefined) {
      return (
        <div
          key={fullPath}
          onClick={() => {
            setCurrentFile(fullPath);
            setOpenFiles((prev) => {
              const s = new Set(prev);
              s.add(fullPath);
              return Array.from(s);
            });
          }}
          className={`file cursor-pointer p-2 hover:bg-slate-700 rounded flex items-center gap-2 ${
            currentFile === fullPath ? "bg-slate-600" : ""
          }`}
        >
          <i
            className={`ri-${
              name.endsWith(".js") || name.endsWith(".jsx")
                ? "javascript-line text-yellow-400"
                : name.endsWith(".html")
                ? "html5-line text-orange-500"
                : name.endsWith(".css")
                ? "css3-line text-blue-400"
                : name.endsWith(".json")
                ? "settings-line text-green-400"
                : "file-line text-gray-400"
            }`}
          ></i>
          <p className="truncate">{name}</p>
        </div>
      );
    }

    // 📁 FOLDER
    if (typeof node === "object") {
      return (
        <div key={fullPath} className="ml-2">
          <div className="text-gray-400 flex items-center gap-2 p-1">
            <i className="ri-folder-line text-yellow-500"></i>
            <span className="text-sm">{name}</span>
          </div>
          <div className="ml-3">
            {renderFileTree(node, fullPath)}
          </div>
        </div>
      );
    }

    return null;
  });
};

const activeFileNode = getFileByPath(fileTree, currentFile);



  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add collaborator</p>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
          <div
            ref={messageBox}
            className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide"
          >
            {messages?.map((msg, index) => (
              <div
                key={`message-${index}`}
                className={`${
                  msg?.sender?._id === "ai" ? "max-w-80" : "max-w-52"
                } ${
                  msg?.sender?._id == user?._id?.toString() && "ml-auto"
                } message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}
              >
                <small className="opacity-65 text-xs">
                  {msg?.sender?.email}
                </small>
                <div className="text-sm">
                  {msg?.sender?._id === "ai" ? (
                    WriteAiMessage(msg?.message)
                  ) : (
                    <p>{msg?.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="inputField w-full flex absolute bottom-0">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 mt-2 bg-slate-100 rounded-b-sm px-4 border-none outline-none flex-grow"
              type="text"
              placeholder="Enter message"
            />
            <button onClick={send} className="px-5 bg-slate-950 text-white">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        <div
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          } top-0`}
        >
          <header className="flex justify-between items-center px-4 p-2 bg-slate-200">
            <h1 className="font-semibold text-lg">Collaborators</h1>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-2"
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2">
            {project.users &&
              project.users.map((user, index) => {
                return (
                  <div
                    key={`collaborator-${user._id || index}`}
                    className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center"
                  >
                    <div className="aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                      <i className="ri-user-fill absolute"></i>
                    </div>
                    <h1 className="font-semibold text-lg">{user.email}</h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section className="right flex flex-grow h-screen">
        <div className="explorer h-full max-w-64 min-w-52 bg-slate-800 text-white flex flex-col">
          <div className="p-3 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-semibold">Explorer</h2>
            <button
              onClick={() => setIsCreateFileModalOpen(true)}
              className="p-1 px-2 bg-green-600 rounded hover:bg-green-700"
              title="Create New File"
            >
              <i className="ri-add-line"></i>
            </button>
          </div>
          <div className="file-tree w-full flex-grow overflow-auto p-2">
            {fileTree && Object.keys(fileTree).length > 0 ? (
              renderFileTree(fileTree)
            ) : (
              <div className="text-gray-400 text-center p-4">
                <i className="ri-folder-open-line text-2xl mb-2 block"></i>
                <p>No files yet</p>
                <p className="text-sm mt-1">Create a file to get started</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  projectType === "react"
                    ? "bg-blue-500"
                    : projectType === "node"
                      ? "bg-green-500"
                      : projectType === "html"
                        ? "bg-orange-500"
                        : "bg-gray-500"
                }`}
              ></div>
              <span className="capitalize">{projectType} Project</span>
            </div>
          </div>
        </div>
        

        <div className="code-editor flex flex-col flex-grow h-full shrink">
          <div className="top flex flex-row fle-grow cursor-pointer justify-between w-full p-2 bg-slate-900 text-white">
            <div className="files flex">
              {openFiles.map((file, index) => (
                <div
                  key={`open-file-${file}-${index}`}
                  className={`file-tab p-3 hover:bg-slate-700 flex justify-between items-center gap-2 cursor-pointer ${
                    currentFile === file ? "bg-slate-800" : "bg-slate-900"
                  }`}
                  onClick={() => setCurrentFile(file)}
                >
                  <span className="font-medium">{file}</span>

                  {/* Close icon (NOT a button) */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation(); // prevents parent click
                      setOpenFiles((prev) => prev.filter((f) => f !== file));

                      if (currentFile === file) {
                        setCurrentFile(openFiles[index - 1] || null);
                      }
                    }}
                    className="hover:text-red-400 cursor-pointer"
                  >
                    <i className="ri-close-line"></i>
                  </span>
                </div>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={openPreviewModal}
                disabled={isLoading || !webContainer}
                className="p-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Running...
                  </>
                ) : (
                  <>
                    <i className="ri-play-circle-fill"></i>
                    Run & Preview
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
            {activeFileNode?.file ? (
  <div className="code-editor-area h-full overflow-auto flex-grow bg-gray-900 text-white">
    <pre className="hljs h-full">
      <code
        className="hljs h-full outline-none"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const updatedContent = e.target.innerText;

          const updatedTree = structuredClone(fileTree);
          const fileRef = getFileByPath(updatedTree, currentFile);

          if (fileRef?.file) {
            fileRef.file.contents = updatedContent;
            setFileTree(updatedTree);
            saveFileTree(updatedTree);
          }
        }}
        dangerouslySetInnerHTML={{
          __html: hljs.highlight(
            currentFile.endsWith(".css")
              ? "css"
              : currentFile.endsWith(".js") || currentFile.endsWith(".jsx")
              ? "javascript"
              : currentFile.endsWith(".html")
              ? "html"
              : currentFile.endsWith(".json")
              ? "json"
              : "plaintext",
            activeFileNode.file.contents || ""
          ).value,
        }}
        style={{
          whiteSpace: "pre-wrap",
          paddingBottom: "25rem",
        }}
      />
    </pre>
  </div>
) : (
  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
    <div className="text-center">
      <i className="ri-file-text-line text-4xl mb-2"></i>
      <p>Select a file to edit or create a new one</p>
    </div>
  </div>
)}

          </div>
        </div>
      </section>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">
                  Preview - {projectType.toUpperCase()} Project
                </h2>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    isLoading ? "bg-yellow-500" : "bg-green-500"
                  }`}
                >
                  {isLoading ? "Loading..." : "Live"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => runProject()}
                  className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  title="Restart"
                >
                  <i className="ri-restart-line"></i>
                </button>
                <button
                  onClick={closePreviewModal}
                  className="p-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  <i className="ri-close-line mr-1"></i>
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-grow overflow-hidden">
              {/* Console Output */}
              <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="p-3 bg-gray-800 text-white flex justify-between items-center">
                  <h3 className="font-semibold">Console Output</h3>
                  <button
                    onClick={() => setConsoleOutput([])}
                    className="text-sm p-1 px-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-grow overflow-auto bg-black p-3 font-mono text-sm">
                  {consoleOutput.length === 0 ? (
                    <div className="text-gray-500 italic">No output yet...</div>
                  ) : (
                    consoleOutput.map((output, index) => (
                      <div
                        key={`console-${index}`}
                        className={`mb-1 ${
                          output.type === "error"
                            ? "text-red-400"
                            : output.type === "success"
                              ? "text-green-400"
                              : "text-gray-300"
                        }`}
                      >
                        <span className="text-gray-500 text-xs">
                          [{output.timestamp}]{" "}
                        </span>
                        {output.message}
                      </div>
                    ))
                  )}
                </div>

                {/* Errors Section */}
                {errors.length > 0 && (
                  <div className="border-t border-red-800">
                    <div className="p-3 bg-red-900/30 text-white flex justify-between items-center">
                      <h3 className="font-semibold text-red-300">Errors</h3>
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        {errors.length}
                      </span>
                    </div>
                    <div className="p-3 bg-red-900/10 overflow-auto max-h-32">
                      {errors.map((error, index) => (
                        <div
                          key={`error-${index}`}
                          className="text-red-300 text-sm mb-1"
                        >
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Area */}
              <div className="flex-grow flex flex-col">
                {iframeUrl ? (
                  <div className="flex-grow relative">
                    <iframe
                      id="preview-iframe"
                      src={iframeUrl}
                      className="w-full h-full border-0"
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                    />
                    <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm opacity-75">
                      <i className="ri-eye-line mr-1"></i>
                      {projectType === "react"
                        ? "React App"
                        : projectType === "node"
                          ? "Node.js Server"
                          : "HTML Preview"}
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <i className="ri-error-warning-line text-4xl text-yellow-500 mb-2"></i>
                      <p className="text-gray-400">Preview not available</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Check console for errors
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {isCreateFileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-gray-800 p-6 rounded-lg w-96 max-w-full border border-gray-700">
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Create New File
              </h2>
              <button
                onClick={() => setIsCreateFileModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <i className="ri-close-fill"></i>
              </button>
            </header>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="example.js"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">File Type</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="js">JavaScript (.js)</option>
                  <option value="jsx">React Component (.jsx)</option>
                  <option value="html">HTML (.html)</option>
                  <option value="css">CSS (.css)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>

              <div className="bg-gray-900 p-3 rounded text-sm text-gray-400">
                <div className="flex items-center gap-2 mb-1">
                  <i className="ri-information-line"></i>
                  <span>File will be created in project root</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-information-line"></i>
                  <span>Template code will be generated automatically</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCreateFileModalOpen(false)}
                className="flex-1 p-3 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                className="flex-1 p-3 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
              {users.map((user) => (
                <div
                  key={`modal-user-${user._id}`}
                  className={`user cursor-pointer hover:bg-slate-200 ${
                    Array.from(selectedUserId).indexOf(user._id) != -1
                      ? "bg-slate-200"
                      : ""
                  } p-2 flex gap-2 items-center`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;


