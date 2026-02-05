import React, { useContext, useState } from "react";
import { IconButton, Menu, MenuItem, Box } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import brFlag from "../../assets/flags/br.webp";
import usFlag from "../../assets/flags/us.webp";
import esFlag from "../../assets/flags/es.webp";

// Objeto com os dados de cada idioma (bandeira + nome)
const languageData = {
  "pt": { flag: brFlag, name: "Português" },
  "en": { flag: usFlag, name: "English" },
  "es": { flag: esFlag, name: "Español" }
};

const UserLanguageSelector = ({ iconOnly = true }) => {
  const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);
  const { user } = useContext(AuthContext);

  const handleOpenLanguageMenu = e => {
    setLangueMenuAnchorEl(e.currentTarget);
  };

  const handleChangeLanguage = async language => {
    try {
      // Muda o idioma no i18n
      await i18n.changeLanguage(language);
      
      // Salva no localStorage com a chave correta
      localStorage.setItem("i18nextLng", language);
      
      // Salva no backend se o usuário estiver logado
      if (user && user.id) {
        try {
          await api.put(`/users/${user.id}`, { language });
        } catch (err) {
          console.error("Erro ao salvar idioma no backend:", err);
        }
      }
      
      handleCloseLanguageMenu();
      
      // Recarrega a página para aplicar todas as traduções
      window.location.reload(false);
    } catch (err) {
      toastError(err);
      handleCloseLanguageMenu();
    }
  };

  const handleCloseLanguageMenu = () => {
    setLangueMenuAnchorEl(null);
  };

  // Obtém o idioma atual do i18n ou localStorage
  const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "pt";

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpenLanguageMenu}
        aria-label="Selecionar idioma"
      >
        <TranslateIcon style={{ color: "white" }} />
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
              <img 
                src={flag} 
                alt={name}
                style={{ 
                  width: '24px', 
                  height: '16px', 
                  marginRight: 12,
                  borderRadius: '2px',
                  objectFit: 'cover'
                }}
              />
              {name}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default UserLanguageSelector;