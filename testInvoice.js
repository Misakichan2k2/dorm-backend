import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import ElectricInvoice from "./models/ElectricInvoice.js"; // chỉnh đúng path model của bạn

async function testFindInvoice() {
  try {
    // Kết nối MongoDB (thay YOUR_MONGO_URI thành URI của bạn)
    await mongoose.connect(process.env.MONGO_URI);

    const invoice = await ElectricInvoice.findById("6828a5fac627faa75ff939de");
    console.log(invoice);

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

testFindInvoice();
