package windowchat

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"alemonapp/src/logger"
	"alemonapp/src/paths"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

// PluginInfo 解析后的插件信息
type PluginInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Category    string `json:"category"`
}

// DocEntry 文档条目
type DocEntry struct {
	Path    string `json:"path"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// KnowledgeCache 知识缓存
type KnowledgeCache struct {
	mu sync.RWMutex

	plugins       []PluginInfo
	pluginsLoaded bool

	docs       []DocEntry
	docsLoaded bool

	sourceEntries []DocEntry
	sourceLoaded  bool

	skillEntries []DocEntry
	skillLoaded  bool
}

var knowledgeCache = &KnowledgeCache{}

// 知识库仓库定义
type knowledgeRepo struct {
	url  string
	name string
}

var knowledgeRepos = []knowledgeRepo{
	{"https://github.com/lemonade-lab/alemonjs.dev.git", "alemonjs.dev"},
	{"https://github.com/lemonade-lab/alemonjs.git", "alemonjs"},
	{"https://github.com/lemonade-lab/alemonjs-dev-skill.git", "alemonjs-dev-skill"},
}

// getKnowledgeBasePath 返回知识库本地存储根目录
func getKnowledgeBasePath() string {
	return filepath.Join(paths.GetStoragePath(), "knowledge")
}

// cloneOrPull 克隆或拉取单个仓库
func cloneOrPull(repo knowledgeRepo) error {
	localPath := filepath.Join(getKnowledgeBasePath(), repo.name)

	if _, err := os.Stat(filepath.Join(localPath, ".git")); err == nil {
		// 已存在，执行 pull
		r, err := git.PlainOpen(localPath)
		if err != nil {
			return fmt.Errorf("打开仓库 %s 失败: %w", repo.name, err)
		}
		w, err := r.Worktree()
		if err != nil {
			return fmt.Errorf("获取工作树 %s 失败: %w", repo.name, err)
		}
		err = w.Pull(&git.PullOptions{
			Depth:        1,
			SingleBranch: true,
		})
		if err != nil && err != git.NoErrAlreadyUpToDate {
			return fmt.Errorf("拉取 %s 失败: %w", repo.name, err)
		}
		return nil
	}

	// 首次克隆
	if err := os.MkdirAll(getKnowledgeBasePath(), 0755); err != nil {
		return fmt.Errorf("创建知识库目录失败: %w", err)
	}
	_, err := git.PlainClone(localPath, false, &git.CloneOptions{
		URL:           repo.url,
		Depth:         1,
		SingleBranch:  true,
		ReferenceName: plumbing.NewBranchReferenceName("main"),
	})
	if err != nil {
		return fmt.Errorf("克隆 %s 失败: %w", repo.name, err)
	}
	return nil
}

// cloneOrPullAll 克隆或拉取所有知识库仓库
func cloneOrPullAll() {
	for _, repo := range knowledgeRepos {
		if err := cloneOrPull(repo); err != nil {
			logger.Error("[Knowledge] %v", err)
		} else {
			logger.Info("[Knowledge] 仓库 %s 同步完成", repo.name)
		}
	}
}

// repoExists 检查指定仓库是否已克隆到本地
func repoExists(name string) bool {
	localPath := filepath.Join(getKnowledgeBasePath(), name)
	_, err := os.Stat(filepath.Join(localPath, ".git"))
	return err == nil
}

// SyncKnowledgeRepos 由用户主动触发：克隆或拉取所有知识库仓库
func SyncKnowledgeRepos() string {
	var results []string
	for _, repo := range knowledgeRepos {
		if err := cloneOrPull(repo); err != nil {
			logger.Error("[Knowledge] %v", err)
			results = append(results, fmt.Sprintf("%s: 失败 (%v)", repo.name, err))
		} else {
			logger.Info("[Knowledge] 仓库 %s 同步完成", repo.name)
			results = append(results, fmt.Sprintf("%s: 同步成功", repo.name))
		}
	}
	knowledgeCache.loadAll()
	return "知识库同步完成：\n" + strings.Join(results, "\n")
}

// StartKnowledgePreload 启动时仅从本地已有仓库加载知识（不自动拉取）
func StartKnowledgePreload() {
	go func() {
		time.Sleep(5 * time.Second)
		knowledgeCache.loadAll()
	}()
}

// loadAll 从本地仓库加载所有知识
func (kc *KnowledgeCache) loadAll() {
	kc.loadPlugins()
	kc.loadDocs()
	kc.loadSource()
	kc.loadSkill()
}

// ========== 插件知识库 ==========

// loadPlugins 从本地 alemonjs.dev 仓库读取 apps.md
func (kc *KnowledgeCache) loadPlugins() {
	appsPath := filepath.Join(getKnowledgeBasePath(), "alemonjs.dev", "docs", "apps.md")
	body, err := os.ReadFile(appsPath)
	if err != nil {
		return
	}

	raw := string(body)
	plugins := parseAppsMarkdown(raw)

	kc.mu.Lock()
	kc.plugins = plugins
	kc.pluginsLoaded = true
	kc.mu.Unlock()
}

// GetPluginKnowledge 获取插件知识
func GetPluginKnowledge() string {
	kc := knowledgeCache
	kc.mu.RLock()
	loaded := kc.pluginsLoaded
	plugins := kc.plugins
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs.dev") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadPlugins()
		kc.mu.RLock()
		plugins = kc.plugins
		kc.mu.RUnlock()
	}

	if len(plugins) == 0 {
		return "暂无插件数据。"
	}

	var sb strings.Builder
	currentCategory := ""
	for _, p := range plugins {
		if p.Category != currentCategory {
			currentCategory = p.Category
			sb.WriteString(fmt.Sprintf("\n【%s】\n", currentCategory))
		}
		sb.WriteString(fmt.Sprintf("- %s：%s (%s)\n", p.Name, p.Description, p.URL))
	}
	return sb.String()
}

// GetPluginsByKeyword 按关键词搜索插件
func GetPluginsByKeyword(keyword string) string {
	kc := knowledgeCache
	kc.mu.RLock()
	loaded := kc.pluginsLoaded
	plugins := kc.plugins
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs.dev") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadPlugins()
		kc.mu.RLock()
		plugins = kc.plugins
		kc.mu.RUnlock()
	}

	if len(plugins) == 0 {
		return "暂无插件数据。"
	}

	kw := strings.ToLower(keyword)
	var matched []PluginInfo
	for _, p := range plugins {
		if strings.Contains(strings.ToLower(p.Name), kw) ||
			strings.Contains(strings.ToLower(p.Description), kw) ||
			strings.Contains(strings.ToLower(p.Category), kw) {
			matched = append(matched, p)
		}
	}

	if len(matched) == 0 {
		return GetPluginKnowledge()
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 %d 个相关插件：\n", len(matched)))
	for _, p := range matched {
		sb.WriteString(fmt.Sprintf("- %s（%s）：%s\n  地址：%s\n", p.Name, p.Category, p.Description, p.URL))
	}
	return sb.String()
}

// parseAppsMarkdown 解析 apps.md 的 markdown 表格
func parseAppsMarkdown(md string) []PluginInfo {
	var plugins []PluginInfo
	lines := strings.Split(md, "\n")

	// 收集 [name]: url 形式的引用链接
	refLinks := make(map[string]string)
	refRe := regexp.MustCompile(`^\[([^\]]+)\]:\s*(.+)$`)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if m := refRe.FindStringSubmatch(line); m != nil {
			refLinks[m[1]] = strings.TrimSpace(m[2])
		}
	}

	currentCategory := ""
	inTable := false

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		// 检测 ### 标题作为分类
		if strings.HasPrefix(trimmed, "### ") {
			currentCategory = strings.TrimPrefix(trimmed, "### ")
			inTable = false
			continue
		}

		// 检测表格开始（表头分隔线）
		if strings.HasPrefix(trimmed, "|") && strings.Contains(trimmed, "---") {
			inTable = true
			continue
		}

		// 跳过表头行（紧接在 ### 之后的 | 项目名 | 说明 | 行）
		if strings.HasPrefix(trimmed, "|") && !inTable {
			// 检查下一行是否为分隔线
			if i+1 < len(lines) && strings.Contains(strings.TrimSpace(lines[i+1]), "---") {
				continue
			}
		}

		// 非表格行或空行结束表格
		if !strings.HasPrefix(trimmed, "|") {
			if inTable {
				inTable = false
			}
			continue
		}

		if !inTable || currentCategory == "" {
			continue
		}

		// 解析表格行: | [name] | description |
		cols := strings.Split(trimmed, "|")
		if len(cols) < 3 {
			continue
		}

		nameCol := strings.TrimSpace(cols[1])
		descCol := strings.TrimSpace(cols[2])

		// 从 [name] 提取名称
		nameRe := regexp.MustCompile(`\[([^\]]+)\]`)
		nameMatch := nameRe.FindStringSubmatch(nameCol)
		if nameMatch == nil {
			continue
		}
		name := nameMatch[1]

		// 查找对应的 URL
		url := refLinks[name]
		if url == "" {
			// 尝试从内联链接提取
			inlineRe := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
			if m := inlineRe.FindStringSubmatch(nameCol); m != nil {
				url = m[2]
			}
		}

		plugins = append(plugins, PluginInfo{
			Name:        name,
			Description: descCol,
			URL:         url,
			Category:    currentCategory,
		})
	}

	return plugins
}

// ========== 文档知识库 ==========

// loadDocs 从本地 alemonjs.dev 仓库遍历 docs/ 目录
func (kc *KnowledgeCache) loadDocs() {
	docsDir := filepath.Join(getKnowledgeBasePath(), "alemonjs.dev", "docs")
	if _, err := os.Stat(docsDir); err != nil {
		return
	}

	var docs []DocEntry
	_ = filepath.WalkDir(docsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if d.Name() == ".git" || d.Name() == "node_modules" {
				return fs.SkipDir
			}
			return nil
		}
		name := strings.ToLower(d.Name())
		if !strings.HasSuffix(name, ".md") && !strings.HasSuffix(name, ".mdx") {
			return nil
		}
		// 跳过 apps.md（由 loadPlugins 处理）和 _ 开头的文件
		if d.Name() == "apps.md" || strings.HasPrefix(d.Name(), "_") {
			return nil
		}

		body, readErr := os.ReadFile(path)
		if readErr != nil {
			return nil
		}
		relPath, _ := filepath.Rel(docsDir, path)
		relPath = filepath.ToSlash(relPath)
		content := string(body)
		title := extractDocTitle(content, relPath)
		docs = append(docs, DocEntry{Path: relPath, Title: title, Content: content})
		return nil
	})

	kc.mu.Lock()
	kc.docs = docs
	kc.docsLoaded = true
	kc.mu.Unlock()
}

// extractDocTitle 从 markdown 中提取标题
func extractDocTitle(content string, fallback string) string {
	lines := strings.Split(content, "\n")
	inFrontmatter := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" {
			inFrontmatter = !inFrontmatter
			continue
		}
		if inFrontmatter {
			// label: 'xxx' 或 title: 'xxx'
			for _, prefix := range []string{"label:", "title:"} {
				if strings.HasPrefix(trimmed, prefix) {
					val := strings.TrimPrefix(trimmed, prefix)
					val = strings.TrimSpace(val)
					val = strings.Trim(val, "'\"")
					if val != "" {
						return val
					}
				}
			}
			continue
		}
		// 第一个 # 标题
		if strings.HasPrefix(trimmed, "# ") {
			return strings.TrimPrefix(trimmed, "# ")
		}
	}
	// 用文件名作为 fallback
	parts := strings.Split(fallback, "/")
	name := parts[len(parts)-1]
	name = strings.TrimSuffix(name, ".md")
	name = strings.TrimSuffix(name, ".mdx")
	return name
}

// GetDocsIndex 返回文档目录列表
func GetDocsIndex() string {
	kc := knowledgeCache
	kc.mu.RLock()
	docs := kc.docs
	loaded := kc.docsLoaded
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs.dev") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadDocs()
		kc.mu.RLock()
		docs = kc.docs
		kc.mu.RUnlock()
	}

	if len(docs) == 0 {
		return "暂无文档数据。"
	}

	var sb strings.Builder
	sb.WriteString("alemonjs 官方文档目录：\n")
	for i, d := range docs {
		sb.WriteString(fmt.Sprintf("%d. %s（%s）\n", i+1, d.Title, d.Path))
	}
	sb.WriteString("\n可通过 search_docs 工具传入关键词查询具体内容。")
	return sb.String()
}

// SearchDocs 按关键词搜索文档内容
func SearchDocs(keyword string) string {
	kc := knowledgeCache
	kc.mu.RLock()
	docs := kc.docs
	loaded := kc.docsLoaded
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs.dev") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadDocs()
		kc.mu.RLock()
		docs = kc.docs
		kc.mu.RUnlock()
	}

	if len(docs) == 0 {
		return "暂无文档数据。"
	}

	kw := strings.ToLower(keyword)

	// 1. 先尝试精确匹配文件路径或标题
	for _, d := range docs {
		if strings.EqualFold(d.Title, keyword) ||
			strings.Contains(strings.ToLower(d.Path), kw) {
			return formatDocResult(d)
		}
	}

	// 2. 搜索标题包含关键词的文档
	var titleMatches []DocEntry
	for _, d := range docs {
		if strings.Contains(strings.ToLower(d.Title), kw) {
			titleMatches = append(titleMatches, d)
		}
	}
	if len(titleMatches) > 0 {
		return formatDocResults(titleMatches, keyword)
	}

	// 3. 搜索内容包含关键词的文档，返回相关段落
	var contentMatches []DocEntry
	for _, d := range docs {
		if strings.Contains(strings.ToLower(d.Content), kw) {
			contentMatches = append(contentMatches, d)
		}
	}
	if len(contentMatches) > 0 {
		return formatDocResults(contentMatches, keyword)
	}

	// 4. 没匹配到，返回目录
	return "未找到与\"" + keyword + "\"相关的文档。\n\n" + GetDocsIndex()
}

// formatDocResult 格式化单篇文档
func formatDocResult(d DocEntry) string {
	content := d.Content
	// 去掉 frontmatter
	content = stripFrontmatter(content)
	// 限制长度，避免超出 token
	if len(content) > 3000 {
		content = content[:3000] + "\n\n...(内容已截断，完整文档请访问官网)"
	}
	return fmt.Sprintf("📄 %s（%s）\n\n%s", d.Title, d.Path, content)
}

// formatDocResults 格式化多篇文档匹配结果
func formatDocResults(docs []DocEntry, keyword string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 %d 篇与\"%s\"相关的文档：\n\n", len(docs), keyword))

	for _, d := range docs {
		content := stripFrontmatter(d.Content)
		// 提取包含关键词的段落
		excerpt := extractExcerpt(content, keyword, 500)
		sb.WriteString(fmt.Sprintf("### %s（%s）\n%s\n\n", d.Title, d.Path, excerpt))
	}
	return sb.String()
}

// extractExcerpt 从内容中提取包含关键词的上下文段落
func extractExcerpt(content string, keyword string, maxLen int) string {
	lower := strings.ToLower(content)
	kw := strings.ToLower(keyword)
	idx := strings.Index(lower, kw)
	if idx < 0 {
		// 没找到，返回开头
		if len(content) > maxLen {
			return content[:maxLen] + "..."
		}
		return content
	}

	start := idx - 200
	if start < 0 {
		start = 0
	}
	end := idx + len(keyword) + 300
	if end > len(content) {
		end = len(content)
	}

	excerpt := content[start:end]
	if start > 0 {
		excerpt = "..." + excerpt
	}
	if end < len(content) {
		excerpt = excerpt + "..."
	}
	return excerpt
}

// stripFrontmatter 去掉 markdown frontmatter
func stripFrontmatter(content string) string {
	if !strings.HasPrefix(strings.TrimSpace(content), "---") {
		return content
	}
	parts := strings.SplitN(content, "---", 3)
	if len(parts) >= 3 {
		return strings.TrimSpace(parts[2])
	}
	return content
}

// ========== 源码知识库 (alemonjs 仓库) ==========

// 框架源码中需要读取的关键文件
var sourcePaths = []string{
	"README.md",
	"packages/alemonjs/README.md",
}

// loadSource 从本地 alemonjs 仓库读取源码文档
func (kc *KnowledgeCache) loadSource() {
	baseDir := filepath.Join(getKnowledgeBasePath(), "alemonjs")
	var entries []DocEntry

	for _, p := range sourcePaths {
		body, err := os.ReadFile(filepath.Join(baseDir, p))
		if err != nil {
			continue
		}
		content := string(body)
		title := extractDocTitle(content, p)
		entries = append(entries, DocEntry{Path: p, Title: title, Content: content})
	}

	kc.mu.Lock()
	kc.sourceEntries = entries
	kc.sourceLoaded = true
	kc.mu.Unlock()
}

// SearchSource 搜索框架源码知识
func SearchSource(keyword string) string {
	kc := knowledgeCache
	kc.mu.RLock()
	entries := kc.sourceEntries
	loaded := kc.sourceLoaded
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadSource()
		kc.mu.RLock()
		entries = kc.sourceEntries
		kc.mu.RUnlock()
	}

	if len(entries) == 0 {
		return "暂无源码数据。"
	}

	if keyword == "" {
		// 返回全部内容摘要
		var sb strings.Builder
		sb.WriteString("alemonjs 框架源码知识：\n\n")
		for _, e := range entries {
			content := stripFrontmatter(e.Content)
			if len(content) > 2000 {
				content = content[:2000] + "\n...(内容已截断)"
			}
			sb.WriteString(fmt.Sprintf("### %s（%s）\n%s\n\n", e.Title, e.Path, content))
		}
		return sb.String()
	}

	kw := strings.ToLower(keyword)
	var matched []DocEntry
	for _, e := range entries {
		if strings.Contains(strings.ToLower(e.Content), kw) ||
			strings.Contains(strings.ToLower(e.Title), kw) {
			matched = append(matched, e)
		}
	}

	if len(matched) == 0 {
		// 没精确匹配，返回全部
		return SearchSource("")
	}

	return formatDocResults(matched, keyword)
}

// ========== 开发技能知识库 (alemonjs-dev-skill 仓库) ==========

// loadSkill 从本地 alemonjs-dev-skill 仓库遍历加载所有 .md 文件
func (kc *KnowledgeCache) loadSkill() {
	baseDir := filepath.Join(getKnowledgeBasePath(), "alemonjs-dev-skill")
	if _, err := os.Stat(baseDir); err != nil {
		return
	}

	var entries []DocEntry
	_ = filepath.WalkDir(baseDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if d.Name() == ".git" || d.Name() == "node_modules" {
				return fs.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(d.Name()), ".md") {
			return nil
		}
		body, readErr := os.ReadFile(path)
		if readErr != nil {
			return nil
		}
		relPath, _ := filepath.Rel(baseDir, path)
		relPath = filepath.ToSlash(relPath)
		content := string(body)
		title := extractDocTitle(content, relPath)
		entries = append(entries, DocEntry{Path: relPath, Title: title, Content: content})
		return nil
	})

	kc.mu.Lock()
	kc.skillEntries = entries
	kc.skillLoaded = true
	kc.mu.Unlock()
}

// SearchSkill 搜索开发技能知识
func SearchSkill(keyword string) string {
	kc := knowledgeCache
	kc.mu.RLock()
	entries := kc.skillEntries
	loaded := kc.skillLoaded
	kc.mu.RUnlock()

	if !loaded {
		if !repoExists("alemonjs-dev-skill") {
			return "知识库尚未同步，请先让我同步知识库（调用 sync_knowledge）。"
		}
		kc.loadSkill()
		kc.mu.RLock()
		entries = kc.skillEntries
		kc.mu.RUnlock()
	}

	if len(entries) == 0 {
		return "暂无开发技能数据。"
	}

	if keyword == "" {
		// 返回 SKILL.md 全文 + 各 references 摘要
		var sb strings.Builder
		sb.WriteString("alemonjs 开发技能知识：\n\n")
		for _, e := range entries {
			content := stripFrontmatter(e.Content)
			if len(content) > 2000 {
				content = content[:2000] + "\n...(内容已截断)"
			}
			sb.WriteString(fmt.Sprintf("### %s（%s）\n%s\n\n", e.Title, e.Path, content))
		}
		return sb.String()
	}

	kw := strings.ToLower(keyword)
	var matched []DocEntry
	for _, e := range entries {
		if strings.Contains(strings.ToLower(e.Content), kw) ||
			strings.Contains(strings.ToLower(e.Title), kw) {
			matched = append(matched, e)
		}
	}

	if len(matched) == 0 {
		return SearchSkill("")
	}

	return formatDocResults(matched, keyword)
}
