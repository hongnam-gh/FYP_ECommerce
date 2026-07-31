import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  const companyLinks = ['HOME', 'ABOUT', 'DELIVERY', 'PRIVACY POLICY']
  const footerApps = [
    { name: 'Facebook', image: assets.footer_app_fb },
    { name: 'Instagram', image: assets.footer_app_ig },
    { name: 'Twitter', image: assets.footer_app_twitter },
    { name: 'YouTube', image: assets.footer_app_yt },
    { name: 'TikTok', image: assets.footer_app_tik_tok }
  ]

  return (
    <footer className='mt-0 overflow-hidden border border-black bg-black text-white'>
      <div className='relative px-6 py-12 sm:px-10 lg:px-14'>
        <div className='pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl'></div>
        <div className='pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-white/5 blur-3xl'></div>

        <div className='relative grid grid-cols-1 gap-10 sm:grid-cols-[1.6fr_1fr_1fr]'>
          <div>
            <img src={assets.logo} className='mb-6 block h-[60px] w-[165px] rounded-[14px] bg-white p-[5px] object-cover object-[center_48%]' alt="" />
            <p className='max-w-xl text-sm leading-7 text-white/60'>
              Distressed is built for silhouettes that do not beg for attention — they take the damn room. Sharp pieces, moody layers, and quiet rebellion stitched into everyday wear.
            </p>

            <div className='mt-7 flex flex-wrap items-center gap-3'>
              {footerApps.map((item) => (
                <button key={item.name} type='button' aria-label={item.name} className='h-12 w-12 overflow-hidden rounded-md border border-white/35 bg-white/5'>
                  <img src={item.image} alt={item.name} className='h-full w-full object-cover' />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className='mb-5 text-sm font-semibold tracking-[0.3em] text-white'>COMPANY</p>
            <ul className='flex flex-col gap-3 text-sm text-white/60'>
              {companyLinks.map((item) => (
                <li key={item} className='w-fit cursor-pointer'>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className='mb-5 text-sm font-semibold tracking-[0.3em] text-white'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-3 text-sm text-white/60'>
              <li className='w-fit cursor-pointer'>(+83) 913332237</li>
              <li className='w-fit cursor-pointer'>distressed@gmail.com</li>
            </ul>

            <div className='mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
              <p className='text-xs tracking-[0.25em] text-white/50'>DROP STATUS</p>
              <p className='mt-2 text-sm font-medium text-white'>New pieces land without warning.</p>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-white/10 px-6 py-5 text-center text-xs tracking-[0.18em] text-white/45'>
        Copyright 2026@ distressed.com - All Right Reserved
      </div>
    </footer>
  )
}

export default Footer
