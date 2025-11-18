# CI/CD Pipeline Documentation

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Environment Variables](#environment-variables)
- [Secrets Management](#secrets-management)
- [Adding New Checks](#adding-new-checks)
- [Debugging CI Failures](#debugging-ci-failures)
- [Deployment Process](#deployment-process)
- [Best Practices](#best-practices)

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment (CI/CD). The pipeline ensures code quality, runs comprehensive tests, and automates deployments to staging and production environments.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Code Quality │  │ Unit Tests   │  │ Integration  │    │
│  │   Checks     │  │   Coverage   │  │    Tests     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│         └─────────────────┼─────────────────┘             │
│                           │                               │
│                    ┌──────▼───────┐                       │
│                    │  Build Check  │                       │
│                    └──────┬───────┘                       │
│                           │                               │
│         ┌─────────────────┼─────────────────┐            │
│         │                 │                 │            │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐   │
│  │  E2E Tests   │  │   Security   │  │   Database   │   │
│  │              │  │     Scan     │  │    Schema    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                    ┌──────▼───────┐                      │
│                    │   Deploy     │                      │
│                    └──────────────┘                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Workflows

### 1. Main CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`, `develop`, and `claude/**` branches.

#### Jobs:

**Code Quality:**
- ESLint checks with zero warnings allowed
- Prettier formatting validation
- TypeScript type checking
- Unused imports detection

**Unit Tests:**
- Runs Vitest unit tests with coverage
- Enforces 80% coverage threshold
- Uploads coverage to Codecov
- Generates HTML coverage reports

**Integration Tests:**
- Sets up PostgreSQL test database
- Runs database migrations
- Seeds test data
- Executes integration tests
- Cleans up database after tests

**E2E Tests:**
- Installs Playwright browsers
- Runs end-to-end tests in headless mode
- Captures screenshots on failure
- Uploads test artifacts

**Build Verification:**
- Builds Next.js application
- Analyzes bundle size
- Checks bundle size thresholds
- Uploads build artifacts

**Security Scan:**
- Runs npm audit for vulnerabilities
- Performs CodeQL static analysis
- Scans for secrets using Gitleaks
- Generates security reports

**Database Schema Check:**
- Validates Prisma schema
- Checks for schema drift
- Verifies no pending migrations
- Ensures schema consistency

### 2. Pull Request Workflow (`.github/workflows/pr.yml`)

Runs on pull requests with additional PR-specific checks.

#### Features:

- **PR Title Validation:** Enforces conventional commits format
- **Changed Files Analysis:** Identifies affected code areas
- **Auto-labeling:** Automatically labels PRs based on changed files
- **Size Labels:** Adds size labels (XS, S, M, L, XL, XXL)
- **Coverage Diff:** Comments coverage changes on PRs
- **PR Summary:** Posts comprehensive check results

### 3. Staging Deployment (`.github/workflows/deploy-staging.yml`)

Triggers on push to `develop` branch.

#### Steps:

1. Run all quality checks and tests
2. Build application with staging environment variables
3. Deploy to staging environment
4. Run database migrations
5. Execute smoke tests
6. Send deployment notifications
7. Rollback on failure

### 4. Production Deployment (`.github/workflows/deploy-production.yml`)

Triggers on push to `main` branch or version tags (`v*.*.*`).

#### Steps:

1. Pre-deployment validation
2. Run comprehensive test suite
3. Security scan
4. Create backup
5. Deploy to production
6. Run database migrations
7. Execute smoke tests
8. Create GitHub release (if tagged)
9. Notify stakeholders
10. Emergency rollback on failure

## Environment Variables

### Required for CI

```bash
# Database
DATABASE_URL=postgresql://test:test@localhost:5432/golf_tournament_test

# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Codecov (optional but recommended)
CODECOV_TOKEN=your-codecov-token
```

### Required for Staging

```bash
STAGING_DATABASE_URL=
STAGING_NEXTAUTH_SECRET=
STAGING_NEXTAUTH_URL=
STAGING_URL=
```

### Required for Production

```bash
PRODUCTION_DATABASE_URL=
PRODUCTION_NEXTAUTH_SECRET=
PRODUCTION_NEXTAUTH_URL=
PRODUCTION_URL=
```

## Secrets Management

### Adding Secrets

1. Go to GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add the secret name and value

### Required Secrets

- `CODECOV_TOKEN` - For code coverage reporting
- `STAGING_DATABASE_URL` - Staging database connection
- `STAGING_NEXTAUTH_SECRET` - Staging authentication secret
- `STAGING_NEXTAUTH_URL` - Staging application URL
- `PRODUCTION_DATABASE_URL` - Production database connection
- `PRODUCTION_NEXTAUTH_SECRET` - Production authentication secret
- `PRODUCTION_NEXTAUTH_URL` - Production application URL
- `SNYK_TOKEN` - For security scanning (optional)
- `SLACK_WEBHOOK_URL` - For deployment notifications (optional)

### Best Practices

- Never commit secrets to version control
- Rotate secrets regularly
- Use environment-specific secrets
- Limit secret access to necessary workflows
- Use GitHub environments for deployment protection

## Adding New Checks

### Adding a New Job to CI

1. Edit `.github/workflows/ci.yml`
2. Add your new job:

```yaml
new-check:
  name: My New Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup
      run: pnpm install --frozen-lockfile
    - name: Run check
      run: pnpm my-check-command
```

3. Add the job to the `needs` array in `all-checks-passed`

### Adding a New Script

1. Create script in `scripts/` directory
2. Make it executable: `chmod +x scripts/my-script.sh`
3. Add script command to `package.json`
4. Reference in workflow file

## Debugging CI Failures

### Common Issues and Solutions

#### 1. ESLint Failures

```bash
# Run locally
pnpm lint:check

# Fix automatically
pnpm lint:fix
```

#### 2. Type Check Failures

```bash
# Run locally
pnpm type-check

# Common fixes:
# - Add missing types
# - Fix type errors
# - Update tsconfig.json
```

#### 3. Test Failures

```bash
# Run specific test
pnpm test path/to/test.spec.ts

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

#### 4. Build Failures

```bash
# Build locally
pnpm build

# Check for:
# - Missing environment variables
# - Import errors
# - Configuration issues
```

#### 5. Coverage Failures

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html
```

### Viewing Workflow Logs

1. Go to GitHub repository
2. Click "Actions" tab
3. Select the failed workflow
4. Click on the failed job
5. Expand failed step to view logs

### Re-running Failed Jobs

1. Open the failed workflow run
2. Click "Re-run jobs" → "Re-run failed jobs"

## Deployment Process

### Staging Deployment

1. Merge PR to `develop` branch
2. Workflow automatically triggers
3. Tests run
4. Application builds
5. Deploys to staging
6. Smoke tests execute
7. Notification sent

### Production Deployment

#### Option 1: Direct Push

1. Merge PR to `main` branch
2. Workflow automatically triggers
3. Full test suite runs
4. Security scan executes
5. Deploys to production
6. Smoke tests run
7. Notification sent

#### Option 2: Tagged Release

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Workflow triggers
3. Full deployment process
4. GitHub release created automatically

### Rollback Process

If deployment fails:

1. Workflow automatically attempts rollback
2. Previous version restored
3. Team notified
4. Investigate and fix issue
5. Redeploy when ready

Manual rollback:

```bash
# Using Vercel (example)
vercel rollback

# Using Kubernetes (example)
kubectl rollout undo deployment/app -n production
```

## Best Practices

### Git Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Push and create PR
4. Wait for CI checks to pass
5. Request review
6. Merge to `develop`
7. Deploy to staging
8. Test on staging
9. Merge to `main` for production

### Commit Messages

Use conventional commits:

```
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
style: format code with prettier
refactor: simplify user service
perf: optimize database queries
test: add unit tests for user service
build: update dependencies
ci: add security scanning
chore: update configuration
```

### Code Quality

- Run `pnpm validate` before committing
- Fix linting errors immediately
- Maintain test coverage above 80%
- Write meaningful commit messages
- Keep PRs focused and small

### Testing

- Write tests for new features
- Update tests when modifying code
- Run tests locally before pushing
- Ensure E2E tests cover critical paths
- Mock external dependencies

### Security

- Never commit secrets
- Keep dependencies updated
- Review security scan results
- Follow OWASP best practices
- Use environment variables for config

### Performance

- Monitor bundle size
- Optimize images
- Use code splitting
- Implement caching strategies
- Review Lighthouse scores

## Troubleshooting

### CI is too slow

- Run jobs in parallel
- Use caching effectively
- Optimize test suite
- Use matrix builds for multiple environments

### Flaky tests

- Identify and fix unreliable tests
- Add proper waits in E2E tests
- Mock time-dependent code
- Use test retry mechanisms

### Deploy failures

- Check environment variables
- Verify database connectivity
- Review deployment logs
- Test deployment process locally
- Validate configuration files

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## Support

For CI/CD issues:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Search existing GitHub issues
4. Create a new issue with relevant logs
5. Contact the development team
