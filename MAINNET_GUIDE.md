# SARAVIA Mainnet guide

This is the Mainnet deployment guide for the main branch. Mainnet uses real Pi and community payments are irreversible. Testnet remains isolated at https://saravia1.netlify.app on the Testnet branch and must not be changed by this guide.

## 1. Isolation contract

Testnet stays: app SARAVIA Testnet, Netlify site saraviatest, branch Testnet, URL https://saravia1.netlify.app, Testnet API key, Test-Pi wallet, and sandbox: true.

Mainnet is separate: app SARAVIA, Netlify site saravia-mainnet, branch main, a new HTTPS or auction .pi URL, a new Mainnet API key, a confirmed Mainnet wallet, sandbox: false, and real Pi. Never put Testnet values on the Mainnet site. Never point the Testnet URL at the Mainnet app.

## 2. Pi Developer Portal

In Pi Browser create a new app. Do not edit SARAVIA Testnet.

- App name: SARAVIA
- Description: tourism, travel, hotels, and logistics paid in Pi
- Network: Pi Mainnet
- Production URL: the new Mainnet Netlify URL or auction .pi URL
- Development URL: optional; never use the Testnet URL

Generate this app's new API key. Put its validation value in public/validation-key.txt on the Mainnet site only, verify the domain, and confirm the Mainnet app wallet below. Apply for Ecosystem listing after one successful live payment. The verified Mainnet URL must not be https://saravia1.netlify.app.

## 3. Netlify and GitHub

Create or configure the separate Netlify site saravia-mainnet from saramoustafa880-del/SARAVIA with production branch main. Set the Mainnet domain as the production URL.

Required production environment variables:

PI_NETWORK=mainnet
PI_API_KEY=<MAINNET_APP_API_KEY>
PI_APP_ID=<MAINNET_APP_ID>
PI_APP_WALLET_PRIVATE_SEED=<MAINNET_APP_WALLET_SEED>

Optional A2U flag, only after the funded app wallet is ready:

PI_ENABLE_GET_PI=true

Use a protected GitHub environment named mainnet with the same values and required reviewers. Never copy Testnet keys, seeds, URLs, or wallet values. The server rejects any environment that is not explicitly mainnet.

## 4. Mainnet wallet

Complete KYC or any eligible wallet activation. In Pi Wallet switch to Mainnet, finish the Mainnet Checklist, confirm the wallet, and enable 2FA using an email you own. Open that wallet once so the Developer Portal selects the intended developer wallet. Fund it with a small real-Pi balance before enabling A2U.

There is no team wallet. Use Support → Pi Mainnet SDK Wallet when the portal provides that route. Keep the seed only in Netlify. A lost seed is unrecoverable.

## 5. SDK and login

The published Mainnet page loads https://sdk.minepi.com/pi-sdk.js once and initializes Pi with version 2.0 and sandbox false. The app works in Pi Browser only.

Login is Pi-only. No email, password, Google, Apple, or Stripe login is included. The Continue with Pi button calls Pi.authenticate only after a tap with these scopes:

username, payments, wallet_address

The browser posts the accessToken to /.netlify/functions/pi-me. The backend verifies it with GET https://api.minepi.com/v2/me using Authorization: Bearer <accessToken>, stores uid, username, and wallet_address only after verification, and then returns the Mainnet session. Testnet and Mainnet uids are different. If window.Pi is missing, show: Open SARAVIA in Pi Browser to sign in.

The login callback runs incomplete-payment recovery. A submitted transaction is completed; an unapproved stuck payment can be cancelled. Neither path unlocks a service before completion.

## 6. Required community U2A payment

The community support flow pays 0.1 Pi with memo SARAVIA mainnet support. Booking deposits may use SARAVIA booking <id>. The user reviews the amount and memo in Pi Wallet and signs. The server approves and completes through https://api.minepi.com/v2 using the Mainnet key. Unlock a service only after completion succeeds. Cancellation means not paid.

The first live test must be 0.01 Pi. After that, test the 0.1 Pi support memo and a booking memo. Payment records are stored in the Mainnet database.

## 7. Optional Get Pi A2U

Get Pi is disabled unless PI_ENABLE_GET_PI=true and PI_APP_WALLET_PRIVATE_SEED is present. Enable it only after the Mainnet app wallet is funded. It sends 0.01 Pi once per Mainnet uid with memo SARAVIA welcome bonus. Claims are persisted in the Mainnet database. The server uses pi-backend to create, submit, and complete the payment; the seed never reaches the browser. There is no public faucet. A claimed button becomes Already claimed.

## 8. Deployment checklist in Pi Browser

- The Mainnet URL shows no Testnet bar.
- Pi.init uses sandbox false.
- Continue with Pi requests username, payments, and wallet_address.
- The /me response belongs to the SARAVIA Mainnet app.
- The confirmed Mainnet wallet was opened and has a small real-Pi balance.
- A 0.01 Pi U2A test appears in Pi Wallet.
- Approve and complete return success using the Mainnet key.
- The service unlocks only after completion.
- Cancelled payments do not unlock anything.
- Relogin recovers incomplete payments without double charging.
- The Mainnet site has no Testnet key, seed, URL, or sandbox true.
- https://saravia1.netlify.app still serves the Testnet branch.
- Get Pi remains off unless the funded A2U wallet is intentionally enabled.
- Apply for Ecosystem listing only after the live payment succeeds.

## 9. Promotion and failure handling

Finish and validate Testnet first. Promote with a pull request from Testnet to main. Before merging, remove hardcoded Testnet URLs, keys, and sandbox true. Do not switch saraviatest to main. Deploy main to saravia-mainnet with Mainnet environment values, then make the tiny real-Pi payment on the Mainnet URL.

A 401 from approve or complete usually means the wrong key or app/network; replace the Mainnet key rather than retrying with Testnet. A wallet error means confirm the wallet and 2FA. App unknown means the URL belongs to another Portal app. Early unlock means wait for complete. If Testnet fails, verify saraviatest still deploys the Testnet branch.
