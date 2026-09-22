import { authenticatedUser, failure, input, json } from './_pi.mjs';

export default async req => {
  try {
    await input(req);
    const user = await authenticatedUser(req);
    return json({ uid: user.uid, username: user.username });
  } catch (error) { return failure(error); }
};

export const config = { path: '/.netlify/functions/pi-auth' };
