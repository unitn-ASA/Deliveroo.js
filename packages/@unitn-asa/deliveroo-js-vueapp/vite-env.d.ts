/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SOCKET_IO_HOST: string;
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}