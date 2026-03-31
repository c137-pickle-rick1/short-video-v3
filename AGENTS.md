<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Empty State Conventions

- Reuse `apps/web/components/common/EmptyState.tsx` for empty states instead of inline text blocks.
- Use Phosphor icons only. Do not use emoji for empty states.
- Use `framed={true}` for standalone page sections and `framed={false}` when the empty state is rendered inside an existing card or panel.

### Copy Style

- Search results: use `未找到...`
- Regular list, collection, or resource pages: use `暂无...`
- Keep descriptions to one sentence.
- Prefer the pattern: `When X happens, this area will show Y.`
- Avoid mixing casual prompts and system copy in the same area.

### Icon Mapping

- Content collections: use object icons such as `VideoCamera`, `FilmStrip`, `BookmarkSimple`, `Tag`, `SquaresFour`
- Social or relationship states: use people-oriented icons such as `UserList`, `Users`
- Status or process states: use `Clock`, `UploadSimple`, `Warning`
- Stats or analytics states: use `ChartBar`, `Trophy`
- Search empty states: use `MagnifyingGlass`

### Examples

- Good: `暂无收藏` + `收藏视频后，这里会保留想回看的内容。`
- Good: `未找到相关内容` + `换个关键词后，这里会显示匹配的搜索结果。`
- Avoid: `还没有...` unless the page is explicitly about a user-created progress state and the tone needs to feel more personal.
