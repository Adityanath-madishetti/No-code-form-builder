import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';

vi.mock('@/middlewares/auth.middleware.js', () => ({
  verifyToken: (req: any, res: any, next: any) => {
    req.user = { uid: 'test-user-id', email: 'test@example.com' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = { uid: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

describe('Groups API', () => {
  let createdGroupId: string;

  it('POST /api/groups should create a new group', async () => {
    const response = await request(app)
      .post('/api/groups')
      .send({ 
        name: 'Test Group', 
        components: [{ type: 'button', label: 'Click Me' }],
        sharedWith: ['friend@example.com'],
        isPublic: true
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('group');
    expect(response.body.group).toHaveProperty('groupId');
    expect(response.body.group.name).toBe('Test Group');
    createdGroupId = response.body.group.groupId;
  });

  it('GET /api/groups should list groups', async () => {
    const response = await request(app).get('/api/groups');
    expect(response.status).toBe(200);
    expect(response.body.groups).toBeDefined();
    expect(Array.isArray(response.body.groups)).toBe(true);
    expect(response.body.groups.length).toBeGreaterThan(0);
  });

  // Note: if updateGroupSchema requires UUID, we might need a real UUID here.
  // But usually Mongoose _id is a string/ObjectId. 
  // Let's see if this fails due to the z.uuid() validation.
});
