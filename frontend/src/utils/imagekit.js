import { buildSrc } from '@imagekit/react';

const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
const IMAGEKIT_VIDEO_FOLDER = import.meta.env.VITE_IMAGEKIT_VIDEO_FOLDER || '/videos';

const normalizePath = (value) => {
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
};

export const isImageKitConfigured = () => !!IMAGEKIT_URL_ENDPOINT;

export const buildImageKitUrl = (path) => {
  if (!IMAGEKIT_URL_ENDPOINT || !path) return null;
  return buildSrc({
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    src: normalizePath(path)
  });
};

export const getImageKitVideoCandidates = (slug, extensions = ['mp4', 'mov', 'webm']) => {
  if (!slug || !IMAGEKIT_URL_ENDPOINT) return [];
  const folder = normalizePath(IMAGEKIT_VIDEO_FOLDER || '/videos');
  return extensions
    .map((ext) => buildImageKitUrl(`${folder}/${slug}.${ext}`))
    .filter(Boolean);
};

export const resolveVideoUrl = (rawUrl) => {
  if (!rawUrl) return null;

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith('/objects/')) {
    return rawUrl;
  }

  if (isImageKitConfigured() && (rawUrl.startsWith('/videos/') || rawUrl.startsWith('videos/') || rawUrl.includes('.'))) {
    return buildImageKitUrl(rawUrl);
  }

  return `/objects/${rawUrl.replace(/^\/+/, '')}`;
};
