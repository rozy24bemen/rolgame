# Deploy to Firebase Hosting

This repo is configured to deploy the web app (`apps/web`) to Firebase Hosting.

## Prerequisites
- Firebase project ID (e.g. `my-project-id`).
- A service account JSON with the role `Firebase Hosting Admin` (or Owner) for CI.
- Locally: Firebase CLI installed.

## Files
- `firebase.json` – Hosting config, serves `apps/web/dist` and rewrites to `index.html`.
- `.firebaserc` – Set `projects.default` to your project ID.
- `.github/workflows/deploy-firebase.yml` – Builds the web app and deploys to Hosting on pushes to `main`.

## Local one-off deploy
```powershell
# From repo root
npm ci
cd apps/web; npm ci; npm run build; cd ../..
# Set default project (writes .firebaserc)
firebase use YOUR_FIREBASE_PROJECT_ID
# Deploy hosting
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

## GitHub Actions (recommended)
1) Create two repository secrets:
   - `FIREBASE_PROJECT_ID` = your Firebase project ID.
   - `FIREBASE_SERVICE_ACCOUNT` = the JSON contents of a service account key with Hosting permissions.
2) Push to `main`. The workflow `Deploy Web to Firebase Hosting` will build and deploy to the `live` channel.

## Notes
- Never commit service account files. Use GitHub Secrets.
- If you use preview channels instead of `live`, change `channelId` in the workflow.
- If you have multiple environments, add targets or use multiple projects in `.firebaserc`.