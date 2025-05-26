export interface Reader {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: Date;
  active?: boolean;
} 