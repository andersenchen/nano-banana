declare module 'google-one-tap' {
  // Main Google One Tap function
  export default function googleOneTap(
    options: GoogleOneTapOptions,
    callback: (response: CredentialResponse) => void | Promise<void>
  ): void;

  // Google accounts namespace
  export type accounts = {
    id: {
      initialize(options: GoogleOneTapInitializeOptions): void;
      prompt(notification?: PromptNotification): void;
      renderButton(
        parent: HTMLElement,
        options: GoogleSignInButtonOptions
      ): void;
      disableAutoSelect(): void;
      storeCredential(
        credential: CredentialResponse,
        callback?: () => void
      ): void;
      cancel(): void;
      revoke(
        hint: string,
        callback?: (success: boolean) => void
      ): void;
      getNotDisplayedReason(): NotDisplayedReason;
      getMomentType(): MomentType;
      isDisplayed(): boolean;
      isDisplayedBlocking(): boolean;
      isSkippedMoment(): boolean;
      isDismissedMoment(): boolean;
    };
  };

  // Main options interface for googleOneTap function
  export interface GoogleOneTapOptions {
    client_id: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
    login_uri?: string;
    prompt_parent_id?: string;
    nonce?: string;
    state_cookie_domain?: string;
    ux_mode?: 'redirect' | 'popup';
    allowed_parent_origin?: string | string[];
    itp_support?: boolean;
    [key: string]: any; // Allow additional options
  }

  // Initialize options interface
  export interface GoogleOneTapInitializeOptions {
    client_id: string;
    callback: (response: CredentialResponse) => void | Promise<void>;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
    login_uri?: string;
    prompt_parent_id?: string;
    nonce?: string;
    state_cookie_domain?: string;
    ux_mode?: 'redirect' | 'popup';
    allowed_parent_origin?: string | string[];
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
    [key: string]: any; // Allow additional options
  }

  // Credential response interface
  export interface CredentialResponse {
    credential: string;
    select_by?: string;
    clientId?: string;
  }

  // Prompt notification interface
  export interface PromptNotification {
    isNotDisplayed?: boolean;
    isSkippedMoment?: boolean;
    isDismissedMoment?: boolean;
    getNotDisplayedReason?: () => NotDisplayedReason;
    getSkippedReason?: () => SkippedReason;
    getDismissedReason?: () => DismissedReason;
    getMomentType?: () => MomentType;
  }

  // Google Sign In Button options
  export interface GoogleSignInButtonOptions {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'rounded' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string;
    local?: string;
    click_listener?: (event: Event) => void;
  }

  // Reason enums
  export type NotDisplayedReason = 
    | 'browser_not_supported'
    | 'invalid_client'
    | 'missing_client_id'
    | 'opt_out_or_no_session'
    | 'secure_http_required'
    | 'suppressed_by_user'
    | 'unregistered_origin'
    | 'unknown_reason';

  export type SkippedReason = 
    | 'auto_cancel'
    | 'user_cancel'
    | 'tap_outside'
    | 'issuing_failed';

  export type DismissedReason = 
    | 'credential_returned'
    | 'cancel_called'
    | 'flow_restarted';

  export type MomentType = 
    | 'display'
    | 'skipped'
    | 'dismissed';

  // Google Identity Services global object
  export interface GoogleIdentityServices {
    accounts: accounts;
  }

  // Extend the global Window interface
  declare global {
    interface Window {
      google: GoogleIdentityServices;
    }
  }
}


