# Try the Reader Lab on your computer

From the project folder, run:

```sh
node packages/web/scripts/lab-local.mjs
```

The command prepares the magazine, starts it on your computer, and adds the North House sample stories. The first start takes longer because it builds the site. Keep the terminal open.

1. Open **http://localhost:3100/owner/sign-in** (or the address printed in the terminal).
2. Choose **Sign in as the local owner**. No password or browser console is needed.
3. The Reader Lab tour opens on your first visit. Use **Next step** and **Back**, or **Close tour** / Escape to dismiss it. Clicking outside also closes it, so you can start exploring. **Take the tour** starts it again.
4. Try each direction card with **View the site in this direction** or **Open latest story**. On reader pages, the bar at the bottom has **Previous**, **Next**, **All directions**, and **Exit lab**. A short reminder appears the first time.
5. To try your own writing, choose **Write a new post**, add a title and story, and wait for it to save. Choose **Preview**, then **Publish now** when ready. Return to **Reader Lab** and open your latest story. Compare reading comfort, images, mobile, dark mode (under **Theme**) and speed.
6. **Exit lab** returns the page to Baseline. Visitors always see Baseline.

This is a temporary local magazine. **All stories, uploads and changes are held in memory and disappear when the server stops or restarts.** Publishing here makes a story visible in this local magazine only. Keep a separate copy of writing you want to save. The next start restores the North House samples.

Press **Ctrl+C** in the terminal to stop. If it says port 3100 is in use, stop the other local server and try again. If your session expires, use the local sign-in button again.

The project’s Node and pnpm tools and dependencies must already be installed. The command reuses its previous build only while the source and build still match. It accepts only local HTTP addresses and refuses to run with `NODE_ENV=production`. Local sign-in is available only in the explicit local test runtime.

## Persistent local trial

Use this version to try real account setup, password sign-in, writing and uploads that **survive restarts**. Install the project's pinned Node and pnpm versions and dependencies, and start Docker with Compose v2. From the project folder, run:

```sh
node packages/web/scripts/lab-trial.mjs start
```

The first start quietly downloads the database/storage images, prepares the database, builds the site and adds North House sample stories. It can take several minutes. When ready, it prints the site address, **http://localhost:3200/owner/sign-in**, and a private **one-time setup link** if the account has not been created. Keep this terminal open.

1. Open the full setup link, including everything after `#`, and create your password. Keep that link private.
2. Sign in with **owner@example.test** and your password. This is a real local account; there is no local-owner shortcut. Password recovery email is not configured, so save your password.
3. Open Reader Lab and try writing, uploading an image, previewing and publishing. Publishing makes the story visible only in this local magazine. This helper does not start a scheduled-publication worker; use **Publish now** for the trial.
4. Press **Ctrl+C** to stop the site. The database/storage containers keep running and all trial data stays saved. Run `start` again to return; completed setup links are no longer printed and sample seeding is idempotent.

Check status from another terminal:

```sh
node packages/web/scripts/lab-trial.mjs status
```

After pressing Ctrl+C in the start terminal, stop the containers too with:

```sh
node packages/web/scripts/lab-trial.mjs stop
```

Stopping keeps your stories, uploads and account. To permanently delete **all of this trial's data**, first press Ctrl+C, then explicitly confirm:

```sh
node packages/web/scripts/lab-trial.mjs reset --yes-delete-trial-data
```

The trial uses its own `blog-reader-lab-trial` Docker Compose project and named volumes, with loopback-only ports **3200, 55444 and 57044**. The integration-test stack uses different ports and volumes. If a port is busy, stop the other service before starting the trial. Only one trial launcher can run at a time, including across checkouts sharing these ports.

Generated credentials are saved privately (file mode 0600) in **`ci-artifacts/lab-trial/state.json`**, using the repository's existing Git ignore. Keep that file with the Docker volumes: deleting it separately loses the credentials for your saved data. Do not run artifact-cleanup commands over `ci-artifacts/` while keeping a trial. The launcher checks the ignore rule, does not print credentials except the requested first-account setup link, and suppresses child-process output. It uses its own local configuration, ignoring inherited application/database credentials and disabling fixture mode. Do not set `NODE_ENV=production` or run it in a hosted deployment.

The command reuses only a matching trial build; switching between this trial and the in-memory lab rebuilds when needed. It runs a production build in a local test runtime so HTTP loopback sign-in works. The original command on port 3100 remains the temporary, in-memory option. This persistent trial stays on your computer; it is not a hosted Preview deployment or a backup service.
