import React, { useState, useEffect } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography
} from "@material-ui/core";
import InputMask from "react-input-mask";

// Lista completa de países com código e bandeira (emoji)
const countries = [
  { code: "+55", name: "Brasil", flag: "🇧🇷" },
  { code: "+1", name: "EUA/Canadá", flag: "🇺🇸" },
  { code: "+52", name: "México", flag: "🇲🇽" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+57", name: "Colômbia", flag: "🇨🇴" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+591", name: "Bolívia", flag: "🇧🇴" },
  { code: "+595", name: "Paraguai", flag: "🇵🇾" },
  { code: "+598", name: "Uruguai", flag: "🇺🇾" },
  { code: "+593", name: "Equador", flag: "🇪🇨" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+34", name: "Espanha", flag: "🇪🇸" },
  { code: "+49", name: "Alemanha", flag: "🇩🇪" },
  { code: "+33", name: "França", flag: "🇫🇷" },
  { code: "+39", name: "Itália", flag: "🇮🇹" },
  { code: "+44", name: "Reino Unido", flag: "🇬🇧" },
  { code: "+31", name: "Holanda", flag: "🇳🇱" },
  { code: "+32", name: "Bélgica", flag: "🇧🇪" },
  { code: "+41", name: "Suíça", flag: "🇨🇭" },
  { code: "+43", name: "Áustria", flag: "🇦🇹" },
  { code: "+45", name: "Dinamarca", flag: "🇩🇰" },
  { code: "+46", name: "Suécia", flag: "🇸🇪" },
  { code: "+47", name: "Noruega", flag: "🇳🇴" },
  { code: "+358", name: "Finlândia", flag: "🇫🇮" },
  { code: "+7", name: "Rússia/Cazaquistão", flag: "🇷🇺" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+81", name: "Japão", flag: "🇯🇵" },
  { code: "+82", name: "Coreia do Sul", flag: "🇰🇷" },
  { code: "+91", name: "Índia", flag: "🇮🇳" },
  { code: "+61", name: "Austrália", flag: "🇦🇺" },
  { code: "+64", name: "Nova Zelândia", flag: "🇳🇿" },
  { code: "+27", name: "África do Sul", flag: "🇿🇦" },
  { code: "+20", name: "Egito", flag: "🇪🇬" },
  { code: "+971", name: "Emirados Árabes", flag: "🇦🇪" },
  { code: "+966", name: "Arábia Saudita", flag: "🇸🇦" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+90", name: "Turquia", flag: "🇹🇷" },
  { code: "+60", name: "Malásia", flag: "🇲🇾" },
  { code: "+65", name: "Singapura", flag: "🇸🇬" },
  { code: "+66", name: "Tailândia", flag: "🇹🇭" },
  { code: "+84", name: "Vietnã", flag: "🇻🇳" },
  { code: "+62", name: "Indonésia", flag: "🇮🇩" },
  { code: "+63", name: "Filipinas", flag: "🇵🇭" },
  { code: "+212", name: "Marrocos", flag: "🇲🇦" },
  { code: "+234", name: "Nigéria", flag: "🇳🇬" },
  { code: "+254", name: "Quênia", flag: "🇰🇪" },
];

const CountryCodeSelector = ({ value = "", onChange, error, helperText, disabled }) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Brasil como padrão
  const [phoneNumber, setPhoneNumber] = useState("");

  // Extrair número do valor completo se fornecido
  useEffect(() => {
    if (value) {
      // Tentar encontrar país pelo código
      let found = false;
      for (const country of countries) {
        const codeWithoutPlus = country.code.replace("+", "");
        if (value.startsWith(codeWithoutPlus)) {
          setSelectedCountry(country);
          const numberOnly = value.substring(codeWithoutPlus.length).replace(/\D/g, "");
          setPhoneNumber(numberOnly);
          found = true;
          break;
        }
      }
      // Se não encontrou nenhum país conhecido, assumir que é apenas o número
      if (!found && value) {
        setPhoneNumber(value.replace(/\D/g, ""));
      }
    }
  }, [value]);

  const handleCountryChange = (event) => {
    const country = countries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      // Atualizar valor completo (sem o +)
      if (onChange) {
        const cleaned = phoneNumber.replace(/\D/g, "");
        onChange({
          target: {
            value: country.code.replace("+", "") + cleaned
          }
        });
      }
    }
  };

  const handlePhoneChange = (event) => {
    const cleaned = event.target.value.replace(/\D/g, "");
    setPhoneNumber(event.target.value);
    if (onChange) {
      onChange({
        target: {
          value: selectedCountry.code.replace("+", "") + cleaned
        }
      });
    }
  };

  // Máscara baseada no país (Brasil por padrão)
  const getMask = () => {
    if (selectedCountry.code === "+55") {
      return "(99) 99999-9999";
    } else if (selectedCountry.code === "+1") {
      return "(999) 999-9999";
    } else if (selectedCountry.code === "+44") {
      return "9999 999999";
    } else if (selectedCountry.code === "+351") {
      return "999 999 999";
    } else if (selectedCountry.code === "+34") {
      return "999 99 99 99";
    }
    // Máscara genérica para outros países (aceita até 15 dígitos)
    return "999999999999999";
  };

  return (
    <Box display="flex" alignItems="flex-start" width="100%">
      <FormControl 
        variant="outlined" 
        style={{ minWidth: 140, marginRight: 8 }}
        disabled={disabled}
        error={error}
      >
        <Select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          renderValue={(value) => {
            const country = countries.find(c => c.code === value);
            return country ? `${country.flag} ${country.code}` : value;
          }}
        >
          {countries.map((country) => (
            <MenuItem key={country.code} value={country.code}>
              <Box display="flex" alignItems="center">
                <span style={{ marginRight: 8, fontSize: 20 }}>{country.flag}</span>
                <Typography>{country.name} ({country.code})</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box flex={1}>
        <InputMask
          mask={getMask()}
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
        >
          {(inputProps) => (
            <TextField
              {...inputProps}
              variant="outlined"
              fullWidth
              error={error}
              helperText={helperText}
              placeholder="Número de telefone"
            />
          )}
        </InputMask>
      </Box>
    </Box>
  );
};

export default CountryCodeSelector;
