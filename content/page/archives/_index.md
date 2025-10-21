---
title: 归档
description: 文章归档页面
---

# 文章归档

{{ range $year, $posts := where .Site.RegularPages "Type" "post" | groupByDate "2006" }}
## {{ $year }}

{{ range $posts }}
- **{{ .Date.Format "2006-01-02" }}**: [{{ .Title }}]({{ .RelPermalink }})
{{ end }}
{{ end }}