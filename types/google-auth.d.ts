// Simplified Google Auth types for HTML-based integration
declare global {
  interface Window {
    handleSignInWithGoogle?: (response: { credential: string }) => void;
  }
}
