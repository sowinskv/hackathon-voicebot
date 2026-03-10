import { Router, Request, Response } from 'express';
import { query } from '../db';
import { AppError, asyncHandler } from '../middleware/error';

const router = Router();

interface Flow {
  id: string;
  name: string;
  description?: string;
  configuration: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GET /api/flows - List all flows
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { is_active, limit = 100, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM flows WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      queryText += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    const { name, description, configuration, is_active = true } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    if (!configuration) {
      throw new AppError('Configuration is required', 400);
    }

    // Validate configuration is valid JSON
    if (typeof configuration !== 'object') {
      throw new AppError('Configuration must be a valid JSON object', 400);
    }

    const result = await query<Flow>(
      `
      INSERT INTO flows (name, description, configuration, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [name, description || null, JSON.stringify(configuration), is_active]
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
    const { name, description, configuration, is_active } = req.body;

    // Check if flow exists
    const existingFlow = await query('SELECT id FROM flows WHERE id = $1', [id]);

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

    if (configuration !== undefined) {
      if (typeof configuration !== 'object') {
        throw new AppError('Configuration must be a valid JSON object', 400);
      }
      updates.push(`configuration = $${paramCount}`);
      params.push(JSON.stringify(configuration));
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
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
