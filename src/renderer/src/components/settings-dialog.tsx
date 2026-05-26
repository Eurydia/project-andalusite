import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { FC } from 'react'

export const SettingsDialog: FC<{ open: boolean; onClose: () => unknown }> = (props) => {
  return (
    <Dialog fullWidth maxWidth="md" open={props.open} onClose={props.onClose}>
      <DialogTitle>{`Settings`}</DialogTitle>
      <DialogContent>
        <DialogContentText>{`Hang on tight. This feature will be coming soon 😉`}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{`Close`}</Button>
      </DialogActions>
    </Dialog>
  )
}
