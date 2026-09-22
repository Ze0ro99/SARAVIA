import { authenticatedUser, failure, input, getClaim, json, saveUser } from './_pi.mjs';

export default async req => {
  try {
    const { accessToken } = await input(req);
    const user = await authenticatedUser(req, accessToken);
    await saveUser(user);
    const claim = await getClaim(user.uid);
    const getPiEnabled = process.env.PI_ENABLE_GET_PI === 'true' || (globalThis.Netlify?.env?.get && Netlify.env.get('PI_ENABLE_GET_PI') === 'true');
    return json({ uid: user.uid, username: user.username, wallet_address: user.wallet_address, claimed: claim?.status === 'claimed', claimStatus: claim?.status || 'not_claimed', getPiEnabled });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-me' };
