declare module 'google-one-tap' {
  export type accounts = {
    id: {
      initialize(options: {
        client_id: string
        callback: (response: CredentialResponse) => void | Promise<void>
        nonce?: string
        use_fedcm_for_prompt?: boolean
      }): void
      prompt(): void
    }
  }

  export interface CredentialResponse {
    credential: string
    select_by?: string
    clientId?: string
  }
}


