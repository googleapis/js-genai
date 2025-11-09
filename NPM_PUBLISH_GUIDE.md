# NPM Publishing Guide for @githubmann/google-genai

## Prerequisites

1. **npm Account**: You need an npm account with username `githubmann`
   - If you don't have one: https://www.npmjs.com/signup
   - Make sure your username is `githubmann` (for scoped package `@githubmann/google-genai`)

2. **Two-Factor Authentication**: Recommended for publishing packages
   - Enable at: https://www.npmjs.com/settings/YOUR_USERNAME/tfa

## Step 1: Login to npm

```bash
npm login
```

This will prompt you for:
- Username: `githubmann`
- Password: (your npm password)
- Email: (your email)
- OTP: (if 2FA is enabled)

Verify login:
```bash
npm whoami
# Should output: githubmann
```

## Step 2: Verify Package Configuration

Check that everything is correct:

```bash
# View package info
npm pack --dry-run

# This will show what files will be published
# Should see: dist/*, docs/*, README.md, etc.
```

## Step 3: Test the Package Locally

Before publishing, test that the package works:

```bash
# Install locally
npm install -g .

# Or test in another project
cd /tmp
npm install /path/to/js-genai
```

## Step 4: Publish to npm

### For Public Package (Recommended)

```bash
npm publish --access public
```

**Note**: Scoped packages (`@username/package`) are private by default.
The `--access public` flag makes it publicly available for free.

### Expected Output

```
npm notice
npm notice package: @githubmann/google-genai@1.29.0
npm notice === Tarball Contents ===
npm notice 358KB  dist/genai.d.ts
npm notice 660KB  dist/index.mjs
npm notice ...
npm notice === Tarball Details ===
npm notice name:          @githubmann/google-genai
npm notice version:       1.29.0
npm notice filename:      githubmann-google-genai-1.29.0.tgz
npm notice package size:  XXX kB
npm notice unpacked size: XXX kB
npm notice shasum:        ...
npm notice integrity:     ...
npm notice total files:   XX
npm notice
+ @githubmann/google-genai@1.29.0
```

## Step 5: Verify Publication

1. Check on npm website:
   ```
   https://www.npmjs.com/package/@githubmann/google-genai
   ```

2. Try installing:
   ```bash
   npm install @githubmann/google-genai
   ```

3. Test it works:
   ```bash
   node -e "const {GoogleGenAI} = require('@githubmann/google-genai'); console.log('✓ Works!')"
   ```

## Troubleshooting

### Error: 403 Forbidden

**Cause**: You don't have permission to publish under the `@githubmann` scope.

**Solution**:
- Make sure you're logged in as `githubmann`
- Or change the package name to `@YOUR_USERNAME/google-genai`

### Error: Package already exists

**Cause**: Version `1.29.0` is already published.

**Solution**: Bump the version:
```bash
npm version patch  # 1.29.0 -> 1.29.1
# or
npm version minor  # 1.29.0 -> 1.30.0
```

### Error: Need to verify email

**Cause**: Your npm email is not verified.

**Solution**: Check your email and verify it, or verify at:
```
https://www.npmjs.com/email-edit
```

## Publishing Updates

When you make changes and want to publish a new version:

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new feature"

# 2. Bump version
npm version patch  # or minor/major

# 3. Build
npm run build-prod

# 4. Publish
npm publish --access public

# 5. Push git tags
git push --follow-tags
```

## Package Information

- **Package Name**: `@githubmann/google-genai`
- **Current Version**: `1.29.0`
- **License**: Apache-2.0
- **Repository**: https://github.com/kaneruan/js-genai
- **Registry**: https://registry.npmjs.org/

## Support

If you encounter issues:
1. Check npm status: https://status.npmjs.org/
2. npm documentation: https://docs.npmjs.com/
3. Contact npm support: https://www.npmjs.com/support

## Security Best Practices

1. ✅ Enable 2FA on your npm account
2. ✅ Use `npm audit` to check for vulnerabilities
3. ✅ Never commit npm auth tokens to git
4. ✅ Review package contents before publishing (`npm pack --dry-run`)
5. ✅ Use `--access public` for free public packages

---

**Ready to publish?** Run:

```bash
npm login
npm publish --access public
```

Good luck! 🚀
