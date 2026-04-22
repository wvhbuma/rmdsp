/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string

interface ImportMetaEnv {
  readonly VITE_RAM_API_BASE_URL?: string
  readonly VITE_ENTRA_TENANT_NAME?: string
  readonly VITE_ENTRA_CLIENT_ID?: string
  readonly VITE_ENTRA_AUTHORITY_URL?: string
  readonly VITE_ENTRA_USER_FLOW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
