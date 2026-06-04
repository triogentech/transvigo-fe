/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow importing the existing .jsx modules from .ts/.tsx files.
declare module '*.jsx';
