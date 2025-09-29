import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Button,
  makeStyles,
  Paper
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ClearIcon from '@material-ui/icons/Clear';
import ImageIcon from '@material-ui/icons/Image';
import VideocamIcon from '@material-ui/icons/Videocam';
import DescriptionIcon from '@material-ui/icons/Description';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    position: 'relative',
  },
  mediaGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    alignItems: 'flex-start',
  },
  mediaItem: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  filePreview: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  fileIcon: {
    fontSize: '28px',
    color: theme.palette.text.secondary,
    marginBottom: '4px',
  },
  fileName: {
    fontSize: '9px',
    color: theme.palette.text.primary,
    textAlign: 'center',
    padding: '0 2px',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
  },
  deleteButton: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '20px',
    height: '20px',
    backgroundColor: theme.palette.error.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
    '& .MuiSvgIcon-root': {
      fontSize: '12px',
    },
  },
  addMoreButton: {
    width: '80px',
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '10',
    },
  },
  addMoreText: {
    fontSize: '10px',
    textAlign: 'center',
    fontWeight: 500,
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: theme.palette.background.default,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  fileCount: {
    color: theme.palette.text.secondary,
    fontSize: '12px',
  },
  clearButton: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    borderRadius: '20px',
    padding: '6px 12px',
    textTransform: 'none',
    fontSize: '12px',
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: theme.palette.error.main + '10',
    },
  },
  maxFilesWarning: {
    color: theme.palette.error.main,
    fontSize: '11px',
    textAlign: 'center',
    padding: '4px',
  },
}));

const MediaPreview = ({ medias = [], onAddMore, onRemoveMedia, onClear }) => {
  const classes = useStyles();

  const handleAddMoreClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,application/*';
    input.onchange = (e) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        onAddMore(files);
      }
    };
    input.click();
  };

  const getMediaIcon = (type) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className={classes.fileIcon} style={{ color: '#4285f4' }} />;
    } else if (type.startsWith('video/')) {
      return <VideocamIcon className={classes.fileIcon} style={{ color: '#ea4335' }} />;
    } else {
      return <DescriptionIcon className={classes.fileIcon} style={{ color: '#fbbc04' }} />;
    }
  };

  const createImagePreview = (file) => {
    return URL.createObjectURL(file);
  };

  const renderMediaItem = (media, index) => {
    const isImage = media.type.startsWith('image/');
    
    return (
      <div key={index} className={classes.mediaItem}>
        {isImage ? (
          <img
            src={createImagePreview(media)}
            alt={media.name}
            className={classes.imagePreview}
          />
        ) : (
          <div className={classes.filePreview}>
            {getMediaIcon(media.type)}
            <Typography className={classes.fileName}>
              {media.name.length > 15 ? media.name.substring(0, 12) + '...' : media.name}
            </Typography>
          </div>
        )}
        <IconButton
          className={classes.deleteButton}
          onClick={() => onRemoveMedia(index)}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
    );
  };

  if (!medias || medias.length === 0) return null;

  return (
    <Paper elevation={0} className={classes.container}>
      <div className={classes.mediaGrid}>
        {medias.map((media, index) => renderMediaItem(media, index))}
        
        {medias.length < 100 && (
          <div className={classes.addMoreButton} onClick={handleAddMoreClick}>
            <AddIcon fontSize="small" />
            <Typography className={classes.addMoreText}>
              Adicionar
            </Typography>
          </div>
        )}
      </div>

      {medias.length >= 100 && (
        <Typography className={classes.maxFilesWarning}>
          Máximo de 100 arquivos atingido
        </Typography>
      )}

      <div className={classes.actionsContainer}>
        <Typography className={classes.fileCount}>
          {medias.length}/100 arquivos
        </Typography>
        <Button
          onClick={onClear}
          className={classes.clearButton}
          variant="outlined"
          size="small"
          startIcon={<ClearIcon fontSize="small" />}
        >
          Limpar
        </Button>
      </div>
    </Paper>
  );
};

export default MediaPreview;