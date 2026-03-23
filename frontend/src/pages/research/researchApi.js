import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/research`;

const normalizeArticleList = (payload) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || 1,
      has_more: false,
    };
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1,
    limit: payload?.limit || 9,
    has_more: Boolean(payload?.has_more),
  };
};

export const fetchResearchArticles = async (params = {}) => {
  const response = await axios.get(`${API}/articles`, { params });
  return normalizeArticleList(response.data);
};

export const fetchResearchArticle = async (slug) => {
  const response = await axios.get(`${API}/articles/${slug}`);
  return response.data;
};

export const fetchResearchTags = async () => {
  const response = await axios.get(`${API}/tags`);
  return response.data || [];
};

export const fetchResearchCategories = async () => {
  const response = await axios.get(`${API}/categories`);
  return response.data || [];
};
