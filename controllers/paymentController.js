import vnpayConfig from "../config/vnpay.js";
import crypto from "crypto";
import moment from "moment";
import ElectricInvoice from "../models/ElectricInvoice.js";
import WaterInvoice from "../models/WaterInvoice.js";
import RegistrationModel from "../models/Registration.js";
import RenewalRequestModel from "../models/RenewalRequest.js";
import {
  sendElectricInvoiceEmail,
  sendWaterInvoiceEmail,
  sendRegistrationInvoiceEmail,
  sendRenewalInvoiceEmail,
} from "../middlewares/invoiceMailer.js";

export const createElectricInvoicePaymentUrl = async (req, res) => {
  try {
    console.log("🤖 USER TỪ TOKEN:", req.user);
    const { electricId } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    const invoice = await ElectricInvoice.findById(electricId)
      .populate({
        path: "room",
        populate: { path: "building", select: "name" },
      })
      .populate("payer");

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn điện." });
    }

    if (invoice.status === "Đã đóng") {
      return res.status(400).json({ message: "Hóa đơn đã được thanh toán." });
    }

    invoice.payer = req.user.id;
    await invoice.save();

    const totalAmount =
      (invoice.newIndex - invoice.oldIndex) * invoice.unitPrice;
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: invoice._id.toString(),
      vnp_OrderInfo: `electric-${invoice._id}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: totalAmount * 100,
      vnp_ReturnUrl: vnpayConfig.vnp_ElectricReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const redirectUrl = new URL(vnpayConfig.vnp_Url);

    Object.entries(vnp_Params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        redirectUrl.searchParams.append(key, value.toString());
      });

    const signData = redirectUrl.search.slice(1);
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    res.json({ paymentUrl: redirectUrl.toString() });
  } catch (err) {
    console.error("VNPAY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Xử lý callback khi thanh toán xong
export const vnpayElectricReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = new URLSearchParams(sortedParams).toString();

    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.invoice}?success=false`
      );
    }

    const invoiceId = vnp_Params["vnp_TxnRef"];
    const invoice = await ElectricInvoice.findById(invoiceId)
      .populate("room")
      .populate("payer");

    if (!invoice) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.invoice}?success=false`
      );
    }

    if (invoice.status === "Đã đóng") {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.invoice}?success=true"`
      );
    }

    invoice.status = "Đã đóng";
    await invoice.save();

    const registration = await RegistrationModel.findOne({
      user: invoice.payer._id,
    });

    if (!registration || !registration.email) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.invoice}?success=false`
      );
    }

    await sendElectricInvoiceEmail(invoice._id, registration._id);

    return res.redirect(
      `${vnpayConfig.paymentResultUrls.invoice}?success=true"`
    );
  } catch (error) {
    console.error("Lỗi xử lý vnpayReturn:", error);
    return res.redirect(
      `${vnpayConfig.paymentResultUrls.invoice}?success=false`
    );
  }
};

