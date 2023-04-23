import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Hidden, Drawer, List, ListItem, ListItemText } from '@material-ui/core';
import { Menu as MenuIcon, Close as CloseIcon } from '@material-ui/icons';

const Header = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <List>
        {['Home', 'About', 'Services', 'Contact'].map((text, index) => (
          <ListItem button key={text}>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Logo
          </Typography>
          <Hidden smDown>
            <List style={{ display: 'flex' }}>
              {['Home', 'About', 'Services', 'Contact'].map((text) => (
                <ListItem button key={text}>
                  <ListItemText primary={text} />
                </ListItem>
              ))}
            </List>
          </Hidden>
          <Hidden mdUp>
            <IconButton edge="end" color="inherit" aria-label="menu" onClick={handleDrawerToggle}>
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Hidden>
        </Toolbar>
      </AppBar>
      <Hidden mdUp>
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
    </div>
  );
};

export default Header;