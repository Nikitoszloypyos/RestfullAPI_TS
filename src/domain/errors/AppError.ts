export abstract class AppError extends Error {
      constructor(message: string, public readonly code: string) {
            super(message);
            Object.setPrototypeOf(this, new.target.prototype);
      }
}