import Registration from "../models/Registration.js";

export const generateUniqueRegistrationCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    code = `RQ${randomNum}`;
    exists = await Registration.findOne({ registrationCode: code });
  }

  return code;
};
