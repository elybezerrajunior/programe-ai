import type { User } from './session';

// Simulação de banco de dados de usuários
// Em produção, isso seria substituído por uma chamada ao Supabase Auth ou outro serviço
const MOCK_USERS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'demo@programe.studio',
    password: 'demo123',
    user: {
      id: '1',
      email: 'demo@programe.studio',
      name: 'Usuário Demo',
    },
  },
];

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Em produção, isso seria uma chamada ao Supabase Auth ou outro serviço
  const userRecord = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!userRecord) {
    return null;
  }

  // Em produção, a senha seria verificada com hash (bcrypt, etc.)
  if (userRecord.password !== password) {
    return null;
  }

  return userRecord.user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userRecord = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return userRecord ? userRecord.user : null;
}

