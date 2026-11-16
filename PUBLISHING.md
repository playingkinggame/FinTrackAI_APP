# Publishing FinTrack AI (APK + download website)

You will end up with a public link like `https://fintrack-ai.netlify.app`. When someone opens it on an Android phone and taps **Android**, the app downloads and they can install it. Everything below is free.

```
 Your project ──(Expo EAS)──> fintrack-ai.apk ──> GitHub Release (hosts the APK)
                                                          ▲
 website/index.html ──(Netlify)──> your public link ──────┘  (the Android button points here)
```

Why two places? The APK is large (tens of MB). Netlify's drag-and-drop upload can stall on files over 10 MB, and Cloudflare Pages rejects files over 25 MiB. GitHub Releases is free and handles big files, so the APK lives there and the small website lives on Netlify.

---

## Step 1: Create three free accounts (one time)

| Account | Used for | Link |
|---|---|---|
| Expo | builds the APK in the cloud | https://expo.dev/signup |
| GitHub | hosts the APK file | https://github.com/signup |
| Netlify | hosts the download page | https://app.netlify.com/signup |

## Step 2: Add these files to your project

Unzip `FinTrackAI_apk_setup.zip` **on top of your project folder** and choose "replace" if asked. It adds or updates:

- `app.json`: app icon, Android package name `com.yathin.fintrackai`, unused permissions removed
- `eas.json`: the APK build profile, with your Supabase URL and publishable key
- `.easignore`: keeps `.env` and the `website` folder out of the cloud upload
- `assets/icon.png` and `assets/adaptive-icon.png`: the app icon
- `tsconfig.json`, `app/(tabs)/_layout.tsx`, `app/(tabs)/assistant.tsx`: small type fixes so `npx tsc --noEmit` passes
- `website/`: the download page
- `PUBLISHING.md`: this guide

> The package name `com.yathin.fintrackai` is the app's permanent ID. Change it **now** in `app.json` (both `android.package` and `ios.bundleIdentifier`) if you want a different one. After people install the app, changing it makes it a different app.

## Step 3: Recommended extra package

```powershell
npx expo install expo-system-ui
```

Your app is dark-only. This package makes Android respect that for system parts such as the background behind the app. Skipping it only causes a warning.

## Step 4: Check the app still runs

```powershell
npx tsc --noEmit
npx expo start -c
```

`tsc` should print nothing. Open the app in Expo Go, sign in and make sure it works.

## Step 5: Log in to Expo

```powershell
npx eas-cli@latest login
```

