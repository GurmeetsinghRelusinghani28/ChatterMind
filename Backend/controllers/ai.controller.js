import * as ai from '../services/ai.service.js';
import * as generatorService from "../services/generator.service.js";
import * as projectService from '../services/project.service.js';


export const getResult = async (req, res) => {
    try{
        const {prompt} = req.query;
        if(!prompt){
            return res.status(400).json({error: 'Input is required'});
        }
        const result = await ai.generateResult(prompt);
        res.status(200).json({result});
    }
    catch(error){
        res.status(500).json({error: error.message});
    }
    
}

export const generateProject = async (req, res) => {
  try {
    const { prompt, projectId } = req.body;

    if (!prompt || !projectId) {
      return res.status(400).json({ error: "prompt and projectId are required" });
    }

    const { fileTree } = await generatorService.generateProjectFileTree(prompt);

    const project = await projectService.updateFileTree({
      projectId,
      fileTree
    });

    return res.status(200).json({
      message: "Project generated successfully",
      project
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};