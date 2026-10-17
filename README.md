# 人文札记

一个面向读者的中文社会科学网站：八门学科、四个系列、一个专题。
纯静态手排，无跟踪、无广告、无第三方脚本。

- 网址：https://renwenzhaji.github.io/
- 许可：CC BY-NC-SA 4.0（见 LICENSE）
- 订阅：RSS 全文输出 `rss.xml`

## 结构

所有页面都在仓库根目录（平铺版，便于在手机上直接上传）：

| 文件 | 作用 |
| --- | --- |
| `index.html` | 首页：hero 统计、精选、全部文章卡片、按学科浏览 |
| `<slug>.html` | 每篇文章一页（12 篇） |
| `archive.html` `tags.html` `series.html` `essays.html` `map.html` | 归档、标签、系列、专题、阅读地图 |
| `favorites.html` `history.html` | 收藏夹与阅读历史（只存本机 localStorage） |
| `submit.html` `support.html` `subscribe.html` `about.html` | 投稿、支持、订阅、关于 |
| `data.js` | 站内检索与统计用的文章数据（由文章页生成） |
| `rss.xml` `sitemap.xml` `robots.txt` | 订阅与搜索引擎 |
| `sw.js` `manifest.webmanifest` `icon.svg` | 离线缓存与「装到桌面」 |

## 加一篇文章

站内的卡片、行、计数、RSS、sitemap 都是写死的 HTML，需要一起改 11 处。
仓库外的工具脚本（不随站点发布）负责这件事：给定标题、学科、正文、日期、标签，
一条命令生成封面、文章页并同步其余 10 处，最后用 Git 一次提交。

## 部署

GitHub Pages，部署分支 `main`、目录 `/`；仓库根有 `.nojekyll`。
发版走 GitHub REST API，多文件改动合成一次提交（一文件一 commit 会触发构建配额）。

## 说明

第 1–10 篇札记由 AI 撰写，编者负责选题、事实与出处核对、审校；
长篇《身份的核验成本》与《户口上的人生》由编者在与 AI 协作下完成。详见 `about.html`。
