import React from 'react';

import { TableFooter } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { StyledFooter, StyledTableContainer, StyledTableCell } from './styles';

export default function ResearchBox({ research }) {
  return (
    <StyledTableContainer>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <StyledTableCell
              variant="head"
              align="center"
              colSpan={1}
              padding="normal"
              color="primary"
            >
              Pergunta
            </StyledTableCell>
            <StyledTableCell
              variant="head"
              align="center"
              colSpan={3}
              padding="normal"
            >
              Resposta
            </StyledTableCell>
          </TableRow>
          <TableRow>
            {research.columns.map((column) => (
              <StyledTableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
                variant="head"
                secondcolumn="true"
              >
                {column.label}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {research.respostas.map((answer, index) => {
            return (
              <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                {research.columns.map((column, index) => {
                  const value = answer[column.id];

                  return (
                    <TableCell key={index} align={column.align}>
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <StyledFooter variant="footer">Total</StyledFooter>
            <StyledFooter align="center" variant="footer">
              {research.total}
            </StyledFooter>
            <StyledFooter align="center" variant="footer">
              100%
            </StyledFooter>
          </TableRow>
        </TableFooter>
      </Table>
    </StyledTableContainer>
  );
}
