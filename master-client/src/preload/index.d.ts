import type { MasterApi } from '@shared/ipc'

declare global {
  interface Window {
    mc: MasterApi
  }
}

export {}
