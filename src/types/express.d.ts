export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        /** The `jti` of the token this request authenticated with — what a sign-out revokes. */
        sessionId: string;
        /** The token's `exp`, in seconds. */
        sessionExpiresAt: number;
      };
    }
  }
}
