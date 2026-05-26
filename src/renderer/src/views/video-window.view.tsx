import { FC } from 'react'

export const View$VideoWindow: FC<{ url: string }> = (props) => {
  return (
    <iframe
      src={props.url}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      style={{
        border: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        objectFit: 'contain'
      }}
    />
  )
}
