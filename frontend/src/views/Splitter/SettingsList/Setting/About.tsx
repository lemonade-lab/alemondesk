import { GetVersions } from '@wailsjs/window/controller/app'
import logoURL from '@/assets/logo.jpg'
import { useEffect } from 'react'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { setAbout } from '@/store/about'
import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'

const About = () => {
  const about = useSelector((state: RootState) => state.about)
  const dispatch = useDispatch()
  useEffect(() => {
    if (!about.platform) {
      GetVersions().then(res => {
        dispatch(
          setAbout({
            arch: res.arch,
            node: res.node,
            platform: res.platform,
            version: res.version
          })
        )
      })
    }
  }, [])
  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">关于</div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <img src={logoURL} alt="logo" className="w-72 h-28" />
              <div className="flex flex-col justify-center items-center gap-1 text-md lg:text-xl xl:text-2xl">
                <div>
                  {about.platform}-{about.arch}-{about.node}
                </div>
                <div>Copyright © 2024-present Lemonade-Lab</div>
                <a
                  href="https://alemonjs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="select-text text-blue-500 hover:underline cursor-pointer"
                >
                  https://alemonjs.com
                </a>
              </div>
            </div>
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
    </section>
  )
}
export default About
