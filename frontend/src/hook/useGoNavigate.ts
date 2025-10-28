import { RootState } from '@/store'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { NavigateOptions, useNavigate } from 'react-router-dom'
/**
 * @returns
 */
export default function useGoNavigate() {
  const navigate = useNavigate()
  const modules = useSelector((state: RootState) => state.modules)
  const expansions = useSelector((state: RootState) => state.expansions)
  const statusRef = useRef({
    nodeModulesStatus: modules.nodeModulesStatus,
    runStatus: expansions.runStatus
  })
  useEffect(() => {
    statusRef.current = {
      nodeModulesStatus: modules.nodeModulesStatus,
      runStatus: expansions.runStatus
    }
  }, [modules.nodeModulesStatus, expansions.runStatus])
  const navigateTo = (path: string, options?: NavigateOptions) => {
    navigate(path, options)
  }
  return navigateTo
}
