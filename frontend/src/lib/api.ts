const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'nexus-dev-key-12345';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Creators ----
export const creators = {
  list: (status?: string) => apiFetch(`/api/v1/creators${status ? `?status=${status}` : ''}`),
  get: (id: string) => apiFetch(`/api/v1/creators/${id}`),
  create: (data: any) => apiFetch('/api/v1/creators', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/api/v1/creators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/v1/creators/${id}`, { method: 'DELETE' }),
  onboard: (id: string, youtubeChannel?: string) =>
    apiFetch(`/api/v1/creators/${id}/onboard${youtubeChannel ? `?youtube_channel=${youtubeChannel}` : ''}`, { method: 'POST' }),
  getDna: (id: string) => apiFetch(`/api/v1/creators/${id}/dna`),
  syncYoutube: (id: string, youtubeChannel?: string) =>
    apiFetch(`/api/v1/creators/${id}/sync-youtube${youtubeChannel ? `?youtube_channel=${youtubeChannel}` : ''}`, { method: 'POST' }),
};

// ---- Content ----
export const content = {
  list: (creatorId?: string) => apiFetch(`/api/v1/content${creatorId ? `?creator_id=${creatorId}` : ''}`),
  get: (id: string) => apiFetch(`/api/v1/content/${id}`),
  generate: (data: any) => apiFetch('/api/v1/content/generate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: any) => apiFetch('/api/v1/content', { method: 'POST', body: JSON.stringify(data) }),
  publish: (id: string) => apiFetch(`/api/v1/content/${id}/publish`, { method: 'POST' }),
};

// ---- Trends ----
export const trends = {
  list: () => apiFetch('/api/v1/trends'),
  create: (data: any) => apiFetch('/api/v1/trends', { method: 'POST', body: JSON.stringify(data) }),
  match: (trendId: string) => apiFetch(`/api/v1/trends/${trendId}/match`, { method: 'POST' }),
};

// ---- Crisis ----
export const crisis = {
  list: (creatorId?: string) => apiFetch(`/api/v1/crisis${creatorId ? `?creator_id=${creatorId}` : ''}`),
  get: (id: string) => apiFetch(`/api/v1/crisis/${id}`),
  create: (data: any) => apiFetch('/api/v1/crisis', { method: 'POST', body: JSON.stringify(data) }),
  generateStrategies: (crisisId: string) =>
    apiFetch(`/api/v1/crisis/${crisisId}/strategies`, { method: 'POST', body: JSON.stringify({ count: 3 }) }),
  simulate: (crisisId: string, strategyId: string) =>
    apiFetch(`/api/v1/crisis/${crisisId}/simulate`, { method: 'POST', body: JSON.stringify({ strategy_id: strategyId }) }),
  execute: (crisisId: string, strategyId: string) =>
    apiFetch(`/api/v1/crisis/${crisisId}/execute`, { method: 'POST', body: JSON.stringify({ strategy_id: strategyId }) }),
  analyzeComments: (data: { video_id: string; creator_id?: string; interval_seconds?: number; max_comments?: number }) =>
    apiFetch('/api/v1/crisis/analyze-comments', { method: 'POST', body: JSON.stringify(data) }),
  listAnalyses: (videoId?: string, creatorId?: string) => {
    const params = new URLSearchParams();
    if (videoId) params.set('video_id', videoId);
    if (creatorId) params.set('creator_id', creatorId);
    const qs = params.toString();
    return apiFetch(`/api/v1/crisis/analyses${qs ? `?${qs}` : ''}`);
  },
  getAnalysis: (id: string) => apiFetch(`/api/v1/crisis/analyses/${id}`),
};

// ---- Sentiment ----
export const sentiment = {
  get: (creatorId: string) => apiFetch(`/api/v1/sentiment/${creatorId}`),
  record: (data: any) => apiFetch('/api/v1/sentiment', { method: 'POST', body: JSON.stringify(data) }),
};

// ---- Deals ----
export const deals = {
  list: (creatorId?: string) => apiFetch(`/api/v1/deals${creatorId ? `?creator_id=${creatorId}` : ''}`),
  create: (data: any) => apiFetch('/api/v1/deals', { method: 'POST', body: JSON.stringify(data) }),
  research: (dealId: string) => apiFetch(`/api/v1/deals/${dealId}/research`, { method: 'POST' }),
  outreach: (dealId: string) => apiFetch(`/api/v1/deals/${dealId}/outreach`, { method: 'POST' }),
  counter: (dealId: string) => apiFetch(`/api/v1/deals/${dealId}/counter`, { method: 'POST' }),
};

// ---- Media Kit ----
export const mediaKit = {
  get: (creatorId: string) => apiFetch(`/api/v1/creators/${creatorId}/media-kit`),
  generate: (creatorId: string) => apiFetch(`/api/v1/creators/${creatorId}/media-kit`, { method: 'POST' }),
};

// ---- Analytics ----
export const analytics = {
  dashboard: (creatorId: string) => apiFetch(`/api/v1/analytics/dashboard/${creatorId}`),
  predict: (data: any) => apiFetch('/api/v1/analytics/predict', { method: 'POST', body: JSON.stringify(data) }),
  postingTimes: (creatorId: string) => apiFetch(`/api/v1/analytics/posting-times/${creatorId}`),
  forecast: (creatorId: string) => apiFetch(`/api/v1/analytics/forecast/${creatorId}`),
};

// ---- YouTube ----
export const youtube = {
  trending: (region = 'IN', maxResults = 10) => apiFetch(`/api/v1/youtube/trending?region=${region}&max_results=${maxResults}`),
  channel: (id: string) => apiFetch(`/api/v1/youtube/channel/${id}`),
  channelVideos: (channelId: string) => apiFetch(`/api/v1/youtube/channel/${channelId}/videos`),
  search: (q: string) => apiFetch(`/api/v1/youtube/search?q=${encodeURIComponent(q)}`),
  videoComments: (videoId: string, maxResults = 50) => apiFetch(`/api/v1/youtube/video/${videoId}/comments?max_results=${maxResults}`),
  trendingKeywords: (region = 'IN', maxVideos = 30) => apiFetch(`/api/v1/youtube/trending/keywords?region=${region}&max_videos=${maxVideos}`),
};

// ---- Instagram ----
export const instagram = {
  getAuthUrl: (state = 'nexus') => apiFetch(`/api/v1/instagram/auth?state=${state}`),
  callback: (code: string) => apiFetch(`/api/v1/instagram/callback?code=${code}`),
  accounts: (accessToken: string) => apiFetch(`/api/v1/instagram/accounts?access_token=${accessToken}`),
  profile: (userId: string, accessToken: string) => apiFetch(`/api/v1/instagram/${userId}/profile?access_token=${accessToken}`),
  media: (userId: string, accessToken: string, limit = 25) => apiFetch(`/api/v1/instagram/${userId}/media?access_token=${accessToken}&limit=${limit}`),
  insights: (userId: string, accessToken: string, days = 7) => apiFetch(`/api/v1/instagram/${userId}/insights?access_token=${accessToken}&days=${days}`),
  mediaComments: (mediaId: string, accessToken: string) => apiFetch(`/api/v1/instagram/media/${mediaId}/comments?access_token=${accessToken}`),
};

// ---- Data Pipeline ----
export const pipeline = {
  analyze: (data: { youtube_channel_id?: string; instagram_user_id?: string; instagram_token?: string; max_items?: number }) =>
    apiFetch('/api/v1/pipeline/analyze', { method: 'POST', body: JSON.stringify(data) }),
  autoAnalyze: (config: any) =>
    apiFetch('/api/v1/pipeline/auto-analyze', { method: 'POST', body: JSON.stringify(config) }),
};

// ---- Voice Studio ----
export const voice = {
  profiles: () => apiFetch('/api/v1/voice/profiles'),
  generate: (data: { text: string; profile?: string; speed?: number; pitch_shift?: number }) =>
    apiFetch('/api/v1/voice/generate', { method: 'POST', body: JSON.stringify(data) }),
  preview: (data: { text: string; profile?: string }) =>
    apiFetch('/api/v1/voice/preview', { method: 'POST', body: JSON.stringify(data) }),
  downloadUrl: (filename: string) => `${API_BASE}/api/v1/voice/download/${filename}`,
};

// ---- System ----
export const system = {
  health: () => apiFetch('/api/v1/system/health'),
  events: () => apiFetch('/api/v1/system/events'),
  logs: (agentName?: string) => apiFetch(`/api/v1/system/logs${agentName ? `?agent_name=${agentName}` : ''}`),
};
