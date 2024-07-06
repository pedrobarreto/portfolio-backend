import { translate } from '@vitalets/google-translate-api';

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const { text: translatedText } = await translate(text, { to: targetLanguage });
  return translatedText;
};


