import { authenticatedUser, env, failure, input, getClaim, json, saveUser } from './_pi.mjs';

export default async req => {
  try {
    const { accessToken } = await input(req);
    const user = await authenticatedUser(req, accessToken);
    await saveUser(user);
    const claim = await getClaim(user.uid);
    return json({ uid: user.uid, username: user.username, wallet_address: user.wallet_address, claimed: claim?.status === 'claimed', claimStatus: claim?.status || 'not_claimed', getPiEnabled: env('PI_ENABLE_GET_PI') === 'true' });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-me' };
