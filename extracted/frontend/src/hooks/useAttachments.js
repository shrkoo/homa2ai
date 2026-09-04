import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { invokeFunctionDirect } from '@/lib/directInvoke';

const TEXT_TYPES = ['text/plain', 'text/csv', 'application/json', 'text/markdown'];

const compressImage = (file) => new Promise((resolve) => {
  if (!file.type.startsWith('image/') || file.size < 500000) { resolve(file); return; }
  const img = new Image();
  img.onload = () => {
    const maxW = 1280;
    const scale = Math.min(1, maxW / img.width);
    if (scale === 1) { resolve(file); return; }
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file);
    }, 'image/jpeg', 0.85);
  };
  img.onerror = () => resolve(file);
  img.src = URL.createObjectURL(file);
});

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export function useAttachments(t) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const removeAttachment = (aid) => setAttachments((p) => p.filter((a) => a.id !== aid));

  const attach = async (rawFile) => {
    if (!rawFile) return;
    if (rawFile.size > 25 * 1024 * 1024) {
      toast({ title: t('file_too_large') });
      return;
    }
    const ext = rawFile.name.split('.').pop()?.toLowerCase() || '';
    const isImage = rawFile.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'].includes(ext);
    if (isImage) {
      const currentImages = attachments.filter((a) => a.kind === 'image').length;
      if (currentImages >= 10) {
        toast({ title: 'حداکثر ۱۰ تصویر قابل ارسال است' });
        return;
      }
    }
    setUploading(true);
    let file = rawFile;
    if (file.type.startsWith('image/') && file.size > 500000) {
      file = await compressImage(file);
    }
    const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext);
    const isText = !isImage && !isVideo && (TEXT_TYPES.includes(file.type) || (file.size < 500000 && file.type.startsWith('text')) || file.type === '' || ext.match(/^(txt|csv|json|md|markdown|js|ts|jsx|tsx|py|java|c|cpp|h|css|html|xml|yml|yaml|sh|sql)$/i));
    if (isText) {
      try {
        const textContent = (await file.text()).slice(0, 8000);
        setAttachments((p) => [...p, { id: Date.now() + Math.random(), name: file.name, kind: 'file', file_url: '', textContent }]);
        toast({ title: t('file_uploaded') });
      } catch {
        toast({ title: t('upload_failed') });
      }
      setUploading(false);
      return;
    }
    const kind = isImage ? 'image' : isVideo ? 'video' : 'file';
    const preview_url = isImage ? URL.createObjectURL(file) : '';
    const tempId = Date.now() + Math.random();
    let base64Data = '';
    if (isImage) {
      try { base64Data = await readFileAsDataURL(file); } catch {}
    }
    setAttachments((p) => [...p, { id: tempId, name: file.name, kind, file_url: '', preview_url, textContent: '', base64: base64Data }]);
    if (isImage) {
      setUploading(false);
      return;
    }
    try {
      const uploadBase64 = base64Data || await readFileAsDataURL(file);
      const res = await invokeFunctionDirect('uploadFile', { base64: uploadBase64, filename: file.name, mimeType: file.type });
      const data = res?.data || res;
      const file_url = data?.file_url;
      if (!file_url) throw new Error('Upload failed');
      setAttachments((p) => p.map((a) => (a.id === tempId ? { ...a, file_url } : a)));
    } catch (e) {
      const msg = String(e?.message || '');
      if (!base64Data) {
        setAttachments((p) => p.filter((a) => a.id !== tempId));
        if (msg.includes('402') || msg.includes('403')) {
          toast({ title: 'آپلود فایل موقتاً ممکن نیست. اعتبار پلتفرم محدود است.' });
        } else if (msg.includes('Failed to fetch') || msg.includes('Network')) {
          toast({ title: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.' });
        } else {
          toast({ title: t('upload_failed') });
        }
      } else {
        // Image has base64 — keep it even if upload failed (will be sent inline).
        setAttachments((p) => p.map((a) => (a.id === tempId ? { ...a, file_url: '' } : a)));
      }
    }
    setUploading(false);
  };

  return { attachments, setAttachments, uploading, attach, removeAttachment };
}