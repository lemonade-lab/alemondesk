package windowgit

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

// 获取用户数据仓库路径
func getUserDataWarehousePath() (string, error) {
	selectPath := getWordSpacePath()
	userDataWarehousePath := filepath.Join(userDataTemplatePath, selectPath)

	if _, err := os.Stat(userDataWarehousePath); os.IsNotExist(err) {
		err := os.MkdirAll(userDataWarehousePath, 0755)
		if err != nil {
			return "", err
		}
	}
	return userDataWarehousePath, nil
}

// 发送错误信息
func (a *App) sendError(e error) {
	fmt.Printf("Error: %v\n", e)
	if e != nil {
		// 在 Wails 中可以通过 Events 发送错误信息到前端
		runtime.EventsEmit(a.ctx, "on-terminal", e.Error())
		runtime.EventsEmit(a.ctx, "on-notification", e.Error())
	}
}

// 获取工作区
func (a *App) GitGetWordSpaces() string {
	return getWordSpacePath()
}

// 设置工作区
func (a *App) GitSetWordSpaces(selectPath string) {
	setWordSpacePath(selectPath)
}

// 获取指定目录下的所有仓库
func (a *App) GitReposList() ([]string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	files, err := os.ReadDir(userDataWarehousePath)
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	var repos []string
	for _, file := range files {
		if file.IsDir() {
			gitPath := filepath.Join(userDataWarehousePath, file.Name(), ".git")
			if _, err := os.Stat(gitPath); err == nil {
				repos = append(repos, file.Name())
			}
		}
	}
	return repos, nil
}

// 克隆仓库
func (a *App) GitClone(repoUrl string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	_, err = git.PlainClone(userDataWarehousePath, false, &git.CloneOptions{
		URL: repoUrl,
	})
	if err != nil {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 拉取
func (a *App) GitPull(name string, remote string, branch string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	err = worktree.Pull(&git.PullOptions{
		RemoteName: remote,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 获取
func (a *App) GitFetch(name string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	err = repo.Fetch(&git.FetchOptions{})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		a.sendError(err)
		return false, err
	}

	// 拉取更新
	worktree, err := repo.Worktree()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	err = worktree.Pull(&git.PullOptions{})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 当前分支信息
func (a *App) GitBranch(name string) (map[string]interface{}, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	branches, err := repo.Branches()
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	result := make(map[string]interface{})
	var allBranches []string
	var currentBranch string

	// 获取当前分支
	head, err := repo.Head()
	if err == nil {
		currentBranch = head.Name().Short()
	}

	err = branches.ForEach(func(ref *plumbing.Reference) error {
		branchName := ref.Name().Short()
		allBranches = append(allBranches, branchName)
		return nil
	})
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	result["current"] = currentBranch
	result["all"] = allBranches
	result["branches"] = allBranches

	return result, nil
}

// 切换分支
func (a *App) GitCheckout(name string, branch string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	err = worktree.Checkout(&git.CheckoutOptions{
		Branch: plumbing.NewBranchReferenceName(branch),
	})
	if err != nil {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 所有tags
func (a *App) GitTags(name string) ([]string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	tagRefs, err := repo.Tags()
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	var tags []string
	err = tagRefs.ForEach(func(ref *plumbing.Reference) error {
		tags = append(tags, ref.Name().Short())
		return nil
	})
	if err != nil {
		a.sendError(err)
		return nil, err
	}

	return tags, nil
}

// 当前分支下的所有提交
func (a *App) GitLog(name string, branch string) (string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	commitIter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		a.sendError(err)
		return "", err
	}

	var commits []map[string]interface{}
	err = commitIter.ForEach(func(commit *object.Commit) error {
		commits = append(commits, map[string]interface{}{
			"hash":    commit.Hash.String(),
			"message": commit.Message,
			"author": map[string]string{
				"name":  commit.Author.Name,
				"email": commit.Author.Email,
			},
			"date": commit.Author.When,
		})
		return nil
	})
	if err != nil {
		a.sendError(err)
		return "", err
	}

	result, err := json.Marshal(commits)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	return string(result), nil
}

// 删除仓库
func (a *App) GitDelete(name string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	err = os.RemoveAll(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 指定 hash 的 README.md
func (a *App) GitShow(name string, hash string) (string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	commit, err := repo.CommitObject(plumbing.NewHash(hash))
	if err != nil {
		a.sendError(err)
		return "", err
	}

	file, err := commit.File("README.md")
	if err != nil {
		a.sendError(err)
		return "", err
	}

	content, err := file.Contents()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	return content, nil
}

// 指定 hash 的 diff-code
func (a *App) GitDiff(name string, hash string) (string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	commit, err := repo.CommitObject(plumbing.NewHash(hash))
	if err != nil {
		a.sendError(err)
		return "", err
	}

	// 获取父提交
	parent, err := commit.Parent(0)
	if err != nil {
		// 如果没有父提交，返回空
		return "", nil
	}

	patch, err := parent.Patch(commit)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	return patch.String(), nil
}

// 指定 tags 的内容
func (a *App) GitShowTags(name string, tag string) (string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	// 获取标签对应的提交
	ref, err := repo.Tag(tag)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	var commit *object.Commit
	if ref.Hash().IsZero() {
		// 轻量标签
		commit, err = repo.CommitObject(ref.Hash())
	} else {
		// 注解标签
		tagObj, err := repo.TagObject(ref.Hash())
		if err == nil {
			commitObj, commitErr := repo.CommitObject(tagObj.Target)
			if commitErr != nil {
				a.sendError(commitErr)
				return "", commitErr
			}
			commit = commitObj
		}
	}
	if err != nil {
		a.sendError(err)
		return "", err
	}

	file, err := commit.File("README.md")
	if err != nil {
		a.sendError(err)
		return "", err
	}

	content, err := file.Contents()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	return content, nil
}

// 初始化仓库
func (a *App) GitInit(path string) (bool, error) {
	_, err := git.PlainInit(path, false)
	if err != nil {
		a.sendError(err)
		return false, err
	}
	return true, nil
}

// 推送
func (a *App) GitPush(name string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	err = repo.Push(&git.PushOptions{})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 添加远程仓库
func (a *App) GitAddRemote(name string, remoteUrl string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	// 正确的创建远程仓库方式
	_, err = repo.CreateRemote(&config.RemoteConfig{
		Name: "origin",
		URLs: []string{remoteUrl},
	})
	if err != nil {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 提交
func (a *App) GitCommit(name string, message string) (bool, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return false, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		a.sendError(err)
		return false, err
	}

	_, err = worktree.Commit(message, &git.CommitOptions{})
	if err != nil {
		a.sendError(err)
		return false, err
	}

	return true, nil
}

// 状态
func (a *App) GitStatus(name string) (string, error) {
	userDataWarehousePath, err := getUserDataWarehousePath()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	repoPath := filepath.Join(userDataWarehousePath, name)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	status, err := worktree.Status()
	if err != nil {
		a.sendError(err)
		return "", err
	}

	result, err := json.Marshal(status)
	if err != nil {
		a.sendError(err)
		return "", err
	}

	return string(result), nil
}

// 需要实现的辅助函数（需要根据你的实际代码调整）
func getWordSpacePath() string {
	// 实现获取工作区路径的逻辑
	return ""
}

func setWordSpacePath(path string) {
	// 实现设置工作区路径的逻辑
}

var userDataTemplatePath = "" // 设置你的模板路径
