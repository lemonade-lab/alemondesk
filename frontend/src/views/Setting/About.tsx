import { GetVersions } from '@wailsjs/window/controller/app'
import logoURL from '@/assets/logo.jpg'
import _ from 'lodash'
import { useEffect, useState } from 'react'
const About = () => {
  const [versions, setVersions] = useState<{
    node: string
    platform: string
    arch?: string
  }>({
    node: '',
    platform: '',
    arch: ''
  })

  useEffect(() => {
    GetVersions().then(res => {
      setVersions(res)
    })
  }, [])

  return (
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex justify-center items-center">
      <div className="flex-col gap-2 flex justify-center py-6 items-center">
        <div className="flex flex-col items-center  justify-center flex-1 px-6  py-1 rounded-3xl ">
          <img src={logoURL} alt="logo" className="w-72 h-28" />
          <div className="list-disc pl-5 text-md lg:text-xl flex flex-col justify-center items-center  xl:text-2xl">
            <div>{versions.platform}-{versions.arch}-{versions.node}</div>
            <div>Copyright © 2024-present Lemonade-Lab</div>
            <div className='select-text'>https://alemonjs.com</div>
          </div>
          {/* <Button
            onClick={onClickUpdate}
            className="mt-4 px-6 py-1 rounded-lg  duration-700 transition-all text-md lg:text-xl  xl:text-2xl  "
          >
            <div>检查更新</div>
          </Button> */}
          {/* <div className="h-10 w-full">
            {progress > 0 && (
              <div className="relative mt-2 h-2 bg-gray-300 rounded">
                <div
                  className="absolute h-full bg-white rounded"
                  style={{ width: `${progress > 100 ? 100 : progress}%` }}
                />
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  )
}
export default About
