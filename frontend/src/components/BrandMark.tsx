import React from 'react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const sizeMap = {
  sm: {
    box: 'w-8 h-8 rounded-lg',
    icon: 'text-sm',
    title: 'text-sm',
    subtitle: 'text-[9px]',
  },
  md: {
    box: 'w-14 h-14 rounded-2xl',
    icon: 'text-xl',
    title: 'text-2xl',
    subtitle: 'text-[10px]',
  },
  lg: {
    box: 'w-20 h-20 rounded-[2.2rem]',
    icon: 'text-3xl',
    title: 'text-3xl',
    subtitle: 'text-[10px]',
  },
};

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', showTagline = true }) => {
  const styles = sizeMap[size];

  return (
    <div className="flex items-center gap-4">
      <div className={`${styles.box} bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_45%)]" />
        <span className={`${styles.icon} font-black tracking-tight text-white relative z-10`}>SB</span>
      </div>
      <div>
        <span className={`${styles.title} font-black tracking-tighter text-slate-950 dark:text-white block leading-none`}>
          SmartBiz
        </span>
        {showTagline ? (
          <span className={`${styles.subtitle} font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.5em] mt-1.5 block opacity-80`}>
            Business OS
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default BrandMark;
