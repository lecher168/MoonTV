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

// 获取默认配置
const getDefaultConfig = () => ({
  siteName: process.env.SITE_NAME || '棒棒糖AI私人影院',
  announcement: process.env.ANNOUNCEMENT || '无偿对粉丝免费观看，影视内容均采集全球第3方开放接口资源，观影中出现广告切勿相信，与本站无关，同时遵循相关法律，切勿下载、传播、售卖如触犯自行承担。',
  enableRegister: process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true',
  imageProxy: process.env.NEXT_PUBLIC_IMAGE_PROXY || '',
  doubanProxy: process.env.NEXT_PUBLIC_DOUBAN_PROXY || '',
  disableYellowFilter: process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true',
  customCategories: [] as any[],
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

// 检查是否需要从存储加载配置
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
        imageProxy: config.SiteConfig.ImageProxy,
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
    // 处理RuntimeConfig
    const runtimeConfig = RuntimeConfig as any;
    configValues.customCategories = runtimeConfig.custom_category?.map((category: any) => ({
      name: category.name || '',
      type: category.type,
      query: category.query,
    })) || [];
  }

  const {
    siteName,
    announcement,
    enableRegister,
    imageProxy,
    doubanProxy,
    disableYellowFilter,
    customCategories
  } = configValues;

  const runtimeConfig = {
    STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
    ENABLE_REGISTER: enableRegister,
    IMAGE_PROXY: imageProxy,
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
        
        {/* 核心强破防盗链头 */}
        <meta name="referrer" content="no-referrer" />

        {/* 纯前端免打包干预脚本：100%编译通过，运行时自动劫持 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function fixSingleImg(img) {
                  if (!img || img.dataset.sweetFixed) return;
                  
                  var fields = ['src', 'data-src', 'data-original'];
                  fields.forEach(function(f) {
                    var v = img.getAttribute(f);
                    if (v && !v.startsWith('data:')) {
                      // 1. 剔除本地意外叠加的错乱域名前缀
                      var clean = v.replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
                      if (clean.startsWith('//')) clean = 'https:' + clean;
                      if (!clean.startsWith('http') && clean.length > 4) clean = 'https://' + clean;

                      // 2. 将防盗链的豆瓣链接无缝重定向到WordPress国内秒开节点
                      if (clean.includes('doubanio.com') && !clean.includes('i0.wp.com')) {
                        clean = 'https://i0.wp.com/' + clean.replace(/^https?:\\/\\//, '');
                      } else if (clean.includes('weserv.nl')) {
                        // 如果遇到了卡死的weserv代理，自动解包并交由大厂节点加速
                        var p = clean.split('url=')[1];
                        if (p) clean = 'https://i0.wp.com/' + decodeURIComponent(p).replace(/^https?:\\/\\//, '');
                      }

                      if (img.getAttribute(f) !== clean) {
                        img.setAttribute(f, clean);
                      }
                    }
                  });
                  img.dataset.sweetFixed = 'true';
                }

                // 加载失败二次兜底中转
                document.addEventListener('error', function (e) {
                  var t = e.target;
                  if (t.tagName.toLowerCase() === 'img' && !t.dataset.retryOk) {
                    t.dataset.retryOk = 'true';
                    var current = t.src;
                    if (current && !current.startsWith('data:')) {
                      t.src = 'https://i0.wp.com/' + current.replace(/^https?:\\/\\//, '').replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
                    }
                  }
                }, true);

                // 全自动化巡逻高频渲染引擎
                setInterval(function() {
                  var allImgs = document.getElementsByTagName('img');
                  for (var i = 0; i < allImgs.length; i++) {
                    fixSingleImg(allImgs[i]);
                  }
                }, 200);
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
