import axios from "axios";

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export const getErrorMessage = (error) => {
  if (!error.response) return 'Network error - check connectivity';
  
  if (error.response.status === 400) return error.response.data.message;
  if (error.response.status === 401) return 'You do not have permission to access this page';
  if (error.response.status === 403) return 'Session expired';
  if (error.response.status === 404) return 'Page Not Found';
  if (error.response.status === 500) return 'Server error';
  
  return 'Unknown error occurred';
};

export const convertStrToCamelCase = (str) => {
  const tokens = str.split(`_`);
  return tokens.map(t => convertWordToCamelCase(t)).join(` `);
}

export const convertWordToCamelCase = (word) => {
  if (word.length <= 2) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export const convertDateArrayToDate = (dateArray) => {
  return new Date(dateArray[0], dateArray[1],  dateArray[2]);
}

