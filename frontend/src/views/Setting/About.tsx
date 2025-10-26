import { Button } from '@alemonjs/react-ui'
import { PrimaryDiv } from '@alemonjs/react-ui'
import { GetVersions } from '@wailsjs/go/windowcontroller/App'
import _ from 'lodash'
import { useEffect, useState } from 'react'
const About = () => {
  const [versions, setVersions] = useState<{
    node: string
    platform: string
  }>({
    node: '',
    platform: ''
  })

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // window.controller.onDownloadProgress((value: number) => {
    //   setProgress(value)
    // })
    GetVersions().then(res => {
      setVersions(res)
    })
  }, [])

  const onClickUpdate = _.throttle(() => {
    // window.controller.updateVersion()
  }, 500)

  return (
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex justify-center items-center">
      <div className="flex-col gap-2 flex justify-center py-6 items-center">
        <PrimaryDiv className="flex flex-col items-center  justify-center flex-1  p-6 rounded-lg ">
          <h2 className="text-2xl lg:text-4xl  xl:text-6xl font-semibold mb-4">AlemonJS</h2>
          <ul className="list-disc pl-5 text-md lg:text-xl  xl:text-2xl">
            <li>Node 版本: {versions.node}</li>
            <li>平台: {versions.platform}</li>
          </ul>
          <Button
            onClick={onClickUpdate}
            className="mt-4 px-6 py-1 rounded-lg  duration-700 transition-all text-md lg:text-xl  xl:text-2xl  "
          >
            <div>检查更新</div>
          </Button>
          <div className="h-10 w-full">
            {progress > 0 && (
              <div className="relative mt-2 h-2 bg-gray-300 rounded">
                <div
                  className="absolute h-full bg-white rounded"
                  style={{ width: `${progress > 100 ? 100 : progress}%` }}
                />
              </div>
            )}
          </div>
        </PrimaryDiv>
      </div>
    </div>
  )
}
export default About
