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
  siteName: process.env.SITE_NAME || '色者AI私人影院',
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
      // 使用默认配置，不做其他处理
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

  // 安全数值处理（避免除以零错误）
  const safeNumericalValue = (value: number, fallback = 1) => 
    value === 0 ? fallback : value;

  // 示例：安全数值使用
  const someValue = safeNumericalValue(0); // 返回1而不是0

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
          <div className="fixed top-4 right-4 z-50">
            <a
              href="https://sezheai.com"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#5e60ce] to-[#4361ee] hover:from-[#4e50c0] hover:to-[#3a56e0] text-white font-medium rounded-lg transition-all duration-300 transform scale-90 hover:scale-95"
              target="_blank"
              rel="noopener"
            >
              <img
                src="/favicon-48x48.ico"
                alt="色者AI"
                className="w-5 h-5 mr-2"
              />
              <span>更多学习分享：@色者AI</span>
            </a>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
