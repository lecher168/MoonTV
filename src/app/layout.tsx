/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { getConfig } from '@/lib/config';
import RuntimeConfig from '@/lib/runtime';

import { GlobalErrorIndicator } from '../components/GlobalErrorIndicator';
import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

// 类型定义
interface CustomCategory {
  name: string;
  type: 'movie' | 'tv';
  query: string;
}

interface RuntimeConfigType {
  custom_category?: Array<{
    name?: string;
    type: 'movie' | 'tv';
    query: string;
  }>;
}

// 核心大厂清洗函数：将不稳定的weserv或原生防盗链URL直接直连转换
function transformToFastProxy(src: string): string {
  if (!src || src.startsWith('data:')) return src;
  
  // 清理多余的域名叠加和本地回环地址
  let clean = src.replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  } else if (!clean.startsWith('http')) {
    clean = 'https://' + clean;
  }

  // 核心：若链接为豆瓣，直接走WordPress或百度大厂高速免鉴权节点（国内秒开，防盗链完美解封）
  if (clean.includes('doubanio.com')) {
    if (!clean.includes('i0.wp.com')) {
      return 'https://i0.wp.com/' + clean.replace(/^https?:\\/\\//, '');
    }
    return clean;
  }
  
  // 如果已经是 weserv 且遇到了网络阻断，直接将其降级为 WordPress 节点
  if (clean.includes('images.weserv.nl')) {
    const urlParam = clean.split('url=')[1];
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam);
      return 'https://i0.wp.com/' + decodedUrl.replace(/^https?:\\/\\//, '');
    }
  }

  return clean;
}

// 获取默认配置
const getDefaultConfig = () => ({
  siteName: process.env.SITE_NAME || '棒棒糖AI私人影院',
  announcement: process.env.ANNOUNCEMENT || '无偿对粉丝免费观看，影视内容均采集全球第3方开放接口资源，观影中出现广告切勿相信，与本站无关，同时遵循相关法律，切勿下载、传播、售卖如触犯自行承担。',
  enableRegister: process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true',
  imageProxy: '', // 彻底抹平不稳定的后台环境变量配置
  doubanProxy: process.env.NEXT_PUBLIC_DOUBAN_PROXY || '',
  disableYellowFilter: process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true',
  customCategories: [] as CustomCategory[],
});

// 动态生成 metadata
export async function generateMetadata(): Promise<Metadata> {
  const defaultConfig = getDefaultConfig();
  if (shouldFetchConfig()) {
    try {
      const config = await getConfig();
      return buildMetadata(config.SiteConfig.SiteName);
    } catch {
      return buildMetadata(defaultConfig.siteName);
    }
  }
  return buildMetadata(defaultConfig.siteName);
}

function buildMetadata(siteName: string): Metadata {
  return {
    title: siteName,
    description: '全球影视资源',
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon-16x16.ico', sizes: '16x16', type: 'image/x-icon' },
        { url: '/favicon-32x32.ico', sizes: '32x32', type: 'image/x-icon' },
        { url: '/favicon-48x48.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/favicon-64x64.ico', sizes: '64x64', type: 'image/x-icon' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
};

const shouldFetchConfig = () => {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE;
  return storageType !== 'd1' && storageType !== 'upstash';
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultConfig = getDefaultConfig();
  let configValues = { ...defaultConfig };

  if (shouldFetchConfig()) {
    try {
      const config = await getConfig();
      configValues = {
        siteName: config.SiteConfig.SiteName,
        announcement: config.SiteConfig.Announcement,
        enableRegister: config.UserConfig.AllowRegister,
        imageProxy: '', 
        doubanProxy: config.SiteConfig.DoubanProxy,
        disableYellowFilter: config.SiteConfig.DisableYellowFilter,
        customCategories: config.CustomCategories
          .filter(category => !category.disabled)
          .map(category => ({
            name: category.name || '',
            type: category.type,
            query: category.query,
          })),
      };
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  } else {
    const runtimeConfig = RuntimeConfig as RuntimeConfigType;
    configValues.customCategories = runtimeConfig.custom_category?.map(category => ({
      name: category.name || '',
      type: category.type,
      query: category.query,
    })) || [];
  }

  const {
    siteName,
    announcement,
    enableRegister,
    doubanProxy,
    disableYellowFilter,
    customCategories
  } = configValues;

  const runtimeConfig = {
    STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
    ENABLE_REGISTER: enableRegister,
    IMAGE_PROXY: '', // 传递空，迫使前端逻辑回滚到无前缀状态，交由我们接管
    DOUBAN_PROXY: doubanProxy,
    DISABLE_YELLOW_FILTER: disableYellowFilter,
    CUSTOM_CATEGORIES: customCategories,
  };

  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, viewport-fit=cover'
        />
        
        {/* 全局底层解封防盗链请求头 */}
        <meta name="referrer" content="no-referrer" />

        {/* 骨送级大厂节点动态替换引擎（全端拦截） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function hijackImage(img) {
                  if (!img || img.dataset.sweetFixed) return;
                  
                  var srcFields = ['src', 'data-src', 'data-original'];
                  srcFields.forEach(function(field) {
                    var rawUrl = img.getAttribute(field);
                    if (rawUrl && !rawUrl.startsWith('data:')) {
                      // 清理叠加主域
                      var clean = rawUrl.replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
                      if (clean.startsWith('//')) clean = 'https:' + clean;
                      if (!clean.startsWith('http')) clean = 'https://' + clean;

                      // 绝招：劫持转换
                      if (clean.includes('doubanio.com') && !clean.includes('i0.wp.com')) {
                        clean = 'https://i0.wp.com/' + clean.replace(/^https?:\\/\\//, '');
                      } else if (clean.includes('images.weserv.nl')) {
                        var p = clean.split('url=')[1];
                        if (p) clean = 'https://i0.wp.com/' + decodeURIComponent(p).replace(/^https?:\\/\\//, '');
                      }

                      if (img.getAttribute(field) !== clean) {
                        img.setAttribute(field, clean);
                      }
                    }
                  });
                  img.dataset.sweetFixed = 'true';
                }

                // 监听万一出现的加载失败做二次对冲
                document.addEventListener('error', function (e) {
                  var t = e.target;
                  if (t.tagName.toLowerCase() === 'img' && !t.dataset.fallbackOk) {
                    t.dataset.fallbackOk = 'true';
                    if (t.src && t.src.includes('doubanio.com')) {
                      t.src = 'https://i0.wp.com/' + t.src.replace(/^https?:\\/\\//, '').replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
                    }
                  }
                }, true);

                // 实时清洗
                setInterval(function() {
                  var list = document.getElementsByTagName('img');
                  for (var i = 0; i < list.length; i++) {
                    hijackImage(list[i]);
                  }
                }, 150);
              })();
            `,
          }}
        />

        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <SiteProvider siteName={siteName} announcement={announcement}>
            {children}
            <GlobalErrorIndicator />
          </SiteProvider>
          <div className="fixed right-4 z-50" style={{ bottom: 'calc(1.5cm + 1rem)' }}>
            <a
              href="https://sezheai.com"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#5e60ce] to-[#4361ee] hover:from-[#4e50c0] hover:to-[#3a56e0] text-white font-medium rounded-lg transition-all duration-300 transform scale-90 hover:scale-95"
              target="_blank"
              rel="noopener"
            >
              <img
                src="/favicon-48x48.ico"
                alt="棒棒糖AI"
                className="w-5 h-5 mr-2"
              />
              <span>更多学习分享：@棒棒糖AI</span>
            </a>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
