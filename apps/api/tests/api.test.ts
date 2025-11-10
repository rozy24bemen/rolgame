import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';

let app: any;

beforeAll(async () => {
  app = await createApp();
});

describe('BFF minimal API', () => {
  it('increments tick via REST', async () => {
    const r1 = await request(app).post('/api/world/tick').send({ count: 1 }).expect(200);
    expect(r1.body.ok).toBe(true);
    const t1 = r1.body.tick;
    const r2 = await request(app).post('/api/world/tick').send({ count: 2 }).expect(200);
    expect(r2.body.tick).toBe(t1 + 2);
  });

  it('returns tickInfo via GraphQL', async () => {
    const query = { query: 'query { tickInfo { tick season } }' };
    const r = await request(app).post('/graphql').send(query).expect(200);
    expect(r.body.data.tickInfo).toHaveProperty('tick');
  });
});
