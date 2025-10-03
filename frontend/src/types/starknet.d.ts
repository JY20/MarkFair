declare global {
  interface Window {
    starknet?: {
      request: (params: {
        method: string;
        params?: any;
      }) => Promise<any>;
    };
  }
}

export {};

