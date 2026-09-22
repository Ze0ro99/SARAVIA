# SARAVIA Mainnet

The main branch is the production Mainnet build for SARAVIA. It is isolated from the Testnet build at https://saravia1.netlify.app.

Read MAINNET_GUIDE.md before configuring the separate saravia-mainnet Netlify site. Mainnet uses a new Pi Developer Portal app, URL, API key, confirmed wallet, and sandbox: false. Real Pi payments are irreversible.

The Mainnet validation file is intentionally not populated in this repository. After creating the Mainnet app, place that app's validation value at public/validation-key.txt on the Mainnet site only. Never copy the Testnet validation value.
