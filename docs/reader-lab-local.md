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
