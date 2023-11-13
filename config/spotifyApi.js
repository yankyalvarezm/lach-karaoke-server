// config/spotifyApi.js
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

let tokenExpirationEpoch;

const setTokenExpiration = (expiresIn) => {
  const currentTime = new Date().getTime();
  tokenExpirationEpoch = currentTime + expiresIn * 1000;
};

const refreshTokenIfNeeded = () => {
  if (!tokenExpirationEpoch || new Date().getTime() > tokenExpirationEpoch) {
    return spotifyApi.clientCredentialsGrant().then(data => {
      spotifyApi.setAccessToken(data.body['access_token']);
      setTokenExpiration(data.body['expires_in']);
    }).catch(error => {
      console.error('Error retrieving an access token', error);
    });
  }
  return Promise.resolve();
};

module.exports = { spotifyApi, refreshTokenIfNeeded };
