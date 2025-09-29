import React from 'react';

import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    flex: 1,
    padding: theme.spacing(2),
    height: `calc(100% - 48px)`,
  },

  contentWrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const MainContainer = ({ children }) => {
  const classes = useStyles();

  return (
    <Container className={classes.mainContainer}>
      <div className={classes.contentWrapper}>{children}</div>
    </Container>
  );
};

export default MainContainer;
