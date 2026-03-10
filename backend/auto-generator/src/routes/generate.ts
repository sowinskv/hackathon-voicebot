import express, { Request, Response } from 'express';
import { query } from '../db';
import { analyzeTranscript, extractKeyInsights } from '../transcript-analyzer';
import { generateFlowFromPattern, optimizeFlow, generateFlowVisualization } from '../flow-generator';
import { generateSystemPrompt, generateValidationRules, formatPromptForDeployment } from '../prompt-generator';
import {
  analyzeConversationHistory,
  generateImprovementSuggestions,
  compareFlowVersions,
  suggestNextSteps,
} from '../improvement-suggester';

const router = express.Router();

// Analyze transcript and extract patterns
router.post('/analyze/:transcriptId', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.params;

    // Fetch transcript
    const result = await query('SELECT * FROM transcripts WHERE id = $1', [transcriptId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const transcript = result.rows[0].transcript;

    console.log('Analyzing transcript...');
    const [pattern, insights] = await Promise.all([
      analyzeTranscript(transcript),
      extractKeyInsights(transcript),
    ]);

    // Save analysis to database
    await query(
      `INSERT INTO transcript_analysis (transcript_id, pattern, insights, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (transcript_id) DO UPDATE
       SET pattern = $2, insights = $3, created_at = NOW()`,
      [transcriptId, JSON.stringify(pattern), JSON.stringify(insights)]
    );

    res.json({
      success: true,
      pattern,
      insights,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze transcript',
      details: error.message,
    });
  }
});

// Generate flow diagram from pattern
router.post('/flow/:transcriptId', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.params;
    const { projectName, optimize } = req.body;

    // Fetch analysis
    const analysisResult = await query(
      'SELECT pattern FROM transcript_analysis WHERE transcript_id = $1',
      [transcriptId]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found. Please analyze the transcript first.' });
    }

    const pattern = analysisResult.rows[0].pattern;

    console.log('Generating flow diagram...');
    let flow = await generateFlowFromPattern(pattern, projectName);

    if (optimize) {
      console.log('Optimizing flow...');
      flow = await optimizeFlow(flow);
    }

    const visualization = generateFlowVisualization(flow);

    // Save flow to database
    await query(
      `INSERT INTO generated_flows (transcript_id, flow_data, visualization, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [transcriptId, JSON.stringify(flow), visualization]
    );

    res.json({
      success: true,
      flow,
      visualization,
    });
  } catch (error: any) {
    console.error('Flow generation error:', error);
    res.status(500).json({
      error: 'Failed to generate flow',
      details: error.message,
    });
  }
});

// Generate system prompt
router.post('/prompt/:transcriptId', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.params;
    const { projectName, includeValidation } = req.body;

    // Fetch analysis
    const analysisResult = await query(
      'SELECT pattern FROM transcript_analysis WHERE transcript_id = $1',
      [transcriptId]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found. Please analyze the transcript first.' });
    }

    const pattern = analysisResult.rows[0].pattern;

    console.log('Generating system prompt...');
    const systemPrompt = await generateSystemPrompt(pattern, projectName);

    let validationRules = {};
    if (includeValidation) {
      console.log('Generating validation rules...');
      validationRules = await generateValidationRules(pattern);
    }

    const formattedPrompt = formatPromptForDeployment(systemPrompt);

    // Save prompt to database
    await query(
      `INSERT INTO generated_prompts (transcript_id, prompt_data, formatted_prompt, validation_rules, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [transcriptId, JSON.stringify(systemPrompt), formattedPrompt, JSON.stringify(validationRules)]
    );

    res.json({
      success: true,
      systemPrompt,
      formattedPrompt,
      validationRules,
    });
  } catch (error: any) {
    console.error('Prompt generation error:', error);
    res.status(500).json({
      error: 'Failed to generate prompt',
      details: error.message,
    });
  }
});

