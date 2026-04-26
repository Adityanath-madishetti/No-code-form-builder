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

describe('Themes API', () => {
  let createdThemeId: string;

  it('POST /api/themes should create a new theme', async () => {
    const response = await request(app)
      .post('/api/themes')
      .send({ 
        name: 'Dark Mode', 
        theme: { backgroundColor: '#000', textColor: '#fff' }
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('theme');
    expect(response.body.theme).toHaveProperty('themeId');
    expect(response.body.theme.name).toBe('Dark Mode');
    createdThemeId = response.body.theme.themeId;
  });

  it('GET /api/themes should list themes', async () => {
    const response = await request(app).get('/api/themes');
    expect(response.status).toBe(200);
    expect(response.body.themes).toBeDefined();
    expect(Array.isArray(response.body.themes)).toBe(true);
  });
});
