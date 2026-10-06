import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanListPage } from './PlanListPage';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';
import { vi as i18n } from '../../i18n/vi';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/plans']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PlanListPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders table with rows from API', async () => {
    renderWithProviders(<PlanListPage />);
    
    // Expect header to be visible
    expect(screen.getByText(i18n.plans.title)).toBeInTheDocument();

    // Wait for the mock plans to appear
    await waitFor(() => {
      expect(screen.getByText('Gói cước 1')).toBeInTheDocument();
      expect(screen.getByText('Gói cước 2')).toBeInTheDocument();
    });
  });

  it('handles search input with debounce', async () => {
    renderWithProviders(<PlanListPage />);
    
    const searchInput = screen.getByPlaceholderText('Tìm theo mã hoặc tên gói...');
    await user.type(searchInput, 'Gói cước 1');
    
    // Should filter locally/via API in tests
    await waitFor(() => {
      expect(screen.getByText('Gói cước 1')).toBeInTheDocument();
      expect(screen.queryByText('Gói cước 2')).not.toBeInTheDocument();
    });
  });

  it('handles optimistic toggle success', async () => {
    renderWithProviders(<PlanListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Gói cước 2')).toBeInTheDocument();
    });

    // Find the switch for Plan 2 (which is initialized as false in our mock)
    // The aria-label is "Kích hoạt gói cước Gói cước 2"
    const toggle = screen.getByRole('switch', { name: /Gói cước 2/ });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    // Should immediately become checked (optimistic)
    expect(toggle).toBeChecked();

    // And eventually the success message should appear
    await waitFor(() => {
      expect(screen.getByText(/Đã bật gói Gói cước 2/i)).toBeInTheDocument();
    });
  });

  it('handles optimistic toggle error and rolls back', async () => {
    renderWithProviders(<PlanListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Plan')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /Error Plan/ });
    expect(toggle).toBeChecked(); // initially true

    await user.click(toggle);

    // Optimistically unchecks
    expect(toggle).not.toBeChecked();

    // Then rolls back because the server returns 500 error for ID 999
    await waitFor(() => {
      expect(toggle).toBeChecked();
    });
    
    // Shows the error message from the server
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    server.use(
      http.get('/api/v1/plans', () => {
        return HttpResponse.json({
          code: 1000,
          result: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 },
        });
      })
    );

    renderWithProviders(<PlanListPage />);
    
    await waitFor(() => {
      expect(screen.getByText(i18n.plans.noPlans)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/v1/plans', () => {
        return HttpResponse.json({ code: 5000, message: 'DB Error' }, { status: 500 });
      })
    );

    renderWithProviders(<PlanListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Có lỗi xảy ra')).toBeInTheDocument();
      expect(screen.getByText('DB Error')).toBeInTheDocument();
    });
  });

  it('shows conflict modal when deleting plan in use', async () => {
    renderWithProviders(<PlanListPage />);

    await waitFor(() => {
      expect(screen.getByText('In Use Plan')).toBeInTheDocument();
    });

    // Find the row containing "In Use Plan" and click its delete button
    const row = screen.getByText('In Use Plan').closest('tr');
    // Select button by title since it's an icon-only button
    const deleteBtn = within(row!).getByTitle('Xóa');
    
    await user.click(deleteBtn);

    // Click confirm in Popconfirm
    const confirmBtn = await screen.findByRole('button', { name: i18n.common.delete });
    await user.click(confirmBtn);

    // Wait for the modal to appear due to 409 error
    await waitFor(() => {
      expect(screen.getByText('Không thể xóa gói cước')).toBeInTheDocument();
      expect(screen.getByText(i18n.plans.inUse)).toBeInTheDocument();
    });

    // Verify the deactivate button is there
    const deactivateBtn = screen.getByRole('button', { name: i18n.plans.deactivate });
    expect(deactivateBtn).toBeInTheDocument();
  });
});
