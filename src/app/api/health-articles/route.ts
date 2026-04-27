import { NextResponse } from 'next/server';

export const revalidate = 1800; // Cache 30 minutes

// Indonesian health news RSS sources
const RSS_SOURCES = [
  {
    name: 'Detik Health',
    url: 'https://health.detik.com/rss',
    fallbackUrl: 'https://feed.detik.com/detikcom/health',
  },
  {
    name: 'Kompas Health',
    url: 'https://health.kompas.com/rss/health.xml',
    fallbackUrl: 'https://rss.kompas.com/health',
  },
  {
    name: 'Hello Sehat',
    url: 'https://hellosehat.com/feed/',
    fallbackUrl: '',
  },
  {
    name: 'Alodokter',
    url: 'https://www.alodokter.com/feed',
    fallbackUrl: '',
  },
  {
    name: 'Klik Dokter',
    url: 'https://www.klikdokter.com/feeds',
    fallbackUrl: '',
  },
];

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image: string;
  source: string;
}

function parseRSS(xml: string, sourceName: string): Article[] {
  const items: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
    const block = match[1];

    const getTag = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };

    // Extract image from multiple possible locations
    const imgMatch =
      block.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i) ||
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
      block.match(/<enclosure[^>]+url="([^"]+)"/i) ||
      block.match(/<media:content[^>]+url="([^"]+)"/i) ||
      block.match(/<image>.*?<url>(.*?)<\/url>/is) ||
      block.match(/<img[^>]+src="([^"]+)"/i);

    const rawDesc = getTag('description').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
    const descText = rawDesc.slice(0, 150).trim();
    const title = getTag('title').replace(/<!\\[CDATA\\[|\\]\\]>/g, '').trim();
    const link = getTag('link') || getTag('guid');

    if (!title || !link) continue;

    items.push({
      title,
      link,
      description: descText + (descText.length >= 150 ? '...' : ''),
      pubDate: getTag('pubDate'),
      image: imgMatch ? imgMatch[1] : '',
      source: sourceName,
    });
  }

  return items;
}

async function fetchRSSSource(source: typeof RSS_SOURCES[0]): Promise<Article[]> {
  const urls = [source.url, source.fallbackUrl].filter(Boolean);

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WellnessApp/1.0; +https://wellness.phc.id)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const articles = parseRSS(xml, source.name);

      if (articles.length > 0) return articles;
    } catch {
      // Try next URL
    }
  }

  return [];
}

const FALLBACK_ARTICLES: Article[] = [
  {
    title: 'Tips Menjaga Kesehatan Jantung di Usia Produktif',
    link: 'https://hellosehat.com/jantung/',
    description: 'Jaga kesehatan jantung dengan olahraga rutin, pola makan seimbang, dan hindari stres berlebih. Konsultasikan ke dokter secara berkala.',
    pubDate: new Date().toUTCString(),
    image: '',
    source: 'Hello Sehat',
  },
  {
    title: 'Manfaat Minum Air Putih yang Cukup Setiap Hari',
    link: 'https://hellosehat.com/nutrisi/fakta-gizi/manfaat-minum-air-putih/',
    description: 'Tubuh manusia terdiri dari sekitar 60% air. Cukupi kebutuhan air harian (2 liter) untuk menjaga fungsi organ tetap optimal.',
    pubDate: new Date().toUTCString(),
    image: '',
    source: 'Hello Sehat',
  },
  {
    title: 'Cara Mengelola Stres di Tempat Kerja',
    link: 'https://hellosehat.com/mental-sehat/stres/',
    description: 'Stres kerja bisa mempengaruhi kesehatan fisik dan mental. Pelajari cara mengatasinya dengan teknik relaksasi dan manajemen waktu.',
    pubDate: new Date().toUTCString(),
    image: '',
    source: 'Hello Sehat',
  },
  {
    title: 'Pentingnya Pemeriksaan Kesehatan Rutin (Medical Checkup)',
    link: 'https://www.alodokter.com/kenali-manfaat-medical-check-up',
    description: 'Medical checkup tahunan membantu mendeteksi penyakit lebih dini sehingga penanganan bisa dilakukan lebih cepat dan efektif.',
    pubDate: new Date().toUTCString(),
    image: '',
    source: 'Alodokter',
  },
  {
    title: '5 Kebiasaan Sehat yang Bisa Dilakukan di Kantor',
    link: 'https://www.klikdokter.com/gaya-hidup/kesehatan-umum',
    description: 'Tetap aktif di tempat kerja dengan peregangan singkat, minum air cukup, istirahat mata, makan siang bergizi, dan berjalan kaki.',
    pubDate: new Date().toUTCString(),
    image: '',
    source: 'Klik Dokter',
  },
];

export async function GET() {
  try {
    // Fetch from multiple sources concurrently
    const results = await Promise.allSettled(
      RSS_SOURCES.map(source => fetchRSSSource(source))
    );

    const allArticles: Article[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        // Take max 5 articles per source to mix sources
        allArticles.push(...result.value.slice(0, 5));
      }
    });

    // If we got some articles, shuffle and return
    if (allArticles.length > 0) {
      // Sort by pubDate descending (newest first)
      const sorted = allArticles.sort((a, b) => {
        const dA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dB - dA;
      });

      return NextResponse.json({ articles: sorted.slice(0, 20) });
    }

    // All sources failed – return fallback
    return NextResponse.json({ articles: FALLBACK_ARTICLES });

  } catch {
    return NextResponse.json({ articles: FALLBACK_ARTICLES });
  }
}
