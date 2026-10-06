import { http, HttpResponse } from 'msw';
import { createMockPlanSummaryList, resetIdCounter } from './factories';

// Caching in memory for MSW so we can test toggles and deletes
let mockPlans = createMockPlanSummaryList(5);
// Ensure we have one that is disabled for testing toggle on -> off and off -> on
mockPlans[0].isActive = true;
mockPlans[1].isActive = false;

export const handlers = [
  http.get('/api/v1/plans', ({ request }) => {
    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size') || '20');
    const page = Number(url.searchParams.get('page') || '0');
    const keyword = url.searchParams.get('keyword');
    const isActive = url.searchParams.get('isActive');

    let filtered = [...mockPlans];

    if (keyword) {
      filtered = filtered.filter(
        (p) =>
          p.code?.includes(keyword) ||
          p.name?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    if (isActive !== null) {
      const activeBool = isActive === 'true';
      filtered = filtered.filter((p) => p.isActive === activeBool);
    }

    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);

    return HttpResponse.json({
      code: 1000,
      result: {
        content: paginated,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        size,
        number: page,
      },
    });
  }),

  http.patch('/api/v1/plans/:id/status', async ({ request, params }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { isActive: boolean };
    const plan = mockPlans.find((p) => p.id === id);

    if (!plan) {
      return HttpResponse.json({ code: 1001, message: 'Not found' }, { status: 404 });
    }
    
    // Simulate error scenario for optimistic update test
    if (id === 999) {
      return HttpResponse.json({ code: 5000, message: 'Server error' }, { status: 500 });
    }

    plan.isActive = body.isActive;
    return HttpResponse.json({ code: 1000, result: plan });
  }),

  http.delete('/api/v1/plans/:id', ({ params }) => {
    const id = Number(params.id);

    // Simulate 409 conflict for plan in use
    if (id === 1111) {
      return HttpResponse.json(
        { code: 1111, message: 'Plan is in use' },
        { status: 409 }
      );
    }

    mockPlans = mockPlans.filter((p) => p.id !== id);
    return HttpResponse.json({ code: 1000, result: 'Deleted' });
  }),
];

// Helper to reset state between tests
export const resetMockPlans = () => {
  resetIdCounter();
  mockPlans = createMockPlanSummaryList(5);
  mockPlans[0].isActive = true;
  mockPlans[1].isActive = false;
  // Special plan for error testing
  mockPlans.push({ ...mockPlans[0], id: 999, name: 'Error Plan', isActive: true });
  // Special plan for 1111 testing
  mockPlans.push({ ...mockPlans[0], id: 1111, name: 'In Use Plan', isActive: false });
};
