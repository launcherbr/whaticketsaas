import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Typography,
  makeStyles,
  Fade,
  Box,
  Chip,
} from '@material-ui/core';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@material-ui/icons';
import { i18n } from '../../translate/i18n';
import './MessageSearch.css';

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: theme.palette.background.default,
    borderRadius: '20px',
    border: `1px solid ${theme.palette.divider}`,
    fontSize: '14px',
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
    },
  },
  searchInputBase: {
    flex: 1,
    fontSize: '14px',
  },
  navigationButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navButton: {
    padding: '6px',
    color: theme.palette.text.secondary,
    '&:disabled': {
      color: theme.palette.text.disabled,
    },
  },
  closeButton: {
    padding: '6px',
    color: theme.palette.text.secondary,
  },
  resultsInfo: {
    fontSize: '12px',
    color: theme.palette.text.secondary,
    minWidth: '60px',
    textAlign: 'center',
  },
  noResults: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: '14px',
  },
  highlightedMessage: {
    backgroundColor: theme.palette.warning.light + '40 !important',
    transition: 'background-color 0.3s ease',
  },
}));

const MessageSearch = ({ 
  open, 
  onClose, 
  messages = [], 
  onMessageFound, 
  onNavigateResult 
}) => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const results = messages.filter((message) => {
      const searchText = searchTerm.toLowerCase();
      const messageText = (message.body || '').toLowerCase();
      const contactName = (message.contact?.name || '').toLowerCase();
      
      return messageText.includes(searchText) || contactName.includes(searchText);
    });

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
    
    if (results.length > 0) {
      onMessageFound(results[0]);
    }
  }, [searchTerm, messages, onMessageFound]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
    onClose();
  };

  const handleNavigateUp = () => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex > 0 
      ? currentResultIndex - 1 
      : searchResults.length - 1;
    
    setCurrentResultIndex(newIndex);
    onNavigateResult(searchResults[newIndex], newIndex);
  };

  const handleNavigateDown = () => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex < searchResults.length - 1 
      ? currentResultIndex + 1 
      : 0;
    
    setCurrentResultIndex(newIndex);
    onNavigateResult(searchResults[newIndex], newIndex);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleNavigateUp();
      } else {
        handleNavigateDown();
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper className={classes.searchContainer} elevation={2}>
        <div className={classes.searchWrapper}>
          <div className={classes.searchInput}>
            <InputBase
              ref={inputRef}
              className={classes.searchInputBase}
              placeholder={i18n.t("messageSearch.placeholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyPress}
              startAdornment={<SearchIcon style={{ marginRight: '8px', color: '#666' }} />}
            />
          </div>
          
          {searchResults.length > 0 && (
            <>
              <Typography className={classes.resultsInfo}>
                {currentResultIndex + 1} de {searchResults.length}
              </Typography>
              
              <div className={classes.navigationButtons}>
                <IconButton
                  className={classes.navButton}
                  onClick={handleNavigateUp}
                  disabled={searchResults.length === 0}
                  size="small"
                >
                  <KeyboardArrowUp />
                </IconButton>
                
                <IconButton
                  className={classes.navButton}
                  onClick={handleNavigateDown}
                  disabled={searchResults.length === 0}
                  size="small"
                >
                  <KeyboardArrowDown />
                </IconButton>
              </div>
            </>
          )}
          
          <IconButton
            className={classes.closeButton}
            onClick={handleClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </div>
        
        {searchTerm && searchResults.length === 0 && (
          <div className={classes.noResults}>
            {i18n.t("messageSearch.noResults")}
          </div>
        )}
      </Paper>
    </Fade>
  );
};

export default MessageSearch;