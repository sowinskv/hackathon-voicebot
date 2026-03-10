import { Router, Request, Response } from 'express';
import { query } from '../db';
import { AppError, asyncHandler } from '../middleware/error';

const router = Router();

interface Flow {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  language: 'pl' | 'en';
  system_prompt: string;
  flow_definition: any;
  required_fields: any[];
  validation_rules?: any;
  created_by?: string;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// GET /api/flows - List all flows
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, language, limit = 100, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM flows WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (language) {
      queryText += ` AND language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }

    queryText += ` ORDER BY updated_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query<Flow>(queryText, params);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
    });
  })
);

// GET /api/flows/:id - Get single flow
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query<Flow>('SELECT * FROM flows WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// POST /api/flows - Create new flow
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      description,
      language = 'pl',
      system_prompt,
      flow_definition,
      required_fields,
      validation_rules,
      status = 'draft',
    } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    if (!system_prompt) {
      throw new AppError('System prompt is required', 400);
    }

    if (!required_fields || !Array.isArray(required_fields)) {
      throw new AppError('Required fields must be an array', 400);
    }

    const result = await query<Flow>(
      `
      INSERT INTO flows (
        name, description, language, system_prompt,
        flow_definition, required_fields, validation_rules, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        name,
        description || null,
        language,
        system_prompt,
        JSON.stringify(flow_definition || {}),
        JSON.stringify(required_fields),
        JSON.stringify(validation_rules || {}),
        status,
      ]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// PUT /api/flows/:id - Update flow
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      description,
      system_prompt,
      flow_definition,
      required_fields,
      validation_rules,
      status,
      language,
    } = req.body;

    // Check if flow exists
    const existingFlow = await query('SELECT id, status FROM flows WHERE id = $1', [id]);

    if (existingFlow.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (system_prompt !== undefined) {
      updates.push(`system_prompt = $${paramCount}`);
      params.push(system_prompt);
      paramCount++;
    }

    if (flow_definition !== undefined) {
      updates.push(`flow_definition = $${paramCount}`);
      params.push(JSON.stringify(flow_definition));
      paramCount++;
    }

    if (required_fields !== undefined) {
      if (!Array.isArray(required_fields)) {
        throw new AppError('Required fields must be an array', 400);
      }
      updates.push(`required_fields = $${paramCount}`);
      params.push(JSON.stringify(required_fields));
      paramCount++;
    }

    if (validation_rules !== undefined) {
      updates.push(`validation_rules = $${paramCount}`);
      params.push(JSON.stringify(validation_rules));
      paramCount++;
    }

    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        throw new AppError('Invalid status', 400);
      }
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;

      // If publishing, set published_at
      if (status === 'published' && existingFlow.rows[0].status !== 'published') {
        updates.push(`published_at = NOW()`);
      }
    }

    if (language !== undefined) {
      updates.push(`language = $${paramCount}`);
      params.push(language);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query<Flow>(
      `
      UPDATE flows
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      params
    );

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// DELETE /api/flows/:id - Delete flow
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if flow has any sessions
    const sessionCheck = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE flow_id = $1',
      [id]
    );

    if (parseInt(sessionCheck.rows[0].count) > 0) {
      throw new AppError(
        'Cannot delete flow with existing sessions. Delete sessions first.',
        400
      );
    }

    const result = await query<Flow>(
      'DELETE FROM flows WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Flow deleted successfully',
      data: result.rows[0],
    });
  })
);

// GET /api/flows/:id/sessions - Get all sessions for a flow
router.get(
  '/:id/sessions',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, limit = 100, offset = 0 } = req.query;

    // Check if flow exists
    const flowCheck = await query('SELECT id FROM flows WHERE id = $1', [id]);

    if (flowCheck.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    let queryText = 'SELECT * FROM sessions WHERE flow_id = $1';
    const params: any[] = [id];
    let paramCount = 2;

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
    });
  })
);

export default router;
