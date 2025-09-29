import React from 'react';

import { green, red } from '@material-ui/core/colors';
import { CheckCircle, Cancel } from '@material-ui/icons';

import formatHtmlToNormal from '../../../../../utils/formatHtmlToNormal';

export default function RenderLabel(label, active) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'left',
        flexDirection: 'row',
      }}
    >
      {active ? (
        <CheckCircle style={{ color: green[500] }} />
      ) : (
        <Cancel style={{ color: red[300] }} />
      )}
      <span style={{ marginLeft: 6 }}>{formatHtmlToNormal(label)}</span>
    </div>
  );
}
