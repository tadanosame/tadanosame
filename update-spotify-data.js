import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

// Spotify APIの認証情報
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// アクセストークンを取得する関数
async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN
    })
  });

  const data = await response.json();
  return data.access_token;
}

// 現在再生中の曲を取得する関数
async function getNowPlaying(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 204) {
    return null; // 何も再生していない
  }

  const data = await response.json();
  return data;
}

// 最近再生した曲を取得する関数
async function getRecentlyPlayed(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  return data.items;
}

// よく聴くアーティストを取得する関数
async function getTopArtists(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=3', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  return data.items;
}

// README.mdを更新する関数
async function updateReadme() {
  try {
    const accessToken = await getAccessToken();
    const nowPlaying = await getNowPlaying(accessToken);
    const recentlyPlayed = await getRecentlyPlayed(accessToken);
    const topArtists = await getTopArtists(accessToken);

    // 現在再生中の曲の情報を整形
    let nowPlayingText = '🎵 **現在再生中の曲はありません**';
    if (nowPlaying && nowPlaying.item) {
      const track = nowPlaying.item;
      const artistNames = track.artists.map(artist => artist.name).join(', ');
      nowPlayingText = `🎵 **現在再生中**: [${track.name}](${track.external_urls.spotify}) by ${artistNames}`;
    }

    // 最近再生した曲の情報を整形
    let recentlyPlayedText = '### 🕒 最近再生した曲\n\n';
    if (recentlyPlayed && recentlyPlayed.length > 0) {
      recentlyPlayedText += recentlyPlayed.map((item, index) => {
        const track = item.track;
        const artistNames = track.artists.map(artist => artist.name).join(', ');
        return `${index + 1}. [${track.name}](${track.external_urls.spotify}) - ${artistNames}`;
      }).join('\n');
    } else {
      recentlyPlayedText += '最近再生した曲はありません';
    }

    // よく聴くアーティストの情報を整形
    let topArtistsText = '### 👑 よく聴くアーティスト TOP 3\n\n';
    if (topArtists && topArtists.length > 0) {
      topArtistsText += topArtists.map((artist, index) => {
        return `${index + 1}. [${artist.name}](${artist.external_urls.spotify})`;
      }).join('\n');
    } else {
      topArtistsText += 'データがありません';
    }

    // READMEの内容を作成
    const readmeContent = `
# こんにちは、私のGitHubプロフィールへようこそ！ 👋

## 🎧 Spotify の状態

${nowPlayingText}

${recentlyPlayedText}

${topArtistsText}

<!-- SPOTIFY_DATA_END -->

*このSpotifyデータは、GitHub Actionsによって自動的に更新されています。最終更新: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}*
`;

    // README.mdファイルを更新
    writeFileSync('README.md', readmeContent);
    console.log('README.mdを更新しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
updateReadme();