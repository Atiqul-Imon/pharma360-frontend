# Pharma360 Frontend

## Local Development
```bash
npm install
npm run dev
```

Environment variables (create `.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Production Build Check
```bash
npm run lint
npm run build
```

## Deploying to Vercel
1. Push the repository to GitHub/GitLab/Bitbucket.
2. Create a new Vercel project and import the repo.
3. Set environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`
4. Leave build command as `npm run build` and output directory as `.next`.
5. Trigger deployment – Vercel will handle builds for preview & production branches automatically.

For more detailed guidance see `DEPLOYMENT.md` in this directory or `docs/deployment/vercel-frontend.md`.
