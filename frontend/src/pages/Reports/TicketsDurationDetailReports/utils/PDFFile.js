import React from 'react';

import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

import logo from '../../../../assets/topzap-pdf.png';
import { useSystem } from '../../../../hooks/useSystem';

const classes = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    background: '#ebf0f0',
  },

  page: {
    fontFamily: 'Helvetica',
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
});

const ExportReport = ({ tickets, name }) => {
  const { system } = useSystem();

  return (
    <Document>
      <Page style={classes.page} size="A4">
        <View>
          <Image style={classes.image} src={logo} />
        </View>

        <View style={classes.titleContainer}>
          <Text style={classes.title}>Relação de Atendimentos Realizados - {name} </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          marginTop: 30,
          fontSize: 7,
          backgroundColor: system && system.color ? system.color : '#008080',
          color: 'ffffff',
          alignItems: 'center',
          padding: 5,
        }}>
          <Text style={{ width: '20%', ...classes.headerText }}>Início do atendimento</Text>
          <Text style={{ width: '20%', ...classes.headerText }}>Última atualização</Text>
          <Text style={{ width: '15%', ...classes.headerText }}>Status</Text>
          <Text style={{ width: '25%', ...classes.headerText }}>
            Último atendente
          </Text>
          <Text style={{ width: '20%', ...classes.headerText }}>
            Duração após finalizado
          </Text>
        </View>

        <View style={classes.body}>
          {tickets.map((ticket) => (
            <View key={ticket.id} style={classes.row}>
              <Text style={{ width: '20%', textAlign: 'center' }}>
                {ticket.dateInit}
              </Text>
              <Text style={{ width: '20%', textAlign: 'center' }}>
                {ticket.dateEnd}
              </Text>
              <Text style={{ width: '15%', textAlign: 'center' }}>
                {ticket.status}
              </Text>
              <Text style={{ width: '25%', textAlign: 'center' }}>
                {ticket.attendant}
              </Text>
              <Text style={{ width: '25%', textAlign: 'center' }}>
                {ticket.duration}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ExportReport;
