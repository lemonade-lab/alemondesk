package windowgit

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx         context.Context
	application *application.EventManager
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SetApplication(app *application.EventManager) {
	a.application = app
}

// 仓库信息
type GitRepoInfo struct {
	Name string
	// 是否是完整的仓库,判断是否有.git目录
	IsFullRepo bool
	RemoteURL  string
	Branch     string
	LastCommit string
}

// 获取指定目录下的所有仓库
func (a *App) GitReposList(name string) []GitRepoInfo {
	var repos []GitRepoInfo
	path := paths.GetBotPackagesPath(config.BotName)
	if name == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	// 读取目录
	entries, err := os.ReadDir(path)
	if err != nil {
		return repos
	}

	for _, entry := range entries {
		if entry.IsDir() {
			IsFullRepo := false
			remoteURL := ""
			branch := ""
			lastCommit := ""

			repoPath := filepath.Join(path, entry.Name())
			repo, err := git.PlainOpen(repoPath)
			if err == nil {
				IsFullRepo = true

				// 获取远程 URL
				remotes, err := repo.Remotes()
				if err == nil && len(remotes) > 0 {
					remoteURL = remotes[0].Config().URLs[0]
				}

				// 获取当前分支
				head, err := repo.Head()
				if err == nil {
					branch = head.Name().Short()
				}

				// 获取最后一次提交
				ref, err := repo.Head()
				if err == nil {
					commit, err := repo.CommitObject(ref.Hash())
					if err == nil {
						lastCommit = commit.Hash.String()
					}
				}
			}

			repos = append(repos, GitRepoInfo{
				Name:       entry.Name(),
				IsFullRepo: IsFullRepo,
				RemoteURL:  remoteURL,
				Branch:     branch,
				LastCommit: lastCommit,
			})
		}
	}

	return repos
}

// 克隆参数
type GitCloneOptions struct {
	Space   string `json:"space"` // packages 或 plugins
	RepoURL string `json:"repo_url"`
	Branch  string `json:"branch"`
	Depth   int    `json:"depth"`
	Force   bool   `json:"force"` // 新增：是否强制覆盖
}

// 克隆仓库
func (a *App) GitClone(params GitCloneOptions) {
	space := params.Space
	repoUrl := params.RepoURL
	branch := params.Branch
	depth := params.Depth
	force := params.Force
	// 根据 space 参数确定克隆路径
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	// 确保目录存在
	if err := os.MkdirAll(path, 0755); err != nil {
		// 发送git-clone-error事件
		logger.Error("创建目录失败:", err)
		// context有效性
		if a.ctx != nil {
			a.application.Emit("git", map[string]interface{}{
				"type":  "clone",
				"value": 0,
			})
		}
		return
	}

	// 从 URL 中提取仓库名称
	repoName := filepath.Base(repoUrl)
	clonePath := filepath.Join(path, strings.Replace(repoName, ".git", "", 1))

	// 检查目录是否已存在
	if _, err := os.Stat(clonePath); err == nil {
		if force {
			// 强制覆盖：删除已存在的目录
			if err := os.RemoveAll(clonePath); err != nil {
				logger.Error("删除已存在目录失败:", clonePath, err)
				// context有效性
				if a.ctx != nil {
					a.application.Emit("git", map[string]interface{}{
						"type":  "clone",
						"value": 0,
					})
				}
				return
			}
		} else {
			// 目录已存在且不强制覆盖，返回失败
			logger.Error("目录已存在，克隆失败:", clonePath)
			return
		}
	}

	// 构建 CloneOptions
	cloneOpts := &git.CloneOptions{
		URL:          repoUrl,
		Progress:     os.Stdout,
		Depth:        depth,
		SingleBranch: true, // 只克隆单个分支以节省时间和空间
	}

	// 如果指定了分支，设置 ReferenceName
	if branch != "" {
		cloneOpts.ReferenceName = plumbing.ReferenceName(fmt.Sprintf("refs/heads/%s", branch))
	}

	// 使用 PlainClone 方法克隆仓库
	_, err := git.PlainClone(clonePath, false, cloneOpts)
	if err != nil {
		logger.Error("克隆仓库错误:", err)
		// context有效性
		if a.ctx != nil {
			a.application.Emit("git", map[string]interface{}{
				"type":  "clone",
				"value": 0,
			})
		}
		return
	}
	// 发送克隆成功事件
	// context有效性
	if a.ctx != nil {
		a.application.Emit("git", map[string]interface{}{
			"type":  "clone",
			"value": 1,
		})
	}
}

func (a *App) GitDelete(space string, name string) {
	// 根据 space 参数确定路径
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	repoPath := filepath.Join(path, name)

	// 删除目录
	err := os.RemoveAll(repoPath)
	if err != nil {
		logger.Error("删除仓库错误:", repoPath, err)
		// context有效性
		if a.ctx != nil {
			a.application.Emit("git", map[string]interface{}{
				"type":  "delete",
				"value": 0,
			})
		}
		return
	}
	// context有效性
	if a.ctx != nil {
		a.application.Emit("git", map[string]interface{}{
			"type":  "delete",
			"value": 1,
		})
	}
}

func GitPull(space string, name string) {
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	repoPath := filepath.Join(path, name)

	// 打开仓库
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		logger.Error("打开仓库错误:", repoPath, err)
		return
	}

	// 获取工作树
	worktree, err := repo.Worktree()
	if err != nil {
		logger.Error("获取工作树错误:", err)
		return
	}

	// 拉取最新更改
	err = worktree.Pull(&git.PullOptions{
		RemoteName: "origin",
		Progress:   os.Stdout,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		logger.Error("拉取错误:", err)
		return
	}

}

func (a *App) GitFetch(space string, repoUrl string) {
	// 根据 space 参数确定路径
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	repoPath := filepath.Join(path, repoUrl)

	// 打开仓库
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		logger.Error("打开仓库错误:", repoPath, err)
		return
	}

	// 获取远程
	remote, err := repo.Remote("origin")
	if err != nil {
		logger.Error("获取远程错误:", err)
		return
	}

	// 拉取最新更改
	err = remote.Fetch(&git.FetchOptions{
		Progress: os.Stdout,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		logger.Error("拉取错误:", err)
		return
	}

}

func (a *App) GitCheckout(space string, name string, branch string) {
	// 根据 space 参数确定路径
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	repoPath := filepath.Join(path, name)

	// 打开仓库
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		logger.Error("打开仓库错误:", repoPath, err)
		return
	}

	// 获取工作树
	worktree, err := repo.Worktree()
	if err != nil {
		logger.Error("获取工作树错误:", err)
		return
	}

	// 切换分支
	err = worktree.Checkout(&git.CheckoutOptions{
		// Branch: git.ReferenceName("refs/heads/" + branch),
		// Branch: git.Renamed("refs/heads/" + branch),
	})
	if err != nil {
		logger.Error("切换分支错误:", err)
		return
	}

}
