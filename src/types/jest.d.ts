// Tipos customizados para Jest
declare namespace jest {
  interface Matchers<R> {
    toBeValidUUID(): R;
  }
}

// Extensão de expectativas
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
    }
  }
}

export {};