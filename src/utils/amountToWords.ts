export const amountToWords = (amount: number): string => {
  if (amount === 0) return "ZERO ONLY";

  const singleDigits = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const doubleDigits = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  const formatSegment = (num: number): string => {
    let str = "";
    if (num >= 100) {
      str += singleDigits[Math.floor(num / 100)] + " HUNDRED ";
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num >= 10) {
      str += doubleDigits[num - 10] + " ";
      num = 0;
    }
    if (num > 0) {
      str += singleDigits[num] + " ";
    }
    return str.trim();
  };

  const getWords = (num: number): string => {
    if (num === 0) return "";
    let words = "";

    // Crores
    if (num >= 10000000) {
      words += getWords(Math.floor(num / 10000000)) + " CRORE ";
      num %= 10000000;
    }

    // Lakhs
    if (num >= 100000) {
      words += formatSegment(Math.floor(num / 100000)) + " LAKH ";
      num %= 100000;
    }

    // Thousands
    if (num >= 1000) {
      words += formatSegment(Math.floor(num / 1000)) + " THOUSAND ";
      num %= 1000;
    }

    // Rest (< 1000)
    words += formatSegment(num);

    return words.trim();
  };

  const whole = Math.floor(amount);
  const words = getWords(whole);

  return (words + " ONLY").replace(/\s+/g, " ").toUpperCase();
};
