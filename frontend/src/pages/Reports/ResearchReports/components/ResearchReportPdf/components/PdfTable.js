import React from 'react';

import { View, Text, StyleSheet } from '@react-pdf/renderer';

import { useSystem } from '../../../../../../hooks/useSystem';

const classes = StyleSheet.create({
  mainView: {
    marginTop: 10,
  },

  secondHeader: {
    flexDirection: 'row',
    fontSize: 7,
    backgroundColor: '#ebe7e7',
    color: '#3c3939',
    padding: 5,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
  },

  headerText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },

  body: {
    flexDirection: 'column',
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
});

const PdfTable = ({ research }) => {
  const { system } = useSystem();

  return (
    <View style={classes.mainView}>
      <View style={{ 
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        fontSize: 7,
        backgroundColor: system && system.color ? system.color : '#008080',
        color: '#ffffff',
        padding: 5
      }}>
        <Text style={{ width: '80%', textAlign: 'center', fontWeight: 'bold' }}>
          Pergunta
        </Text>
        <Text style={{ width: '20%', textAlign: 'center', fontWeight: 'bold' }}>
          Resposta
        </Text>
      </View>
      <View style={classes.secondHeader}>
        {research.columns.map((column) => (
          <Text
            style={{
              width: column.width,
              textAlign: column.align,
              alignItems: 'center',
              fontWeight: 'bold',
              fontStyle: column.fontStyle,
            }}
            key={column.id}
          >
            {column.label}
          </Text>
        ))}
      </View>

      <View style={classes.body}>
        {research.respostas.map((answer) => (
          <View key={`${answer.id}` + Math.random()} style={classes.row}>
            <Text style={{ width: '80%', textAlign: 'left' }}>
              {answer.resposta}
            </Text>
            <Text style={{ width: '10%', textAlign: 'center' }}>
              {answer.total}
            </Text>
            <Text style={{ width: '10%', textAlign: 'center' }}>
              {answer.porcentagem}
            </Text>
          </View>
        ))}
        <View style={classes.row}>
          <Text style={{ width: '80%', textAlign: 'left' }}>Total</Text>
          <Text style={{ width: '10%', textAlign: 'center' }}>
            {research.total}
          </Text>
          <Text style={{ width: '10%', textAlign: 'center' }}>100%</Text>
        </View>
      </View>
    </View>
  );
};

export default PdfTable;
