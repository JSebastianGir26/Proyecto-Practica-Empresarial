export type Role = "ESTUDIANTE" | "EMPRESA" | "ADMIN";

export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
}
