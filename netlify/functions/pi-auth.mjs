import { authenticatedUser, failure, input, json, saveUser } from './_pi.mjs';
export default async req => {
  try {
    const { accessToken } = await input(req);
    const user = await authenticatedUser(req, accessToken);
    await saveUser(user);
    return json({ uid: user.uid, username: user.username, wallet_address: user.wallet_address });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-auth' };
