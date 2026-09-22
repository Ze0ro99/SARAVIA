# SARAVIA Testnet

Pi Testnet build for `https://saravia1.netlify.app` on the Netlify site `saraviatest`, branch `Testnet`.

This folder is the site root. Upload **these contents** to the root of the `Testnet` branch. Do not put them inside another folder, and do not use this URL, app, or API key on Mainnet.

## Developer Portal

Create a separate app in Pi Browser. Network cannot be changed later.

| Field | Value |
|---|---|
| App name | SARAVIA Testnet |
| Network | Pi Testnet |
| Development URL | `http://localhost:8888` |
| Production URL | `https://saravia1.netlify.app` |
| Validation file | `validation-key.txt` at the site root |

After the app exists:

1. Copy the portal validation key into `public/validation-key.txt`. The file must contain only that key.
2. Verify the domain in the portal.
3. Create the Testnet API key and the Testnet app wallet. Fund the wallet from the Testnet faucet.

## Netlify

| Setting | Value |
|---|---|
| Site | `saraviatest` |
| Branch | `Testnet` |
| Build command | `npm install --omit=dev` (also in `netlify.toml`) |
| Publish directory | `public` |
| Functions directory | `netlify/functions` |
| Node | 20 |

Environment variables, set on `saraviatest` only. Never commit them.

```text
PI_NETWORK=testnet
PI_API_KEY=<TESTNET_APP_API_KEY>
PI_APP_ID=<TESTNET_APP_ID>
PI_APP_WALLET_PRIVATE_SEED=<TESTNET_APP_WALLET_SEED>
```

`PI_NETWORK` must be exactly `testnet`. Every function stops if that value is missing or if `PI_API_KEY` is missing. The wallet seed must be the secret of the Testnet project wallet (it starts with `S`). The browser never receives the seed or the API key.

Claims are stored in Netlify Blobs (store name `saravia-testnet`). They survive deploys. A memory store is not used, so a second Get Pi for the same `uid` stays blocked.

## What the site does

- Loads `https://sdk.minepi.com/pi-sdk.js` and calls `Pi.init({ version: "2.0", sandbox: true })`.
- Pi login only. Scopes: `username`, `payments`, `wallet_address`. No email, Google, Apple, or Stripe sign-in.
- `pi-me` checks the access token with `GET https://api.minepi.com/v2/me`.
- **Get Pi** sends `0.1` Test-Pi once, memo `SARAVIA Testnet welcome bonus`.
- **Send 0.1 support** is a user-to-app payment, memo `SARAVIA Testnet support`. The supporter mark is stored only after Pi completes it. A cancel does not unlock it.
- The next login finishes an incomplete payment when a transaction id already exists.

| Function | Role |
|---|---|
| `/.netlify/functions/pi-me` | Verify the access token |
| `/.netlify/functions/pi-approve` | Approve the support payment |
| `/.netlify/functions/pi-complete` | Complete a payment and unlock support |
| `/.netlify/functions/pi-cancel` | Cancel a payment and keep support locked |
| `/.netlify/functions/pi-get-pi` | One-time app-to-user Get Pi |

Get Pi uses the Platform API shape `{ "payment": { amount, memo, metadata, uid } }`, then submits a native Test-Pi transfer on `https://api.testnet.minepi.com` with the payment id as the memo. The app wallet can send only one transfer at a time.

## Before calling it done

Open `https://saravia1.netlify.app` in Pi Browser:

1. The black and yellow Testnet bar is visible.
2. Outside Pi Browser, the page says to open it in Pi Browser.
3. Continue with Pi asks for `username`, `payments`, and `wallet_address`.
4. The username appears after `/me` succeeds.
5. The pioneer wallet and the app wallet both hold Test-Pi from the faucet.
6. Get Pi sends `0.1` once. The second tap says already claimed.
7. A `0.1` support payment approves and completes, then the supporter mark unlocks.
8. An incomplete payment with a transaction id is recovered on the next sign-in.
9. A cancelled payment does not unlock support.
10. This site has no Mainnet key.

Do not merge this to Mainnet. Mainnet needs a different URL, Developer Portal app, and API key, with `sandbox: false`.
