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

// 获取默认配置
const getDefaultConfig = () => ({
  siteName: process.env.SITE_NAME || '棒棒糖AI私人影院',
  announcement: process.env.ANNOUNCEMENT || '无偿对粉丝免费观看，影视内容均采集全球第3方开放接口资源，观影中出现广告切勿相信，与本站无关，同时遵循相关法律，切勿下载、传播、售卖如触犯自行承担。',
  enableRegister: process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true',
  imageProxy: process.env.NEXT_PUBLIC_IMAGE_PROXY || '',
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
        
        {/* 核心强破防盗链核心头：直接让整个网页内所有第三方请求隐匿来源头 */}
        <meta name="referrer" content="no-referrer" />
        <meta name="referrer" content="same-origin" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />

        {/* 终极高能图片重定向脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 自动纠正非标准路径并强破豆瓣限制
                function fixImgElement(img) {
                  if (!img || img.dataset.ultimateFixed) return;
                  
                  // 处理懒加载属性
                  var attrs = ['src', 'data-src', 'data-original'];
                  attrs.forEach(function(attr) {
                    var currentVal = img.getAttribute(attr);
                    if (currentVal && !currentVal.startsWith('data:')) {
                      // 移除可能意外拼在最前面的本地主域名
                      var clean = currentVal.replace(/^(https?:\\/\\/)?(localhost|127\\.0\\.0\\.1|szai\\.us\\.kg)[^/]*\\//, '');
                      
                      // 补齐相对路径协议头
                      if (clean.startsWith('//')) {
                        clean = 'https:' + clean;
                      } else if (!clean.startsWith('http') && clean.length > 5) {
                        clean = 'https://' + clean;
                      }
                      
                      // 如果域名是豆瓣，利用 WordPress 公共高宽容度图片节点中转（100%穿透防盗链且不缩放）
                      if (clean.includes('doubanio.com') && !clean.includes('i0.wp.com')) {
                        clean = 'https://i0.wp.com/' + clean.replace(/^https?:\\/\\//, '');
                      }
                      
                      if (img.getAttribute(attr) !== clean) {
                        img.setAttribute(attr, clean);
                      }
                    }
                  });
                  img.dataset.ultimateFixed = 'true';
                }

                // 监听全局加载失败，进行终极备用代理替换
                document.addEventListener('error', function (e) {
                  var target = e.target;
                  if (target.tagName.toLowerCase() === 'img' && !target.dataset.fallbackTriggered) {
                    target.dataset.fallbackTriggered = 'true';
                    var currentSrc = target.src;
                    if (currentSrc && !currentSrc.startsWith('data:')) {
                      // 最后的绝招：改用海外极速节点中转
                      target.src = 'https://images.weserv.nl/?url=' + encodeURIComponent(currentSrc);
                    }
                  }
                }, true);

                // 每 200 毫秒高频穿透 DOM 树，点亮所有影视方块
                setInterval(function () {
                  var imgs = document.getElementsByTagName('img');
                  for (var i = 0; i < imgs.length; i++) {
                    fixImgElement(imgs[i]);
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
