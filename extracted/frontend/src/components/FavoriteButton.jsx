import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';

export default function FavoriteButton({ product }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => {
    if (!product.url) return;
    let active = true;
    dataAdapter.filter('Favorite', { url: product.url }, '-created_date', 1)
      .then((rows) => { if (active && rows.length) setFavId(rows[0].id); })
      .catch(() => {});
    return () => { active = false; };
  }, [product.url]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (favId) {
        await dataAdapter.delete('Favorite', favId);
        setFavId(null);
        toast({ title: t('gs_favorite_removed') });
      } else {
        const row = await dataAdapter.create('Favorite', {
          product_name: product.name || '',
          price: String(product.price || ''),
          currency: product.currency || '',
          seller: product.seller || '',
          url: product.url || '',
          image: product.image || '',
        });
        setFavId(row.id);
        toast({ title: t('gs_favorite_added') });
      }
    } catch { toast({ title: t('error_occurred') }); }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={favId ? t('gs_remove_favorite') : t('gs_add_to_favorites')}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-40 ${
        favId ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-accent text-muted-foreground hover:bg-accent/70'
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Heart size={13} fill={favId ? 'currentColor' : 'none'} />}
    </button>
  );
}