# 🔑 Generate Your API Key

Before deploying to ChatGPT, you need to generate a secure API key.

## Quick Generate

Run this command to generate a secure API key:

```bash
node -e "console.log('sk-' + require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
sk-a1b2c3d4e5f6... (64 character random key)
```

## Add to .env

Copy the generated key and add it to your `.env` file:

```bash
echo "CHATGPT_API_KEY=<your-generated-key>" >> .env
```

## Use in Documentation

Replace `YOUR_GENERATED_API_KEY_HERE` in the setup guides with your actual key when:
- Setting Railway environment variables
- Configuring ChatGPT Custom GPT Actions
- Testing API endpoints

## Security Notes

- ✅ Generate a NEW key for each deployment
- ✅ Never commit the real key to git
- ✅ Store it securely in `.env` and Railway variables
- ✅ Rotate keys periodically
- ❌ Never share your key publicly
- ❌ Never hardcode in source files

---

**Generate now**: `node -e "console.log('sk-' + require('crypto').randomBytes(32).toString('hex'))"`
