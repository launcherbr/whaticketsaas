import React from 'react';

import { Paper, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import ListItemLink from '../../../../components/ListItemLink';
import { useSystem } from '../../../../hooks/useSystem';
import { StyledMainHeader } from './style';

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    width: '100%',
  },

  listPaper: {
    flex: 1,
    overflowY: 'scroll',
    padding: theme.spacing(1),
    ...theme.scrollbarStyles,
    width: '100%',
  },
}));

export default function ReportsContainer({ title, links }) {
  const { system } = useSystem();

  const classes = useStyles();

  return (
    <Paper className={classes.mainPaper}>
      <StyledMainHeader style={{ backgroundColor: system && system.color ? system.color : '#008080' }}>
        <span>{title}</span>
      </StyledMainHeader>
      <Box className={classes.listPaper}>
        {links.map((link, index) => (
          <ListItemLink key={index} to={link.to} primary={link.label} />
        ))}
      </Box>
    </Paper>
  );
}
