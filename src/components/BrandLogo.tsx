import React from 'react'
import Image from 'next/image'

interface BrandLogoProps {
  /**
   * Ukuran logo
   * xs: 24px, sm: 32px, md: 40px, lg: 48px, xl: 64px
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Varian visual logo:
   * - 'squircle': App icon dengan background squircle bergradien (cocok untuk navbar, login, & hero)
   * - 'mark': Logo mark transparan murni tanpa background
   */
  variant?: 'squircle' | 'mark'
  /**
   * Menampilkan teks brand "PilihKu" dan badge OSIS
   */
  showText?: boolean
  /**
   * Menampilkan teks subjudul "Sistem E-Voting Resmi"
   */
  showTagline?: boolean
  className?: string
  textClassName?: string
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', px: 24, font: 'text-sm', badge: 'text-[9px] px-1 py-0.2', sub: 'text-[10px]' },
  sm: { box: 'w-8 h-8', px: 32, font: 'text-base', badge: 'text-[10px] px-1.5 py-0.5', sub: 'text-[11px]' },
  md: { box: 'w-10 h-10', px: 40, font: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5', sub: 'text-xs' },
  lg: { box: 'w-12 h-12', px: 48, font: 'text-xl', badge: 'text-xs px-2 py-0.5', sub: 'text-xs' },
  xl: { box: 'w-16 h-16', px: 64, font: 'text-2xl', badge: 'text-xs px-2 py-0.5', sub: 'text-sm' },
}

export default function BrandLogo({
  size = 'md',
  variant = 'squircle',
  showText = false,
  showTagline = false,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const config = SIZE_MAP[size]
  const imageSrc = variant === 'squircle' 
    ? '/images/pilihku-app-icon.png' 
    : '/images/pilihku-logo-mark.svg'

  const logoIcon = (
    <div className={`relative ${config.box} flex-shrink-0 select-none ${className}`}>
      <Image
        src={imageSrc}
        alt="Logo PilihKu E-Voting"
        width={config.px}
        height={config.px}
        className="w-full h-full object-contain drop-shadow-xs"
        priority
      />
    </div>
  )

  if (!showText) {
    return logoIcon
  }

  return (
    <div className={`flex items-center gap-3 ${textClassName}`}>
      {logoIcon}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight text-slate-900 ${config.font} leading-none`}>
            Pilih<span className="text-blue-600">Ku</span>
          </span>
          <span className={`uppercase font-bold tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 ${config.badge} leading-none`}>
            OSIS
          </span>
        </div>
        {showTagline && (
          <p className={`text-slate-500 font-medium leading-none mt-1 ${config.sub}`}>
            Sistem E-Voting Resmi
          </p>
        )}
      </div>
    </div>
  )
}
