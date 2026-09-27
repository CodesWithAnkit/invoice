import { test, expect } from '@playwright/test';

test.describe('Verify Customers API features', () => {
  test('customer creation with new fields, patch, search, and sort', async ({ request }) => {
    // 1. POST /api/customers with new fields
    const createRes = await request.post('/api/customers', {
      data: { 
        name: 'Alpha Customer', 
        email: 'alpha@example.com',
        notes: 'A very special customer',
        tax_id: 'TAX-12345'
      }
    });
    expect(createRes.status()).toBe(200);
    const createdData = await createRes.json();
    expect(createdData.success).toBe(true);
    expect(createdData.data.name).toBe('Alpha Customer');
    expect(createdData.data.status).toBe('active');
    
    // We also need another customer to test search and sort
    await request.post('/api/customers', {
      data: { name: 'Zeta Customer', email: 'zeta@example.com' }
    });
    
    const customerId = createdData.data.id;

    // 2. PATCH /api/customers/[id]
    const patchRes = await request.patch(`/api/customers/${customerId}`, {
      data: {
        status: 'archived',
        notes: 'Archived due to inactivity',
        tax_id: 'TAX-000'
      }
    });
    expect(patchRes.status()).toBe(200);
    const patchedData = await patchRes.json();
    expect(patchedData.success).toBe(true);
    expect(patchedData.data.status).toBe('archived');
    expect(patchedData.data.notes).toBe('Archived due to inactivity');
    expect(patchedData.data.tax_id).toBe('TAX-000');

    // 3. GET /api/customers?search=zeta
    const searchRes = await request.get('/api/customers?search=zeta');
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.success).toBe(true);
    expect(searchData.data.customers.length).toBeGreaterThan(0);
    expect(searchData.data.customers.some((c: any) => c.name === 'Zeta Customer')).toBe(true);
    expect(searchData.data.customers.some((c: any) => c.name === 'Alpha Customer')).toBe(false);

    // 4. GET /api/customers?sort=name&dir=desc
    const sortRes = await request.get('/api/customers?sort=name&dir=desc');
    expect(sortRes.status()).toBe(200);
    const sortData = await sortRes.json();
    expect(sortData.success).toBe(true);
    
    const customers = sortData.data.customers;
    const zetaIndex = customers.findIndex((c: any) => c.name === 'Zeta Customer');
    const alphaIndex = customers.findIndex((c: any) => c.name === 'Alpha Customer');
    // Since dir is desc, Zeta should come before Alpha
    expect(zetaIndex).toBeLessThan(alphaIndex);
  });
});
