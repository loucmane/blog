# Reader Lab preview

## First sign-in

The person helping you set up the magazine will send you a private setup link. Open it on the device where you want to try your magazine. The page checks your link, then shows **Create your password** and your email address. Your email is hidden until the link has been checked.

Choose a password with 14–128 characters. Several unrelated words make a stronger password that is easier to remember. Spaces are welcome. Use **Show password** to check what you typed, then choose **Create account**. You will be signed in and taken to your Reader Lab, where the tour begins.

Keep the link private: anyone with it can create the first account. The private part disappears from the address bar when the page opens. If you refresh before finishing, reopen the original link. After setup, the link no longer creates accounts. Use **Sign in** with your email and password next time. You can add a passkey from your account page after signing in.

If the link does not work, ask the person helping you for a new one. After too many attempts, wait 15 minutes before trying again. If setup finished but the connection dropped, try signing in with the password you chose.

### For the person preparing the preview

Use the isolated Preview database and the existing Better Auth settings described in the deployment plan. Configure `MAGAZINE_OWNER_EMAIL` and, optionally, `MAGAZINE_OWNER_NAME`. Configure `MAGAZINE_OWNER_SETUP_TOKEN` with a fresh, randomly generated secret of at least 32 bytes (at most 512 bytes); keep it separate from `BETTER_AUTH_SECRET` and other credentials.

Share `https://<preview-host>/owner/setup#<URL-encoded-setup-token>` through a private channel. Use the fragment after `#`, never `?token=`: fragments are not sent in HTTP requests or Referer headers. The form sends the secret in its POST body; exclude request bodies from any external request logging or tracing. The application never logs or returns the setup secret.

Setup requires the existing owner-auth and content tables and works only while no owner or credential exists. It uses the existing idempotency table for an invalid-link attempt limit shared by all instances and a separate permanent completion record. Invalid attempts cannot use up a valid link's allowance. Observing an existing account, including a partially provisioned one, permanently disables setup even if that account is later removed. No additional migration is needed. Changing the configured token or email will not reopen disabled setup. Remove the setup token from the environment after the first sign-in. Do not delete the owner or completion record to reset an account; use account recovery.

The setup link does not enable public registration. Local Reader Lab and owner fixture/test mode keep their existing sign-in flow. A complete hosted setup check needs PostgreSQL and the production authentication runtime; the main browser suite deliberately uses owner fixture mode.