Use the Expo account from Step 1. (`npx` means you don't need to install anything globally.)

## Step 6: Build the APK

```powershell
npx eas-cli@latest build -p android --profile preview
```

Answer the first-time questions like this:

- "Create an EAS project for @yourname/fintrack-ai?": **Yes**. This adds a project ID to `app.json`; keep it.
- "Generate a new Android Keystore?": **Yes**. This is your app's signing key. Expo stores it for your account.

Then wait. The free plan builds in a queue, so it can take from a few minutes to over half an hour. When it finishes you get a link to the build page.

> **Keep your signing key safe.** Every future update must be signed with the same key, or phones will refuse to install it over the old version. Back it up once with `npx eas-cli@latest credentials`, choose Android, then download the keystore. Never put it in GitHub or the website folder.

## Step 7: Download the APK and name it

On the build page, click **Install** or **Download** and save the `.apk`. Rename it exactly:

```
fintrack-ai.apk
```

(The page links to this exact file name.)

## Step 8: Put the APK on GitHub

1. On GitHub, click **New repository**. Name it `fintrack-ai-releases`, set it to **Public**, tick "Add a README", then click **Create**. (It holds only the APK, not your code.)
2. Open the repository, then **Releases**, then **Create a new release**.
3. Under **Choose a tag**, type `v1.0.0` and click **Create new tag**. Title: `FinTrack AI 1.0.0`.
4. Drag `fintrack-ai.apk` into the "Attach binaries" box and wait for the upload to finish.
5. Click **Publish release**.

Test the download link by pasting this into your browser, with your username:

```
https://github.com/YOUR-GITHUB-USERNAME/fintrack-ai-releases/releases/latest/download/fintrack-ai.apk
```

It should download the file straight away. This link always points to your **newest** release, so you won't need to change the website for updates.

## Step 9: Set your link in the website

Open `website/index.html` in VS Code. Near the bottom, find these lines and edit them:

```js
var APK_URL = "https://github.com/YOUR-GITHUB-USERNAME/fintrack-ai-releases/releases/latest/download/fintrack-ai.apk";
var WEB_APP_URL = "";
var VERSION = "1.0.0";
```

- Replace `YOUR-GITHUB-USERNAME` with your GitHub username.
- Leave `WEB_APP_URL` empty. iPhone users then see "coming soon".

Double-click `website/index.html` to preview it in your browser. Tap **Android**; the download should start.

## Step 10: Publish the website on Netlify

1. Open https://app.netlify.com/drop.
2. Drag the **`website` folder** onto the page. It must contain only `index.html` and `icon.png`. Do **not** put the APK in it.
3. You get a live link right away. **Claim the site within one hour** by signing in or signing up when Netlify asks. Unclaimed sites are deleted.
4. Open **Site configuration**, then **Change site name**, and pick something short, such as `fintrack-ai`. Your link becomes `https://fintrack-ai.netlify.app`.

## Step 11: Tell Supabase your website address

In the Supabase dashboard open **Authentication**, then **URL Configuration**:

- Set **Site URL** to your Netlify link.
- Add the same link under **Redirect URLs**.

Without this, the email confirmation link (if you have confirmation turned on) sends people to the wrong place.

## Step 12: Test like a real user

On an Android phone:

1. Open your Netlify link in Chrome.
2. Tap **Android**. The download starts.
3. Open the downloaded file. If asked, allow **Install unknown apps** for Chrome, then tap **Install**. If Google Play Protect warns you, tap **More details**, then **Install anyway**. This is normal for apps outside the Play Store.
4. Open FinTrack AI, create an account, add a transaction, then ask the AI a question.

Share the Netlify link with anyone.

---

## Publishing an update later

1. Change your code and test it.
2. In `app.json`, raise `"version"` (for example `1.0.1`).
3. Build again (Step 6) and download and rename the APK to `fintrack-ai.apk` (Step 7).
4. On GitHub, create a **new release** (tag `v1.0.1`) and attach the new `fintrack-ai.apk` (Step 8).
5. In `website/index.html`, change `VERSION`, then drag the `website` folder onto the **Deploys** page of your Netlify site.

Users download the new file and install it over the old one. Their data stays because it lives in their account. `eas.json` raises the internal build number automatically so the new file always counts as newer.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| "App not installed" | Uninstall any older copy of FinTrack AI first, then try again. This happens when the signing key differs. |
| Build fails on EAS | Open the build page, then **Build logs**, and read the first red error. Run `npx tsc --noEmit` locally to catch code errors first. |
| App opens but sign-in or AI fails | The Supabase URL and key in `eas.json` must match your `.env`. Check that the Edge Function is deployed and the `GEMINI_API_KEY` secret is set. |
| Netlify upload hangs | The `website` folder has something large in it. It should only have `index.html` and `icon.png`. |
| Android button says "link isn't set up yet" | Step 9: replace `YOUR-GITHUB-USERNAME` in `APK_URL`, then upload the folder again. |
| GitHub link gives a 404 | The repository must be public, a release must be published, and the file must be named exactly `fintrack-ai.apk`. |
| iPhone users can't install | Apple only allows App Store or TestFlight installs, both of which need a paid $99 a year account. Use the web version instead. |

## Good to know

- The keys in `eas.json` are your Supabase **publishable** values. They are meant to be public and are inside every copy of the app anyway. **Never** put your Supabase `secret` key or your Gemini key in `eas.json`, `.env` or the website.
- The free Expo plan limits how many builds you get per month. Check https://expo.dev/pricing for the current allowance.
