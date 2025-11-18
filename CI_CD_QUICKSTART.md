# CI/CD Quick Start Guide

Get the CI/CD pipeline running in 5 minutes!

## Prerequisites

- Git repository on GitHub
- Node.js 20+ and pnpm 9+
- Access to repository settings

## Step 1: Install Dependencies

```bash
# Install new dependencies
pnpm add -D @next/bundle-analyzer husky lint-staged @lhci/cli

# Install all dependencies
pnpm install
```

## Step 2: Initialize Git Hooks

```bash
# Setup Husky
pnpm prepare

# This creates .husky/_/ directory and installs hooks
```

## Step 3: Configure GitHub Secrets

Go to your GitHub repository settings:

**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

```
# Codecov (optional but recommended)
CODECOV_TOKEN=<your-codecov-token>

# Staging Environment
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/db
STAGING_NEXTAUTH_SECRET=<generate-with-openssl>
STAGING_NEXTAUTH_URL=https://staging.your-domain.com

# Production Environment
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/db
PRODUCTION_NEXTAUTH_SECRET=<generate-with-openssl>
PRODUCTION_NEXTAUTH_URL=https://your-domain.com

# Optional: Notifications
SLACK_WEBHOOK_URL=<your-slack-webhook>
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## Step 4: Update README Badges

Edit `README.md` and replace `YOUR_USERNAME` with your GitHub username/organization:

```markdown
[![CI](https://github.com/YOUR_USERNAME/golf-turnament/actions/workflows/ci.yml/badge.svg)]
```

## Step 5: Test Locally

```bash
# Run code quality checks
pnpm validate

# Run all tests
pnpm test:all

# Check bundle size
pnpm check:bundle-size

# Format code
pnpm format
```

## Step 6: Make Your First Commit

```bash
# Add all files
git add .

# Commit (will trigger pre-commit hooks)
git commit -m "feat: setup CI/CD pipeline"

# Push (will trigger pre-push hooks and CI)
git push
```

## Step 7: Verify CI

1. Go to GitHub → Actions tab
2. You should see the CI workflow running
3. Wait for all checks to pass ✅

## Step 8: Create a Test PR

```bash
# Create feature branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> TEST.md

# Commit and push
git add TEST.md
git commit -m "test: verify CI/CD pipeline"
git push -u origin test/ci-pipeline
```

Create PR on GitHub and verify:
- ✅ All CI checks run
- ✅ PR gets auto-labeled
- ✅ PR summary comment appears
- ✅ Coverage diff comment (if tests changed)

## Common Issues

### "Husky command not found"

```bash
pnpm install
pnpm prepare
```

### "ESLint errors blocking commit"

```bash
# Fix automatically
pnpm lint:fix

# Or skip hooks (not recommended)
git commit --no-verify -m "message"
```

### "Tests failing in CI but passing locally"

- Check environment variables in workflow
- Ensure database is properly set up
- Review workflow logs in GitHub Actions

### "Bundle size check failing"

```bash
# Check current bundle size
pnpm analyze

# View detailed analysis
pnpm analyze:bundle
```

## Optional: Codecov Setup

1. Go to https://codecov.io
2. Sign in with GitHub
3. Add your repository
4. Copy the token
5. Add as `CODECOV_TOKEN` secret in GitHub

## Optional: Lighthouse CI

```bash
# Install Lighthouse CI
pnpm add -D @lhci/cli

# Run locally
pnpm lighthouse
```

## Next Steps

1. **Read Full Documentation**: [docs/CI_CD.md](./docs/CI_CD.md)
2. **Configure Deployments**: Update deployment steps in workflows
3. **Set Up Environments**: Create staging and production environments in GitHub
4. **Enable Branch Protection**: Require CI checks before merge
5. **Add More Tests**: Increase coverage to 80%+

## Git Workflow

```
1. Create feature branch from develop
   git checkout -b feat/my-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add new feature"

3. Push and create PR
   git push -u origin feat/my-feature

4. Wait for CI to pass
   (Check GitHub Actions)

5. Request review and merge
   (All checks must pass)

6. Deploy to staging
   (Automatic on merge to develop)

7. Deploy to production
   (Merge to main or create tag)
```

## Useful Commands

```bash
# Quality Checks
pnpm validate              # Run all checks
pnpm lint:fix              # Auto-fix lint issues
pnpm format                # Format all files
pnpm type-check            # Check TypeScript

# Testing
pnpm test                  # Run unit tests
pnpm test:coverage         # With coverage
pnpm test:e2e              # Run E2E tests
pnpm test:all              # Run everything

# Development
pnpm dev                   # Start dev server
pnpm build                 # Build for production
pnpm start                 # Start production server

# Database
pnpm db:migrate            # Run migrations
pnpm db:seed               # Seed data
pnpm db:studio             # Open Prisma Studio

# Utilities
pnpm clean                 # Remove build artifacts
```

## Troubleshooting

### CI/CD Issues

**Problem**: Workflow not running
- Check `.github/workflows/` files exist
- Verify GitHub Actions is enabled in repo settings

**Problem**: Secrets not working
- Verify secret names match exactly
- Check environment configuration

**Problem**: Tests failing in CI
- Review workflow logs
- Check environment variables
- Ensure database is set up correctly

### Git Hooks Issues

**Problem**: Hooks not running
```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg
```

**Problem**: Commit message validation failing
- Use conventional commit format:
  `type(scope): description`
- Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

## Support

- **Documentation**: [docs/CI_CD.md](./docs/CI_CD.md)
- **Issues**: GitHub Issues
- **Team**: Contact DevOps team

---

**Ready to Go!** 🚀

Your CI/CD pipeline is now configured and ready to ensure code quality and automate deployments.
