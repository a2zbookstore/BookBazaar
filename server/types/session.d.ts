import 'express-session';

declare module 'express-session' {
  interface SessionData {
    analyticsSessionId?: string;
    userId?: string;
    isCustomerAuth?: boolean;
    adminId?: number;
    isAdmin?: boolean;
  }
}
