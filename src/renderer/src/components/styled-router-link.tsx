import { styled } from '@mui/material'
import Link from '@mui/material/Link'
import { createLink } from '@tanstack/react-router'

export const StyledRouterLink = createLink(
  styled(Link)({
    fontFamily: 'Roboto'
  })
)
