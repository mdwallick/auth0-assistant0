import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

function parseMarkdownIntoBlocks(markdown: string): string[] {
  if (!markdown) return []
  return [markdown]
}

export const MemoizedMarkdown = memo(function MemoizedMarkdown({
  children,
  components,
}: {
  children: string
  components?: any
}) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <>
      {blocks.map((block, i) => (
        <ReactMarkdown key={i} components={components}>
          {block}
        </ReactMarkdown>
      ))}
    </>
  )
})
