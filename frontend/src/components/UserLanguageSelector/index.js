import React, { useContext, useState } from "react";
import { IconButton, Menu, MenuItem, Box } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

// Objeto com os dados de cada idioma (bandeira + nome)
const languageData = {
  "pt-BR": { flag: "🇧🇷", name: "Português (BR)" },
  "en": { flag: "🇺🇸", name: "English" },
  "es": { flag: "🇪🇸", name: "Español" },
  "tr": { flag: "🇹🇷", name: "Türkçe" }
};

const UserLanguageSelector = ({ iconOnly = true }) => {
  const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);
  const { user } = useContext(AuthContext);

  const handleOpenLanguageMenu = e => {
    setLangueMenuAnchorEl(e.currentTarget);
  };

  const handleChangeLanguage = async language => {
    localStorage.setItem("language", language);
    handleCloseLanguageMenu();
    window.location.reload(false);
  };

  const handleCloseLanguageMenu = () => {
    setLangueMenuAnchorEl(null);
  };

  // Obtém o idioma atual ou usa 'pt-BR' como padrão
  const currentLanguage = user?.language || "pt-BR";

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpenLanguageMenu}
        aria-label="Selecionar idioma"
      >
        <TranslateIcon />
      </IconButton>
      
      <Menu
        anchorEl={langueMenuAnchorEl}
        keepMounted
        open={Boolean(langueMenuAnchorEl)}
        onClose={handleCloseLanguageMenu}
      >
        {Object.entries(languageData).map(([code, { flag, name }]) => (
          <MenuItem 
            key={code} 
            onClick={() => handleChangeLanguage(code)}
            selected={currentLanguage === code}
          >
            <Box display="flex" alignItems="center">
              <span style={{ fontSize: '1.2rem', marginRight: 12 }}>
                {flag}
              </span>
              {name}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default UserLanguageSelector;