import { PrimaryDiv } from '@alemonjs/react-ui'

const data = [
  {
    version: '1.0.0',
    log: ['全新架构']
  }
]

const UpdateLog = () => {
  return (
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex">
      <div className="flex-col gap-2 flex-1 flex p-6 ">
        <PrimaryDiv className="flex flex-col flex-1  p-6 rounded-lg shadow-inner  max-w-full">
          <div
            className="text-2xl flex items-center justify-between font-semibold mb-4 border-b
            border-secondary-border
           dark:border-dark-secondary-border
          "
          >
            <div>更新记录</div>
          </div>
          <div className="flex flex-col gap-4 h-[calc(100vh-11rem)] overflow-auto scrollba">
            <div className="flex  flex-col flex-1 overflow-auto h-[calc(100vh-2.4rem)] scrollbar gap-6 py-4 rounded-lg  ">
              {data.map((item, index) => (
                <div key={index}>
                  <h2 className="text-2xl font-semibold mb-4">{item.version}</h2>
                  <ul className="list-disc pl-6 space-y-2 ">
                    {item.log.map((log, index) => (
                      <li key={index} className="text-sm ">
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </PrimaryDiv>
      </div>
    </div>
  )
}

export default UpdateLog
