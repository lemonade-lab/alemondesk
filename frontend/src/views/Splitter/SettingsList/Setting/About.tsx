import { GetVersions } from '@wailsjs/window/controller/app'
import logoURL from '@/assets/logo.jpg'
import _ from 'lodash'
import { useEffect } from 'react'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { setAbout } from '@/store/about'
import Box from '@/common/layout/Box'
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
    <Box className="animate__animated animate__fadeIn flex-1 flex-col flex justify-center items-center">
      <div className="flex-col gap-2 flex justify-center py-6 items-center">
        <div className="flex flex-col items-center  justify-center flex-1 px-6  py-1 rounded-3xl ">
          <img src={logoURL} alt="logo" className="w-72 h-28" />
          <div className="list-disc pl-5 text-md lg:text-xl flex flex-col justify-center items-center  xl:text-2xl">
            <div>
              {about.platform}-{about.arch}-{about.node}
            </div>
            <div>Copyright © 2024-present Lemonade-Lab</div>
            <div className="select-text">https://alemonjs.com</div>
          </div>
        </div>
      </div>
    </Box>
  )
}
export default About
