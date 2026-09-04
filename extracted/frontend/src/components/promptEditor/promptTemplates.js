export const CATEGORIES = ['cinematic', 'realistic', 'advertising', 'fantasy', 'anime', 'nature', 'product'];

export const TEMPLATES = [
  { id: 'cin-img', type: 'image', category: 'cinematic', name: 'Astronaut on Alien Planet',
    sections: { subject: 'A lone astronaut standing on a red desert planet, two suns setting on the horizon', environment: 'vast alien desert with distant rock formations', lighting: 'golden hour, dramatic rim light, volumetric god rays', camera: 'wide angle, low angle, anamorphic lens, shallow depth of field', motion: '', style: 'cinematic, film grain, Kodak 35mm, color graded, hyper-detailed, 8k', negative: 'blurry, low quality, cartoon, watermark, text' } },
  { id: 'cin-vid', type: 'video', category: 'cinematic', name: 'Futuristic City at Dusk',
    sections: { subject: 'slow camera pan across a futuristic city skyline at dusk', environment: 'neon-lit skyscrapers, flying cars, holographic billboards', lighting: 'cyan and orange neon glow, moody atmosphere', camera: 'slow cinematic drone shot, smooth tracking, 24fps', motion: 'gentle forward dolly, subtle parallax', style: 'blade runner aesthetic, cinematic, ultra realistic', negative: 'shaky, fast cuts, low quality' } },

  { id: 'rea-img', type: 'image', category: 'realistic', name: 'Old Fisherman Portrait',
    sections: { subject: 'portrait of an elderly fisherman with weathered skin and white beard', environment: 'harbor dock, wooden boats, overcast sky', lighting: 'soft diffused natural light, cool tones', camera: '85mm portrait lens, eye-level, bokeh background', motion: '', style: 'photorealistic, DSLR, sharp focus, natural colors', negative: 'plastic skin, over-smoothed, cartoon, ai face' } },
  { id: 'rea-vid', type: 'video', category: 'realistic', name: 'Latte Art in Cafe',
    sections: { subject: 'barista pouring latte art in a cozy cafe', environment: 'warm cafe interior, wooden counter, plants', lighting: 'warm window light, soft shadows', camera: 'handheld close-up, 50mm, shallow depth of field', motion: 'slow tilt up, steam rising', style: 'documentary realism, natural, 4k', negative: 'dramatic, cinematic, over-saturated' } },

  { id: 'adv-img', type: 'image', category: 'advertising', name: 'Smartphone Splash',
    sections: { subject: 'a sleek smartphone floating with a splash of colorful liquid', environment: 'studio gradient background, clean', lighting: 'studio softbox, bright even light, subtle reflections', camera: 'macro product shot, centered, sharp', motion: '', style: 'commercial product photography, glossy, high-end advertising', negative: 'cluttered, low quality, text, watermark' } },
  { id: 'adv-vid', type: 'video', category: 'advertising', name: 'Perfume Bottle Rotate',
    sections: { subject: 'perfume bottle with golden cap rotating slowly', environment: 'luxurious dark background with silk', lighting: 'dramatic spotlight, gold rim light', camera: '360 orbit, slow rotation, macro', motion: 'smooth continuous rotation', style: 'luxury commercial, premium, elegant', negative: 'cheap, low quality, shaky' } },

  { id: 'fan-img', type: 'image', category: 'fantasy', name: 'Dragon on Crystal Peak',
    sections: { subject: 'a majestic dragon perched on a crystal mountain peak', environment: 'floating islands, waterfalls into the sky, magical clouds', lighting: 'ethereal glow, magical particles, purple and gold', camera: 'epic wide shot, dramatic angle', motion: '', style: 'fantasy art, digital painting, highly detailed, ArtStation trending', negative: 'modern, realistic, low quality' } },
  { id: 'fan-vid', type: 'video', category: 'fantasy', name: 'Wizard Casting Spell',
    sections: { subject: 'a wizard casting a glowing spell in an ancient library', environment: 'towering bookshelves, floating candles, dusty air', lighting: 'warm magical glow from spell, blue ambient', camera: 'slow push in, medium shot', motion: 'swirling magical particles, robes flowing', style: 'fantasy cinematic, epic, mystical', negative: 'modern, cheap, low quality' } },

  { id: 'ani-img', type: 'image', category: 'anime', name: 'Girl under Cherry Blossoms',
    sections: { subject: 'a young girl with pink hair under cherry blossoms', environment: 'tokyo street, sakura petals falling, sunset', lighting: 'soft warm sunset, glowing petals', camera: 'medium shot, anime composition', motion: '', style: 'anime, Studio Ghibli inspired, cel shaded, vibrant, detailed background', negative: '3d, realistic, photo, western cartoon' } },
  { id: 'ani-vid', type: 'video', category: 'anime', name: 'Samurai in the Rain',
    sections: { subject: 'a samurai drawing his sword in the rain', environment: 'dark alley, neon signs, heavy rain', lighting: 'dramatic neon, blue and red, rain highlights', camera: 'dynamic angle, slow motion', motion: 'sword slash, rain droplets frozen', style: 'anime, Makoto Shinkai style, cinematic, vivid', negative: '3d, realistic, low quality' } },

  { id: 'nat-img', type: 'image', category: 'nature', name: 'Misty Forest River',
    sections: { subject: 'a misty forest with a winding river at dawn', environment: 'ancient pine trees, fog, mossy rocks', lighting: 'soft morning mist, golden rays through trees', camera: 'wide landscape, tripod, deep depth of field', motion: '', style: 'nature photography, National Geographic, ultra realistic, 8k', negative: 'people, buildings, text' } },
  { id: 'nat-vid', type: 'video', category: 'nature', name: 'Aerial over Mountains',
    sections: { subject: 'aerial view flying over snow-capped mountains', environment: 'alpine peaks, glaciers, clouds below', lighting: 'bright daylight, crisp', camera: 'drone aerial, forward flight', motion: 'smooth forward motion, clouds drifting', style: 'nature documentary, 4k, realistic', negative: 'shaky, low quality, text' } },

  { id: 'pro-img', type: 'image', category: 'product', name: 'Luxury Watch',
    sections: { subject: 'a luxury wristwatch on a marble surface', environment: 'dark marble, soft reflections, minimal', lighting: 'studio rim light, dramatic highlights on metal', camera: 'macro, 100mm, sharp detail', motion: '', style: 'product photography, luxury, elegant, high resolution', negative: 'cluttered, cheap, text' } },
  { id: 'pro-vid', type: 'video', category: 'product', name: 'Sports Car Coastal',
    sections: { subject: 'a sports car driving on a coastal road', environment: 'winding cliff road, ocean, sunset', lighting: 'golden hour, reflections on car body', camera: 'tracking shot alongside car, low angle', motion: 'smooth tracking, wheels turning, dust', style: 'automotive commercial, cinematic, high end', negative: 'shaky, low quality, cartoon' } }
];