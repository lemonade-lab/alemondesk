import axios from 'axios'

const KEY = 'alemonjs'

// https://registry.npmmirror.com
// https://registry.npmjs.org
const BASE_URL = 'https://registry.npmmirror.com'
const BASE_URL2 = 'https://registry.npmjs.org'

// `https://cdn.npmmirror.com/packages/${name}/${version}/${pathName}`
//`https://unpkg.com/${name}@${version}/${pathName}`
const FILE_URL = 'https://cdn.npmmirror.com/packages'

const HUB_URL = 'https://api.github.com/repos'

/**
 * 智能补全 Git 仓库地址
 * 支持输入格式：
 *   user/repo
 *   github.com/user/repo
 *   github.com:user/repo
 *   https://github.com/user/repo
 *   https://github.com/user/repo.git
 *   git@github.com:user/repo.git
 * 统一输出为完整的 https://.../xxx.git 格式
 */
export function normalizeGitUrl(input: string): string {
  let url = input.trim()
  if (!url) return url

  // 已经是 SSH 格式，直接返回（补 .git）
  if (/^git@/.test(url)) {
    return url.endsWith('.git') ? url : url + '.git'
  }

  // 处理 domain:user/repo 格式（无 git@ 前缀的冒号分隔），转为 domain/user/repo
  url = url.replace(/^([^/:]+):([^/])/, '$1/$2')

  // 去掉协议头，统一处理
  const stripped = url.replace(/^https?:\/\//, '').replace(/^www\./, '')

  // 拆分路径段
  const parts = stripped.split('/').filter(Boolean)

  if (parts.length === 2) {
    // 只有 user/repo，默认补全为 github.com
    url = 'https://github.com/' + parts.join('/')
  } else if (parts.length >= 3) {
    // 有域名/user/repo，补全协议
    url = 'https://' + parts.join('/')
  } else {
    // 只有一个段或为空，无法识别
    return url
  }

  // 补全 .git 后缀
  if (!url.endsWith('.git')) {
    url += '.git'
  }
  return url
}

// 判断一个 URL 是否是 Git 仓库 格式
export function isGitRepositoryFormat(url: string) {
  if (!/^(https:\/\/|git@).*\.git$/.test(url)) {
    console.error('Invalid repository URL')
    return false
  }
  return true
}

// 创建 npmjs的链接
export const createNPMJSURL = ({
  name,
  version,
  path
}: {
  name: string
  version: string
  path: string
}) => {
  // 可能是  ./xx  /xx
  const pathName = path.replace(/^\./, '').replace(/^\//, '')
  return `${FILE_URL}/${name}/${version}/${pathName}`
}

const parseSearchResponse = (data: any) =>
  (data.objects || []).map((obj: any) => ({
    name: obj.package?.name || '',
    version: obj.package?.version || '',
    description: obj.package?.description || '',
    author: obj.package?.author || null
  }))

/**
 * 搜索 npm 扩展包
 * @param keyword 搜索关键词
 * @returns 搜索结果列表
 */
export const searchPackages = async (keyword: string) => {
  const text = encodeURIComponent(keyword)
  const response = await axios
    .get(`${BASE_URL}/-/v1/search?text=${text}+keywords:alemonjs&size=20`)
    .then(res => res.data)
  return parseSearchResponse(response)
}

/**
 * 搜索默认推荐扩展（@alemonjs + alemonjs-）
 * @returns 去重后的搜索结果
 */
export const searchDefaultPackages = async () => {
  const [res1, res2] = await Promise.all([
    axios.get(`${BASE_URL}/-/v1/search?text=@alemonjs&size=20`).then(r => r.data),
    axios.get(`${BASE_URL}/-/v1/search?text=alemonjs-&size=20`).then(r => r.data)
  ])
  const items1 = parseSearchResponse(res1)
  const items2 = parseSearchResponse(res2)
  const seen = new Set<string>()
  const merged: typeof items1 = []
  for (const item of [...items1, ...items2]) {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      merged.push(item)
    }
  }
  return merged
}

/**
 * 获取包信息
 * @param packageName
 * @returns
 */
export const fetchPackageInfo = async (packageName: string) => {
  const response = await axios.get(`${BASE_URL}/${packageName}`).then(res => res.data)
  const version = response['dist-tags'].latest
  const pkgURL = createNPMJSURL({
    name: packageName,
    version: version,
    path: 'package.json'
  })
  let pkg: any = {}
  try {
    pkg = await axios.get(pkgURL).then(res => res.data)
  } catch {
    // CDN 可能返回 405 等错误，回退到 registry 中已有的版本信息
    pkg = response.versions?.[version] || {}
  }
  let __logo_url: string | null = null
  let __icon = null
  if (pkg?.alemonjs?.desktop?.logo) {
    if (pkg.alemonjs.desktop.logo.startsWith('antd.')) {
      __icon = pkg.alemonjs.desktop.logo
    } else {
      __logo_url = createNPMJSURL({
        name: packageName,
        version: version,
        path: pkg.alemonjs.desktop.logo
      })
    }
  }
  const versions = Object.keys(response.versions)
  const data = {
    'name': response.name,
    'description': response.description,
    'author': response.author,
    'dist-tags': response['dist-tags'],
    'version': response['dist-tags'].latest,
    'readme': response.readme || '',
    '__logo_url': __logo_url,
    '__icon': __icon,
    versions
  }
  console.log('response', response)
  return data
}

// 包版本校验缓存: key = "name@version" -> true(有效) / false(无效)
const pkgVersionCache = new Map<string, boolean>()

/**
 * 校验 npm 包版本是否存在
 * 支持 latest / ^x.x.x / ~x.x.x / x.x.x / >=x.x.x 等格式
 * 带缓存，相同 name@version 不会重复请求
 * @returns { valid: boolean, resolved?: string, error?: string }
 */
export const validatePkgVersion = async (
  name: string,
  version: string
): Promise<{ valid: boolean; resolved?: string; error?: string }> => {
  const cacheKey = `${name}@${version}`
  if (pkgVersionCache.has(cacheKey)) {
    return pkgVersionCache.get(cacheKey)!
      ? { valid: true, resolved: version }
      : { valid: false, error: `${cacheKey} 不存在` }
  }
  try {
    const res = await axios.get(`${BASE_URL}/${encodeURIComponent(name)}`)
    const data = res.data
    const distTags = data['dist-tags'] || {}
    const versions = Object.keys(data.versions || {})

    // latest / next 等 dist-tag
    if (version in distTags) {
      pkgVersionCache.set(cacheKey, true)
      return { valid: true, resolved: distTags[version] }
    }

    // 精确版本号
    const bare = version.replace(/^[\^~>=<]+/, '')
    if (versions.includes(bare)) {
      pkgVersionCache.set(cacheKey, true)
      return { valid: true, resolved: bare }
    }

    // 带范围前缀（^1.0.0 等），只要裸版本存在就视为合法
    if (bare !== version && versions.includes(bare)) {
      pkgVersionCache.set(cacheKey, true)
      return { valid: true, resolved: bare }
    }

    // 通配符 * 始终合法
    if (version === '*') {
      pkgVersionCache.set(cacheKey, true)
      return { valid: true, resolved: distTags['latest'] || versions[versions.length - 1] }
    }

    pkgVersionCache.set(cacheKey, false)
    return { valid: false, error: `${name}@${version} 版本不存在` }
  } catch {
    // 包本身不存在
    pkgVersionCache.set(cacheKey, false)
    return { valid: false, error: `包 ${name} 不存在或网络异常` }
  }
}

// 获取包的版本信息
export const extractRepoInfo = (url: string) => {
  // 匹配 HTTPS 或 HTTP 格式的 URL
  const httpsRegex = /(?:https?:\/\/)?(?:www\.)?([^\/]+)\/([^\/]+)\/([^\/]+)(?:\.git)?$/
  // 匹配 SSH 格式的 URL
  const sshRegex = /(?:git@)?([^:]+):([^\/]+)\/([^\/]+)(?:\.git)?$/
  let match = url.match(httpsRegex) || url.match(sshRegex)
  if (match) {
    return {
      platform: match[1], // 平台域名（如 github.com、gitlab.com 或自定义域名）
      username: match[2], // 用户名或组织名
      repository: match[3].replace(/\.git$/, '') // 仓库名，去掉 .git 后缀
    }
  }
  throw new Error('Invalid repository URL')
}

// 获取仓库的分支信息
export const fetchGitHubBranches = async (username: string, repository: string) => {
  try {
    const response = await axios.get(`${HUB_URL}/${username}/${repository}/branches`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    })
    return response.data as {
      name: string
      commit: {
        sha: string
        url: string
      }
      protected: boolean
    }[]
  } catch (error) {
    console.error('Error fetching branches:', error)
  }
}

// 获取仓库的标签信息
export const getPackages = async () => {
  return await axios
    .get(`${BASE_URL2}/-/v1/search`, {
      params: {
        text: KEY
        // size: 50
      }
    })
    .then(res => res.data)
}