// Generate everything (full wizard)
router.post('/wizard/:transcriptId', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.params;
    const { projectName, optimize } = req.body;

    // Fetch transcript
    const transcriptResult = await query('SELECT * FROM transcripts WHERE id = $1', [transcriptId]);

    if (transcriptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const transcript = transcriptResult.rows[0].transcript;

    console.log('Starting full generation wizard...');

    // Step 1: Analyze
    console.log('Step 1/4: Analyzing transcript...');
    const [pattern, insights] = await Promise.all([
      analyzeTranscript(transcript),
      extractKeyInsights(transcript),
    ]);

    await query(
      `INSERT INTO transcript_analysis (transcript_id, pattern, insights, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (transcript_id) DO UPDATE
       SET pattern = $2, insights = $3, created_at = NOW()`,
      [transcriptId, JSON.stringify(pattern), JSON.stringify(insights)]
    );

    // Step 2: Generate flow
    console.log('Step 2/4: Generating flow diagram...');
    let flow = await generateFlowFromPattern(pattern, projectName);

    if (optimize) {
      console.log('Optimizing flow...');
      flow = await optimizeFlow(flow);
    }

    const visualization = generateFlowVisualization(flow);

    await query(
      `INSERT INTO generated_flows (transcript_id, flow_data, visualization, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [transcriptId, JSON.stringify(flow), visualization]
    );

    // Step 3: Generate prompt
    console.log('Step 3/4: Generating system prompt...');
    const systemPrompt = await generateSystemPrompt(pattern, projectName);
    const formattedPrompt = formatPromptForDeployment(systemPrompt);

    // Step 4: Generate validation rules
    console.log('Step 4/4: Generating validation rules...');
    const validationRules = await generateValidationRules(pattern);

    await query(
      `INSERT INTO generated_prompts (transcript_id, prompt_data, formatted_prompt, validation_rules, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [transcriptId, JSON.stringify(systemPrompt), formattedPrompt, JSON.stringify(validationRules)]
    );

    console.log('Wizard complete!');

    res.json({
      success: true,
      data: {
        pattern,
        insights,
        flow,
        visualization,
        systemPrompt,
        formattedPrompt,
        validationRules,
      },
    });
  } catch (error: any) {
    console.error('Wizard error:', error);
    res.status(500).json({
      error: 'Failed to complete generation wizard',
      details: error.message,
    });
  }
});

// Analyze conversation history and suggest improvements
router.post('/improvements/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { includeFlow, includePrompt } = req.body;

    console.log('Analyzing conversation history...');
    const analytics = await analyzeConversationHistory(projectId);

    let currentFlow = null;
    let currentPrompt = null;

    if (includeFlow) {
      const flowResult = await query(
        'SELECT flow_data FROM generated_flows WHERE transcript_id IN (SELECT id FROM transcripts WHERE project_id = $1) ORDER BY created_at DESC LIMIT 1',
        [projectId]
      );
      if (flowResult.rows.length > 0) {
        currentFlow = flowResult.rows[0].flow_data;
      }
    }

    if (includePrompt) {
      const promptResult = await query(
        'SELECT prompt_data FROM generated_prompts WHERE transcript_id IN (SELECT id FROM transcripts WHERE project_id = $1) ORDER BY created_at DESC LIMIT 1',
        [projectId]
      );
      if (promptResult.rows.length > 0) {
        currentPrompt = promptResult.rows[0].prompt_data;
      }
    }

    console.log('Generating improvement suggestions...');
    const [suggestions, nextSteps] = await Promise.all([
      generateImprovementSuggestions(analytics, currentFlow, currentPrompt),
      suggestNextSteps(projectId, analytics),
    ]);

    // Save suggestions to database
    await query(
      `INSERT INTO improvement_suggestions (project_id, analytics, suggestions, next_steps, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [projectId, JSON.stringify(analytics), JSON.stringify(suggestions), JSON.stringify(nextSteps)]
    );

    res.json({
      success: true,
      analytics,
      suggestions,
      nextSteps,
    });
  } catch (error: any) {
    console.error('Improvements analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze improvements',
      details: error.message,
    });
  }
});

// Compare two flow versions
router.post('/compare-flows', async (req: Request, res: Response) => {
  try {
    const { oldFlowId, newFlowId } = req.body;

    const [oldFlowResult, newFlowResult] = await Promise.all([
      query('SELECT flow_data FROM generated_flows WHERE id = $1', [oldFlowId]),
      query('SELECT flow_data FROM generated_flows WHERE id = $1', [newFlowId]),
    ]);

    if (oldFlowResult.rows.length === 0 || newFlowResult.rows.length === 0) {
      return res.status(404).json({ error: 'One or both flows not found' });
    }

    const comparison = await compareFlowVersions(
      oldFlowResult.rows[0].flow_data,
      newFlowResult.rows[0].flow_data
    );

    res.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('Flow comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare flows',
      details: error.message,
    });
  }
});

// Get generation history
router.get('/history/:transcriptId', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.params;

    const [analysis, flows, prompts] = await Promise.all([
      query('SELECT * FROM transcript_analysis WHERE transcript_id = $1', [transcriptId]),
      query('SELECT id, created_at, visualization FROM generated_flows WHERE transcript_id = $1 ORDER BY created_at DESC', [transcriptId]),
      query('SELECT id, created_at FROM generated_prompts WHERE transcript_id = $1 ORDER BY created_at DESC', [transcriptId]),
    ]);

    res.json({
      success: true,
      analysis: analysis.rows[0] || null,
      flows: flows.rows,
      prompts: prompts.rows,
    });
  } catch (error: any) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch generation history',
      details: error.message,
    });
  }
});

export default router;