// Tạo URL thanh toán cho hóa đơn nước
export const createWaterInvoicePaymentUrl = async (req, res) => {
  try {
    const { waterId } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    const invoice = await WaterInvoice.findById(waterId)
      .populate({
        path: "room",
        populate: { path: "building", select: "name" },
      })
      .populate("payer");

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn nước." });
    }

    if (invoice.status === "Đã đóng") {
      return res.status(400).json({ message: "Hóa đơn đã được thanh toán." });
    }

    invoice.payer = req.user.id;
    await invoice.save();

    const totalAmount =
      (invoice.newIndex - invoice.oldIndex) * invoice.unitPrice;
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: invoice._id.toString(),
      vnp_OrderInfo: `water-${invoice._id}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: totalAmount * 100,
      vnp_ReturnUrl: vnpayConfig.vnp_WaterReturnUrl, // Bạn có thể config riêng nếu cần
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const redirectUrl = new URL(vnpayConfig.vnp_Url);

    Object.entries(vnp_Params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        redirectUrl.searchParams.append(key, value.toString());
      });

    const signData = redirectUrl.search.slice(1);
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    res.json({ paymentUrl: redirectUrl.toString() });
  } catch (err) {
    console.error("VNPAY WATER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Xử lý callback sau khi thanh toán hóa đơn nước thành công
export const vnpayWaterReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
      return res.status(400).json({ message: "Chữ ký không hợp lệ." });
    }

    const invoiceId = vnp_Params["vnp_TxnRef"];

    const invoice = await WaterInvoice.findById(invoiceId)
      .populate("room")
      .populate("payer");

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn nước." });
    }

    if (invoice.status === "Đã đóng") {
      return res.json({ message: "Hóa đơn đã thanh toán trước đó." });
    }

    invoice.status = "Đã đóng";
    await invoice.save();

    const registration = await RegistrationModel.findOne({
      user: invoice.payer._id,
    });

    if (!registration || !registration.email) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy email trong đơn đăng ký." });
    }

    await sendWaterInvoiceEmail(invoice._id, registration._id);

    res.redirect(`${vnpayConfig.paymentResultUrls.invoice}?success=true`);
  } catch (error) {
    console.error("Lỗi xử lý vnpayWaterReturn:", error);
    res.redirect(`${vnpayConfig.paymentResultUrls.invoice}?success=false`);
  }
};

// Registration
export const createRegistrationPaymentUrl = async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    const registration = await RegistrationModel.findById(
      registrationId
    ).populate("room");

    if (!registration || !registration.room || !registration.room.price) {
      return res.status(400).json({
        message: "Không tìm thấy đơn đăng ký hoặc thông tin phòng không hợp lệ",
      });
    }

    if (registration.status === "Đã thanh toán") {
      return res
        .status(400)
        .json({ message: "Đơn đăng ký đã được thanh toán." });
    }

    registration.user = req.user.id;
    await registration.save();

    const totalAmount = registration.room.price;
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: registration._id.toString(),
      vnp_OrderInfo: `registration-${registration._id}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: totalAmount * 100,
      vnp_ReturnUrl: vnpayConfig.vnp_RegistrationReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const redirectUrl = new URL(vnpayConfig.vnp_Url);

    Object.entries(vnp_Params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        redirectUrl.searchParams.append(key, value.toString());
      });

    const signData = redirectUrl.search.slice(1);
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    res.json({ paymentUrl: redirectUrl.toString() });
  } catch (err) {
    console.error("VNPAY REGISTRATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const vnpayRegistrationReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=invalid-signature`
      );
    }

    const registrationId = vnp_Params["vnp_TxnRef"];
    const registration = await RegistrationModel.findById(
      registrationId
    ).populate("user");

    if (!registration) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=not-found`
      );
    }

    if (registration.status === "pending") {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=true&message=already-paid`
      );
    }

    try {
      registration.status = "pending";
      registration.registerFormDetail =
        "Đơn đăng ký phòng của bạn đang chờ được xét duyệt. Vui lòng đợi hoặc liên hệ ban quản lý để biết thêm chi tiết.";
      await registration.save();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=update-failed`
      );
    }

    // Gửi email
    if (registration.user && registration.user.email) {
      await sendRegistrationInvoiceEmail(registration._id);
    }

    return res.redirect(
      `${vnpayConfig.paymentResultUrls.request}?success=true`
    );
  } catch (error) {
    console.error("Lỗi xử lý vnpayRegistrationReturn:", error);
    return res.redirect(
      `${vnpayConfig.paymentResultUrls.request}?success=false&reason=server-error`
    );
  }
};

// Renewal
export const createRenewalPaymentUrl = async (req, res) => {
  try {
    const { renewalRequestId } = req.body;

    const request = await RenewalRequestModel.findById(
      renewalRequestId
    ).populate({
      path: "student",
      populate: {
        path: "registration",
        populate: {
          path: "room",
          select: "price", // nếu chỉ cần `price`
        },
      },
    });

    if (
      !request ||
      !request.student ||
      !request.student.registration ||
      !request.student.registration.room
    ) {
      return res.status(400).json({
        message: "Không tìm thấy yêu cầu gia hạn hoặc thông tin không hợp lệ.",
      });
    }

    const totalAmount = request.student.registration.room.price;
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: request._id.toString(),
      vnp_OrderInfo: `renewal-${request._id}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: totalAmount * 100,
      vnp_ReturnUrl: vnpayConfig.vnp_RenewalReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const redirectUrl = new URL(vnpayConfig.vnp_Url);
    Object.entries(vnp_Params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          redirectUrl.searchParams.append(key, value.toString());
        }
      });

    const signData = redirectUrl.search.slice(1);
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    res.json({ paymentUrl: redirectUrl.toString() });
  } catch (err) {
    console.error("VNPAY RENEWAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const vnpayRenewalReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=invalid-signature`
      );
    }

    const renewalRequestId = vnp_Params["vnp_TxnRef"];
    const request = await RenewalRequestModel.findById(
      renewalRequestId
    ).populate({
      path: "student",
      populate: {
        path: "user",
      },
    });

    if (!request) {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=not-found`
      );
    }

    if (request.status === "pending") {
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=true&message=already-paid`
      );
    }

    try {
      request.status = "pending";
      await request.save();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái yêu cầu gia hạn:", err);
      return res.redirect(
        `${vnpayConfig.paymentResultUrls.request}?success=false&reason=update-failed`
      );
    }

    // Gửi email
    if (request.student.user?.email) {
      await sendRenewalInvoiceEmail(request._id);
    }

    return res.redirect(
      `${vnpayConfig.paymentResultUrls.request}?success=true`
    );
  } catch (error) {
    console.error("VNPAY RENEWAL RETURN ERROR:", error);
    return res.redirect(
      `${vnpayConfig.paymentResultUrls.request}?success=false&reason=server-error`
    );
  }
};
