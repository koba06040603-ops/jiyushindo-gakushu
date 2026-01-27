import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
        <style>{`
          /* テキスト入力カーソルを黒に設定 */
          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="password"],
          textarea {
            caret-color: #000000 !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
})
