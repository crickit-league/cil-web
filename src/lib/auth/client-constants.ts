// Shared between the login form and the check-email page: stashing the
// submitted email in sessionStorage lets the code-entry box on
// /login/check-email prefill itself when it's the same device and browser
// tab that requested the code (it stays editable either way, since the
// whole point of the code — as opposed to the link — is letting someone
// enter it from a *different* device than the one that requested it).
export const LOGIN_EMAIL_STORAGE_KEY = "cil-login-email";
