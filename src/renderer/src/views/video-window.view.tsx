import { Box } from '@mui/material'
import { FC } from 'react'

export const View$VideoWindow: FC<{ url: string }> = (props) => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        backgroundColor: (t) => t.palette.primary.main
      }}
    >
      <video
        src={props.url}
        style={{
          border: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
        controls
        autoPlay
      >
        <source type="video/mp4" src={props.url} />
      </video>
    </Box>
  )
}
