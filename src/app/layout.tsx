/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Head from 'next/head';

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
  // 添加关键视口设置修复布局问题
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <html lang='zh-CN' suppressHydrationWarning className="h-full">
      <Head>
        {/* 添加 Apple Touch Icon 配置 - 多个尺寸确保兼容性 */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
        
        {/* PWA 相关标签 - 确保添加到主屏幕时正确显示 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="application-name" content={siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 原有标签 */}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* 添加主题颜色 */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* 运行时配置脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </Head>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200 relative`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <SiteProvider siteName={siteName} announcement={announcement}>
            {children}
            
            {/* 浮动按钮 - 调整移动端样式 */}
            <div className="fixed bottom-4 right-4 z-50">
              <a
                href="https://sezheai.com"
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm sm:px-4 sm:py-2 bg-gradient-to-r from-[#5e60ce] to-[#4361ee] hover:from-[#4e50c0] hover:to-[#3a56e0] text-white font-medium rounded-lg transition-all duration-300 transform scale-90 hover:scale-95"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* 使用 48x48 的 favicon 作为按钮图标 */}
                <img
                  src="/favicon-48x48.ico"
                  alt="色者AI"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                />
                <span className="text-xs sm:text-sm">更多学习分享：@色者AI</span>
              </a>
            </div>
          </SiteProvider>
        </ThemeProvider>
        
        {/* 添加关键CSS修复移动布局问题 */}
        <style jsx global>{`
          /* 修复移动端布局问题 */
          html, body {
            height: 100%;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          
          /* 防止移动端缩放 */
          * {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }
          
          /* 修复iOS输入框缩放问题 */
          input, select, textarea {
            font-size: 16px !important;
          }
          
          /* 修复按钮在移动端的点击延迟 */
          a, button {
            touch-action: manipulation;
          }
          
          /* 隐藏滚动条但保留功能 */
          ::-webkit-scrollbar {
            display: none;
            width: 0 !important;
          }
        `}</style>
      </body>
    </html>
  );
}
