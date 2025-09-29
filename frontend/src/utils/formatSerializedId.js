import { FormatMask } from './FormatMask';

const formatSerializedId = (serializedId) => {
  const formatMask = new FormatMask();
  const number = serializedId?.replace('@c.us', '');

  return formatMask.setPhoneFormatMask(number);
};

export default formatSerializedId;
