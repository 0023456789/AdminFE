/** Cùng chính sách với backend (StaffPasswordPolicy): 10–72 byte UTF-8, có chữ và số, khác tên đăng nhập. */
export function passwordPolicyError(password: string, username: string | null): string | null {
  const bytes = new TextEncoder().encode(password).length;
  if (bytes < 10) return 'Mật khẩu phải có ít nhất 10 ký tự';
  if (bytes > 72) return 'Mật khẩu không được dài quá 72 byte';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Mật khẩu phải có cả chữ và số';
  if (username && password.toLowerCase() === username.toLowerCase()) return 'Mật khẩu không được trùng tên đăng nhập';
  return null;
}
