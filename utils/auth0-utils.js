import { ManagementClient } from 'auth0';
export async function getUpstreamAccessToken(userId, provider = 'google-oauth2') {
  try {
    const management = new ManagementClient({
      domain: process.env.AUTH0_M2M_DOMAIN,
      clientId: process.env.AUTH0_M2M_CLIENT_ID,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
      scope: 'read:users read:user_idp_tokens'
    });
    const user = await management.users.get({ id: userId });
    const identity = user.data.identities.find(id => id.provider === provider);
    if (!identity?.access_token) {
      throw new Error('No Google access token found');
    }
    return identity.access_token;
  } catch (error) {
    console.error('Error retrieving upstream access token:', error);
    throw error;
  }
}
