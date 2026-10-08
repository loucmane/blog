# Reader Lab preview

## First sign-in

The person helping you set up the magazine will send you a private setup link. Open it on the device where you want to try your magazine. The page checks your link, then shows **Create your password** and your email address. Your email is hidden until the link has been checked.

Choose a password with 14–128 characters. Several unrelated words make a stronger password that is easier to remember. Spaces are welcome. Use **Show password** to check what you typed, then choose **Create account**. You will be signed in and taken to your Reader Lab, where the tour begins.

Keep the link private: anyone with it can create the first account. The private part disappears from the address bar when the page opens. If you refresh before finishing, reopen the original link. After setup, the link no longer creates accounts. Use **Sign in** with your email and password next time. You can add a passkey from your account page after signing in.

If the link does not work, ask the person helping you for a new one. After too many attempts, wait 15 minutes before trying again. If setup finished but the connection dropped, try signing in with the password you chose.

### For the person preparing the preview

Use the isolated Preview database and the existing Better Auth settings described in the deployment plan. Configure `MAGAZINE_OWNER_EMAIL` and, optionally, `MAGAZINE_OWNER_NAME`. Configure `MAGAZINE_OWNER_SETUP_TOKEN` with a fresh secret from a cryptographically secure random generator, for example `openssl rand -base64 48`. The configured value must contain at least 32 bytes (at most 512 bytes); length alone does not make a chosen phrase random. Keep it separate from `BETTER_AUTH_SECRET` and other credentials.

Share `https://<preview-host>/owner/setup#<URL-encoded-setup-token>` through a private channel. Use the fragment after `#`, never `?token=`: fragments are not sent in HTTP requests or Referer headers. The form sends the secret in its POST body; exclude request bodies from any external request logging or tracing. The application never logs or returns the setup secret.

Setup requires the existing owner-auth and content tables and works only while no owner or credential exists. It uses the existing idempotency table for an attempt limit shared by all instances and a separate permanent completion record. Five failed attempts in 15 minutes pause all attempts for that link, including the correct link. While paused, requests do not check the submitted secret or write another failure. The limit reduces abuse and database work; the random secret protects against guessing. The attempt allowance is associated with a digest of the configured secret, so a new secret starts a fresh allowance. Observing an existing account, including a partially provisioned one, permanently disables setup even if that account is later removed. No additional migration is needed. Changing the configured token or email will not reopen permanently disabled setup. Remove the setup token from the environment after the first sign-in. Do not delete the owner or completion record to reset an account; use account recovery.

### If the owner is locked out of setup

If the owner sees **Too many attempts**, they can wait 15 minutes and reopen their invitation. If the message keeps returning before they have created an account, the person preparing the preview can restore access:

1. Generate a new secret with `openssl rand -base64 48` and set it as `MAGAZINE_OWNER_SETUP_TOKEN` in the Preview environment.
2. Redeploy the preview so it uses the new secret.
3. Send the owner a new private link: `https://<preview-host>/owner/setup#<URL-encoded-new-secret>`.

The new link has a fresh attempt allowance. If an account already exists or setup has been permanently disabled, use sign-in or account recovery; changing the setup secret cannot reopen it.

The setup link does not enable public registration. Local Reader Lab and owner fixture/test mode keep their existing sign-in flow. A complete hosted setup check needs PostgreSQL and the production authentication runtime; the main browser suite deliberately uses owner fixture mode.
