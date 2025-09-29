import React from 'react';

import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

import logo from '../../../../../assets/topzap-pdf.png';
import PdfTable from './components/PdfTable';
import sourceBold from './components/Roboto/Roboto-Bold.ttf';
import sourceItalic from './components/Roboto/Roboto-Italic.ttf';
import source from './components/Roboto/Roboto-Regular.ttf';

Font.registerEmojiSource({
  format: 'png',
  url: 'https://twemoji.maxcdn.com/2/72x72/',
});

Font.register({
  family: 'Roboto',
  fonts: [
    { src: source },
    {
      src: sourceItalic,
      fontStyle: 'italic',
    },
    {
      src: sourceBold,
      fontWeight: 'bold',
    },
  ],
});

const classes = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    background: '#ebf0f0',
  },

  page: {
    fontFamily: 'Roboto',
    alignItems: 'center',
    paddingBottom: 36,
    paddingTop: 36,
    paddingLeft: 24,
    paddingRight: 24,
  },

  image: {
    width: 80,
    height: 80,
  },

  titleContainer: {
    marginTop: 36,
    justifyContent: 'center',
  },

  title: {
    fontSize: 16,
  },

  headerText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },

  body: {
    flexDirection: 'collumn',
  },

  row: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    fontSize: 7,
    borderBottom: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#cceded',
    alignItems: 'center',
    padding: 5,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  userContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginRight: 350,
    marginTop: 60,
    width: 200,
  },

  userTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    display: 'flex',
  },

  userName: {
    fontSize: 10,
    fontWeight: 'normal',
    marginLeft: 5,
  },
});

const ResearchReportPdf = ({ researchs, user, dateIni, dateFin }) => {
  return (
    <Document>
      <Page style={classes.page} size="A4">
        <View>
          <Image style={classes.image} src={logo} />
        </View>

        <View style={classes.titleContainer}>
          <Text style={classes.title}>Relatório de Pesquisas Realizadas</Text>
        </View>
        <View style={classes.userContainer}>
          {user && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <Text style={classes.userTitle}>
                Operador: <Text style={classes.userName}>{user.name}</Text>
              </Text>
            </View>
          )}

          {(dateIni || dateFin) && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <Text style={classes.userTitle}>
                Período:
                <Text style={classes.userName}>
                  {' '}
                  {dateIni} até {dateFin}
                </Text>
              </Text>
            </View>
          )}
        </View>
        {researchs.map((research, index) => (
          <PdfTable key={index} research={research} />
        ))}
      </Page>
    </Document>
  );
};

export default ResearchReportPdf;
