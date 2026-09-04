/**
 * mediaAdapter.js — AI media generation (Worker-backed, no Base44).
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

export const mediaAdapter = {
  async generateImage(prompt, options = {}) {
    return invokeFunctionDirect('imageGenerate', { prompt, ...options });
  },

  async editImage(prompt, imageUrl, options = {}) {
    return invokeFunctionDirect('imageEdit', { prompt, image_url: imageUrl, ...options });
  },

  async generateVideo(prompt, options = {}) {
    return invokeFunctionDirect('videoGenerate', { prompt, ...options });
  },

  async analyzeVideo(videoUrl, prompt, options = {}) {
    return invokeFunctionDirect('videoAnalyze', { video_url: videoUrl, prompt, ...options });
  },

  async transcribeAudio(audioUrl, options = {}) {
    return invokeFunctionDirect('speechToText', { audio_url: audioUrl, ...options });
  },

  async generateTTS(text, options = {}) {
    return invokeFunctionDirect('generateTTS', { text, ...options });
  },

  async speak(text, options = {}) {
    return invokeFunctionDirect('generateTTS', { text, ...options });
  },

  async analyzeFile(fileUrl, prompt, options = {}) {
    return invokeFunctionDirect('fileAnalyze', { file_url: fileUrl, prompt, ...options });
  },
};

export default mediaAdapter;