export interface LoginResponse {
  access: string;
  refresh: string;
  role: 'student' | 'company';
}

export function loginMock(email: string, password: string): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password.length < 6) {
        reject('Credenciales incorrectas');
        return;
      }

      const role = email.includes('empresa') ? 'company' : 'student';

      resolve({
        access: 'fake-access-token-123',
        refresh: 'fake-refresh-token-456',
        role: role
      });
    }, 1000);
  });
}