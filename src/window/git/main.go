package windowgit

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v5"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
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
func (a *App) GitReposList(name string) ([]GitRepoInfo, error) {
	var repos []GitRepoInfo
	path := paths.GetBotPackagesPath(config.BotName)
	if name == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	// 读取目录
	entries, err := os.ReadDir(path)
	if err != nil {
		return repos, err
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

	return repos, nil
}

// 克隆仓库
func (a *App) GitClone(space string, repoUrl string) (bool, error) {
	// 根据 space 参数确定克隆路径
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	// 确保目录存在
	if err := os.MkdirAll(path, 0755); err != nil {
		return false, err
	}

	// 从 URL 中提取仓库名称
	repoName := filepath.Base(repoUrl)
	clonePath := filepath.Join(path, strings.Replace(repoName, ".git", "", 1))

	// 使用简单的 PlainClone 方法
	_, err := git.PlainClone(clonePath, false, &git.CloneOptions{
		URL:      repoUrl,
		Progress: os.Stdout,
	})
	if err != nil {
		return false, err
	}

	return true, nil
}

func GitPull(space string, name string) (bool, error) {
	path := paths.GetBotPackagesPath(config.BotName)
	if space == "plugins" {
		path = paths.GetBotPluginsPath(config.BotName)
	}
	repoPath := filepath.Join(path, name)

	// 打开仓库
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		logger.Error("打开仓库错误:", repoPath, err)
		return false, err
	}

	// 获取工作树
	worktree, err := repo.Worktree()
	if err != nil {
		logger.Error("获取工作树错误:", err)
		return false, err
	}

	// 拉取最新更改
	err = worktree.Pull(&git.PullOptions{
		RemoteName: "origin",
		Progress:   os.Stdout,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		logger.Error("拉取错误:", err)
		return false, err
	}

	return true, nil
}

func (a *App) GitFetch(space string, repoUrl string) (bool, error) {
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
		return false, err
	}

	// 获取远程
	remote, err := repo.Remote("origin")
	if err != nil {
		logger.Error("获取远程错误:", err)
		return false, err
	}

	// 拉取最新更改
	err = remote.Fetch(&git.FetchOptions{
		Progress: os.Stdout,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		logger.Error("拉取错误:", err)
		return false, err
	}

	return true, nil
}

func (a *App) GitDelete(space string, name string) (bool, error) {
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
		return false, err
	}

	return true, nil
}

func (a *App) GitCheckout(space string, name string, branch string) (bool, error) {
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
		return false, err
	}

	// 获取工作树
	worktree, err := repo.Worktree()
	if err != nil {
		logger.Error("获取工作树错误:", err)
		return false, err
	}

	// 切换分支
	err = worktree.Checkout(&git.CheckoutOptions{
		// Branch: git.ReferenceName("refs/heads/" + branch),
		// Branch: git.Renamed("refs/heads/" + branch),
	})
	if err != nil {
		logger.Error("切换分支错误:", err)
		return false, err
	}

	return true, nil
}
