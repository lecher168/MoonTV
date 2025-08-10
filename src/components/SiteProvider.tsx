'use client';

import { createContext, ReactNode, useContext } from 'react';

const SiteContext = createContext<{ siteName: string; announcement?: string }>({
  // 默认值
  siteName: '可搭建你的私人影院',
  announcement:
    '本项目为：粉丝群团体、公司员工、家族成员、村组及小区等...福利开发，价格低廉。项目咨询合作：<img src="https://wangpan.szai.us.kg/file/1754239378387_微信图片_20250710031229.jpg" alt="微信图片_20250710031229.jpg" width=100%>',
});

export const useSite = () => useContext(SiteContext);

export function SiteProvider({
  children,
  siteName,
  announcement,
}: {
  children: ReactNode;
  siteName: string;
  announcement?: string;
}) {
  return (
    <SiteContext.Provider value={{ siteName, announcement }}>
      {children}
    </SiteContext.Provider>
  );
}
