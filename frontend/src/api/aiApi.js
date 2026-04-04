// FILE: frontend/src/api/aiApi.js
import axiosInstance from './axios';

export const chatWithAI = async (message, history = []) => {
  const res = await axiosInstance.post('/ai/chat', { message, history });
  return res.data;
};

export const suggestPost = async (topic) => {
  const res = await axiosInstance.post('/ai/suggest-post', { topic });
  return res.data;
};

export const getStudyHelp = async (subject, question) => {
  const res = await axiosInstance.post('/ai/study-help', { subject, question });
  return res.data;
};
