import { test, expect } from '@playwright/test';

test.describe('Verify Phase 3 Domain Decisions', () => {
  test('customer creation, deletion restrictions, and project status derivation', async ({ request }) => {
    // AC-3: Create a customer with just a name
    const customerRes = await request.post('/api/customers', {
      data: { name: 'Verify Test Customer' }
    });
    expect(customerRes.status()).toBe(200);
    const customerData = await customerRes.json();
    expect(customerData.success).toBe(true);
    expect(customerData.data.name).toBe('Verify Test Customer');
    expect(customerData.data.status).toBe('active');
    const customerId = customerData.data.id;
    
    // Create a project for this customer
    const projectRes = await request.post('/api/projects', {
      data: { name: 'Verify Test Project', customer_id: customerId }
    });
    expect(projectRes.status()).toBe(200);
    const projectData = await projectRes.json();
    expect(projectData.success).toBe(true);
    const projectId = projectData.data.id;
    
    // AC-4: Try to delete customer referenced by a project -> should fail with 409
    const deleteCustomerRes = await request.delete(`/api/customers/${customerId}`);
    expect(deleteCustomerRes.status()).toBe(409);
    
    // Check GET /api/projects for AC-2 status derivation
    const projectsGet = await request.get('/api/projects');
    expect(projectsGet.status()).toBe(200);
    const projectsData = await projectsGet.json();
    const theProject = projectsData.data.projects.find((p: any) => p.id === projectId);
    expect(theProject).toBeDefined();
    expect(theProject.status).toBe('Draft'); // No quotations yet
    
    // AC-4: Try deleting a customer NOT referenced by anything
    const unreferencedCustomerRes = await request.post('/api/customers', {
      data: { name: 'Unreferenced Customer' }
    });
    const unreferencedId = (await unreferencedCustomerRes.json()).data.id;
    
    const deleteUnrefRes = await request.delete(`/api/customers/${unreferencedId}`);
    expect(deleteUnrefRes.status()).toBe(200);
  });
});
