/* eslint-disable no-console */
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

export default function formatToHtmlFormat(editorState) {
  try {
    if (!editorState) {
      return;
    }
    const htmlText = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    return htmlText;
  } catch (error) {
    console.log(error);
  }
}
