# Saravia Pi Mainnet launch

Saravia is a tourism, travel, logistics, and hotel company. Its Pi donation flow is complete and fixed at **0.1 Pi**. A Pioneer can donate repeatedly; every payment is separately approved, completed, and recorded. Wallet addresses and wallet passphrases must not be added to this repository.

## Final developer steps

1. Open the Pi Developer Portal in Pi Browser and select the **Saravia** app.
2. Set the app's production URL to the deployed Netlify HTTPS domain. Add the same domain to the Pi Platform/API settings.
3. Complete Pi's domain validation using the existing `validation-key.txt` at the site root. Confirm that `https://YOUR_DOMAIN/validation-key.txt` returns the exact validation value before selecting **Verify domain**.
4. Enable **Mainnet** and **User-to-App payments** for Saravia. The frontend already initializes SDK 2.0 with `sandbox: false`.
5. Copy the app's server API key from the Developer Portal. In Netlify, open **Project configuration → Environment variables**, add `PI_API_KEY`, and scope it to production (and deploy previews only if explicitly required). Never place this value in client code or documentation.
6. Redeploy the site so the server functions receive the environment variable and Netlify applies the included payment-table migration.
7. In Pi Browser, sign in with a mainnet-enabled account, press **Donate 0.1 Pi**, approve the wallet prompt, and confirm the success message. Check the Developer Portal payment record and the Netlify function logs for the same payment ID.

## Mainnet listing checklist

- Complete the app owner/developer KYC required by the Pi Developer Portal.
- Confirm the registered production URL uses HTTPS, does not begin with “pi”, and uses Saravia branding without imitating Pi's logo or visual identity.
- Keep the production experience fully functional in Pi Browser and use Pi authentication as its sign-in mechanism.
- Keep transactions in the Pi-facing production experience Pi-only. Do not add fiat or non-Pi token checkout to this Mainnet payment page.
- Keep users inside the Pi Browser experience and avoid unnecessary external redirects.
- Collect only information required to provide Saravia's service, and publish the applicable privacy terms before requesting personal travel or booking details.

## Important operational notes

- Pi Network sends funds to the wallet configured for Saravia in the Pi Developer Portal; no private wallet key is used by this code.
- Keep `PI_API_KEY` server-only. Rotate it in the Developer Portal and Netlify if it is ever exposed.
- The server verifies each Pi access token through `/v2/me` and trusts only the returned user identity.
- The server rejects payments that are not on **Pi Network Mainnet**, are not user-to-app, do not belong to the authenticated Pioneer, are not exactly 0.1 Pi, or do not carry Saravia's donation metadata.
- Testnet testing requires a deliberate temporary code/config change to `sandbox: true` and a testnet API key. Do not use a test key with this mainnet configuration.
- The incomplete-payment callback completes an already-submitted transaction or clears an unapproved payment, preventing a user from becoming stuck.

Reference: [Pi SDK documentation](https://docs.minepi.com/)
