---
title: 首页
description: 博客首页
---

# 最新文章

{{ range first 5 (where .Site.RegularPages "Type" "post").ByDate.Reverse }}
## {{ .Title }}

发布于：{{ .Date.Format "2006-01-02" }}

{{ .Summary }}

[阅读更多...]({{ .RelPermalink }})

---
{{ end }}
