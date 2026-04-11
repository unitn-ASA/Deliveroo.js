/**
 * Global type declarations for Node.js environment
 */

declare const process: {
  env: {
    HOST?: string;
    TOKEN?: string;
    NAME?: string;
    [key: string]: string | undefined;
  };
};
