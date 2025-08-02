/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { getConfig } from '@/lib/config';
import RuntimeConfig from '@/lib/runtime';

import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

// 动态生成 metadata，支持配置更新后的标题变化
export async function generateMetadata(): Promise<Metadata> {
  let siteName = process.env.SITE_NAME || '色者AI私人影院';
  if (
    process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'd1' &&
    process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'upstash'
  ) {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
  }

  return {
    title: siteName,
    description: '影视聚合',
    manifest: '/manifest.json',
    // 配置多尺寸 favicon
    icons: {
      icon: [
        { url: '/favicon-16x16.ico', sizes: '16x16', type: 'image/x-icon' },
        { url: '/favicon-32x32.ico', sizes: '32x32', type: 'image/x-icon' },
        { url: '/favicon-48x48.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/favicon-64x64.ico', sizes: '64x64', type: 'image/x-icon' },
      ],
      apple: [
        { 
          url: '/apple-touch-icon.png', 
          sizes: '180x180', 
          type: 'image/png' 
        }
      ],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
    <html lang='zh-CN' suppressHydrationWarning>
      <Head>
        {/* 添加 Apple Touch Icon 配置 */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
        
        {/* PWA 相关标签 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="色者AI" />
        
        {/* 原有标签 */}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, viewport-fit=cover'
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* 运行时配置脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </Head>
      {/* 其余代码保持不变 ... */}
    </html>
  );
}
  let siteName = process.env.SITE_NAME || '色者AI私人影院';
  let announcement =
    process.env.ANNOUNCEMENT ||
    '无偿对粉丝免费观看，影视内容均采集全球第3方开放接口资源，观影中出现广告切勿相信，与本站无关，同时遵循相关法律，切勿下载、传播、售卖如触犯自行承担。';
  let enableRegister = process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true';
  let imageProxy = process.env.NEXT_PUBLIC_IMAGE_PROXY || '';
  let doubanProxy = process.env.NEXT_PUBLIC_DOUBAN_PROXY || '';
  let disableYellowFilter =
    process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true';
  let customCategories =
    (RuntimeConfig as any).custom_category?.map((category: any) => ({
      name: 'name' in category ? category.name : '',
      type: category.type,
      query: category.query,
    })) || ([] as Array<{ name: string; type: 'movie' | 'tv'; query: string }>);
  if (
    process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'd1' &&
    process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'upstash'
  ) {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
    announcement = config.SiteConfig.Announcement;
    enableRegister = config.UserConfig.AllowRegister;
    imageProxy = config.SiteConfig.ImageProxy;
    doubanProxy = config.SiteConfig.DoubanProxy;
    disableYellowFilter = config.SiteConfig.DisableYellowFilter;
    customCategories = config.CustomCategories.filter(
      (category) => !category.disabled
    ).map((category) => ({
      name: category.name || '',
      type: category.type,
      query: category.query,
    }));
  }

  // 将运行时配置注入到全局 window 对象，供客户端在运行时读取
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
        {/* 显式添加 favicon 链接确保兼容性 */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* 将配置序列化后直接写入脚本 */}
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
          </SiteProvider>
          <div className="fixed bottom-4 right-4 z-50">
            <a
              href="https://sezheai.com"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#5e60ce] to-[#4361ee] hover:from-[#4e50c0] hover:to-[#3a56e0] text-white font-medium rounded-lg transition-all duration-300 transform scale-90 hover:scale-95"
              target="_blank"
              rel="noopener"
            >
              {/* 使用 48x48 的 favicon 作为按钮图标 */}
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
