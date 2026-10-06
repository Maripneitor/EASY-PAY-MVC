/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    // Add other env variables here...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
}
