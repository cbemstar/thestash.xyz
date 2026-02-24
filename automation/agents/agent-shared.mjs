import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';

const DEFAULT_DATASET = 'production';

export function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

export function getSanityConfig() {
  return {
    projectId: requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || DEFAULT_DATASET,
    token: requireEnv('SANITY_API_TOKEN'),
    apiVersion: '2025-01-01',
    useCdn: false,
  };
}

export function getSanityClient() {
  return createClient(getSanityConfig());
}

export function isDirectRun(metaUrl) {
  const scriptArg = process.argv[1];
  if (!scriptArg) return false;
  const scriptUrl = pathToFileURL(path.resolve(scriptArg)).href;
  return metaUrl === scriptUrl;
}

export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export function normalizeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    parsed.search = '';
    let output = parsed.toString();
    if (output.endsWith('/')) output = output.slice(0, -1);
    return output.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

export function getHostname(input) {
  try {
    return new URL(input).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toPortableTextPlain(body) {
  if (!Array.isArray(body)) return '';
  return body
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const children = Array.isArray(block.children) ? block.children : [];
      return children
        .map((child) => (child && typeof child.text === 'string' ? child.text : ''))
        .join(' ');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
