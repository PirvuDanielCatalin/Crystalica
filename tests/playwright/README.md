# Playwright Configuration

This directory contains Playwright tests for Crystalica profile authentication and actions.

## Setup

```bash
cd /home/daniel/Workdir/PersonalGithub/Crystalica
npm install --save-dev @playwright/test
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests
npx playwright test tests/playwright/

# Run specific test file
npx playwright test tests/playwright/profile-auth.spec.ts

# Run unauthenticated tests only
npx playwright test tests/playwright/profile-auth.spec.ts -g "Unauthenticated"

# View report
npx playwright show-report
```

## Tests Coverage

### Unauthenticated Tests (Automated)
- Follow button hidden on other profile
- Move/remove actions hidden on other profile
- Community/Settings tabs hidden

### Authenticated Tests
Tests require manual authentication due to Clerk OAuth complexity. For authenticated testing, use manual login with:
- User: test@example.com
- Password: SmecherSmecher!132

Or use Playwright storage state by logging in once and saving cookies.

## Manual Verification Checklist

When making changes to profile authentication, verify:

### Unauthenticated User
- [ ] Visit `/@danielcatalinpirvu` - follow button hidden
- [ ] Crystal cards clickable (navigates to detail)
- [ ] Actions (move/remove) not visible
- [ ] Community/Settings tabs hidden

### Authenticated as @test
- [ ] Visit `/@test` - follow button hidden
- [ ] Move/remove actions visible on own crystals
- [ ] Portfolio tab works
- [ ] Community/Settings tabs hidden
- [ ] Visit `/@danielcatalinpirvu` - follow button visible (outlined black)
- [ ] Follow button hover: green background, checkmark visible
- [ ] Click follow: changes to "Deja urmăresc", green background
- [ ] Follow button hover when following: "Nu mai urmări" text, outlined black
- [ ] Crystal cards clickable (navigates to detail)
- [ ] Actions (move/remove) not visible

## Git Commit Rules

Tests must be committed and kept up to date with code changes. Run tests after each modification to ensure functionality remains correct.
