import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  function createProject(e) {
  e.preventDefault();
  
  if (!projectName.trim()) {
    setError("Project name is required");
    return;
  }
  
  setLoading(true);
  setError(null);

  axios
    .post("/projects/create", {
      name: projectName,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => {
      console.log("Project created response:", res.data);
      
      if (res.data && res.data.project) {
        setIsModalOpen(false);
        setProjectName("");
        
        // Add the new project to the list
        setProjects(prevProjects => [res.data.project, ...prevProjects]);
      } else {
        setError("Unexpected response from server");
      }
    })
    .catch((error) => {
      console.error("Error creating project:", error);
      
      if (error.response) {
        // Server responded with error status
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        if (error.response.data && error.response.data.errors) {
          // Validation errors from express-validator
          const validationErrors = error.response.data.errors
            .map(err => err.msg)
            .join(', ');
          setError(validationErrors);
        } else {
          setError(error.response.data?.message || "Failed to create project");
        }
      } else if (error.request) {
        // Request was made but no response
        setError("No response from server. Check if backend is running.");
      } else {
        // Something else happened
        setError(error.message || "Failed to create project");
      }
    })
    .finally(() => {
      setLoading(false);
    });
}

  useEffect(() => {
    fetchProjects();
  }, []);

  function fetchProjects() {
    axios
      .get("/projects/all")
      .then((res) => {
        console.log("Projects fetched:", res.data);
        setProjects(res.data.projects || []);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      });
  }

  return (
    <main className="p-4">
      <div className="projects flex flex-wrap gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="project p-4 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          disabled={loading}
        >
          {loading ? "Creating..." : "New Project"}
          <i className="ri-link ml-2"></i>
        </button>

        {projects.length === 0 ? (
          <div className="text-gray-500 mt-4">
            No projects yet. Create your first project!
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project._id}
              onClick={() => {
                navigate(`/project`, {
                  state: { project },
                });
              }}
              className="project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-200 transition-colors"
            >
              <h2 className="font-semibold text-lg">{project.name}</h2>
              <div className="flex gap-2 text-sm text-gray-600">
                <i className="ri-user-line"></i>
                <span>{project.users?.length || 0} collaborators</span>
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={createProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setError(null);
                  }}
                  value={projectName}
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project name"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProjectName("");
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !projectName.trim()}
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;