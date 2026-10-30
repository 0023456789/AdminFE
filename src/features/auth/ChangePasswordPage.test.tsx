import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { AuthProvider } from '../../auth/AuthContext';
import { ACCESS_TOKEN_KEY, isPasswordChangeRequired } from '../../auth/session';
import { CHANGE_PASSWORD_PATH, RequireAuth } from '../../components/AuthRoutes';
import { ChangePasswordPage } from './ChangePasswordPage';
import { passwordPolicyError } from './passwordPolicy';

function fakeToken(claims: Record<string, unknown>): string {
  const payload = window.btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims }));
  return `header.${payload}.signature`;
}

function CurrentPath() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path={CHANGE_PASSWORD_PATH} element={<ChangePasswordPage />} />
            <Route path="/plans" element={<p>Plans page</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
        <CurrentPath />
      </MemoryRouter>
    </AuthProvider>,
  );
}

const currentPath = () => screen.getByTestId('path').textContent;

// Dán cả chuỗi thay vì gõ từng phím: antd Input.Password trong jsdom rất chậm với user.type.
async function fill(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  await user.click(screen.getByLabelText(label));
  await user.paste(value);
}

describe('ChangePasswordPage (ADM-07)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('applies the same password policy as the backend', () => {
    expect(passwordPolicyError('short1', 'admin')).not.toBeNull();
    expect(passwordPolicyError('onlyletters', 'admin')).not.toBeNull();
    expect(passwordPolicyError('1234567890', 'admin')).not.toBeNull();
    expect(passwordPolicyError('Admin12345', 'admin12345')).not.toBeNull();
    expect(passwordPolicyError('NewSecret2026', 'admin')).toBeNull();
  });

  it('redirects to the change password page while the initial password must be changed', async () => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY,
      fakeToken({ sub: 'admin', roles: ['ADMIN'], pwd_change_required: true }));

    renderAt('/plans');

    await waitFor(() => expect(currentPath()).toBe(CHANGE_PASSWORD_PATH));
    expect(screen.getByText(/cần đổi mật khẩu ban đầu/)).toBeInTheDocument();
  });

  it('stores the new token and opens the app after a successful change', async () => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY,
      fakeToken({ sub: 'admin', roles: ['ADMIN'], pwd_change_required: true }));
    const freshToken = fakeToken({ sub: 'admin', roles: ['ADMIN'], pwd_change_required: false });
    let sentBody: unknown = null;
    server.use(http.post('/api/v1/auth/change-password', async ({ request }) => {
      sentBody = await request.json();
      return HttpResponse.json({ code: 1000, result: {
        accessToken: freshToken, tokenType: 'Bearer', expiresIn: 900, passwordChangeRequired: false } });
    }));
    const user = userEvent.setup();

    renderAt(CHANGE_PASSWORD_PATH);
    await fill(user, 'Mật khẩu hiện tại', 'Bootstrap123');
    await fill(user, 'Mật khẩu mới', 'NewSecret2026');
    await fill(user, 'Nhập lại mật khẩu mới', 'NewSecret2026');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => expect(currentPath()).toBe('/plans'));
    expect(sentBody).toEqual({ currentPassword: 'Bootstrap123', newPassword: 'NewSecret2026' });
    expect(isPasswordChangeRequired(window.sessionStorage.getItem(ACCESS_TOKEN_KEY))).toBe(false);
  }, 20000);

  it('shows the wrong current password on its field', async () => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, fakeToken({ sub: 'admin', roles: ['ADMIN'] }));
    server.use(http.post('/api/v1/auth/change-password', () =>
      HttpResponse.json({ code: 1606, message: 'Current password is incorrect' }, { status: 400 })));
    const user = userEvent.setup();

    renderAt(CHANGE_PASSWORD_PATH);
    await fill(user, 'Mật khẩu hiện tại', 'WrongPass123');
    await fill(user, 'Mật khẩu mới', 'NewSecret2026');
    await fill(user, 'Nhập lại mật khẩu mới', 'NewSecret2026');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument();
  }, 20000);
});
