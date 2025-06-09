import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Registration from "../models/Registration.js";
import ElectricInvoice from "../models/ElectricInvoice.js";
import WaterInvoice from "../models/WaterInvoice.js";
import RenewalRequest from "../models/RenewalRequest.js";
import { generateRegistrationPDF } from "../utils/generateRegistrationPDF.js";
import { generateRenewalPDF } from "../utils/generateRenewalPDF.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Format tiền tệ VND
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Gửi hóa đơn điện
export const sendElectricInvoiceEmail = async (invoiceId, registrationId) => {
  const invoice = await ElectricInvoice.findById(invoiceId).populate({
    path: "room",
    populate: { path: "building", select: "name" },
  });

  const registration = await Registration.findById(registrationId);
  if (!registration) throw new Error("Không tìm thấy thông tin đăng ký");

  const emailToSend = registration.email;
  const totalAmount = (invoice.newIndex - invoice.oldIndex) * invoice.unitPrice;

  return generateAndSendPDF({
    registration,
    invoice,
    emailToSend,
    totalAmount,
    type: "electric",
  });
};

// Gửi hóa đơn nước
export const sendWaterInvoiceEmail = async (invoiceId, registrationId) => {
  const invoice = await WaterInvoice.findById(invoiceId).populate({
    path: "room",
    populate: { path: "building", select: "name" },
  });

  const registration = await Registration.findById(registrationId);
  if (!registration) throw new Error("Không tìm thấy thông tin đăng ký");

  const emailToSend = registration.email;
  const totalAmount = (invoice.newIndex - invoice.oldIndex) * invoice.unitPrice;

  return generateAndSendPDF({
    registration,
    invoice,
    emailToSend,
    totalAmount,
    type: "water",
  });
};

// Hàm dùng chung để tạo và gửi PDF
const generateAndSendPDF = ({
  registration,
  invoice,
  emailToSend,
  totalAmount,
  type,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: emailToSend,
          subject: `Hóa đơn tiền ${
            type === "electric" ? "điện" : "nước"
          } Ký túc xá`,
          text: `Xin chào ${registration.fullname},

Bạn đã thanh toán thành công hóa đơn ${
            type === "electric" ? "tiền điện" : "tiền nước"
          } tháng ${invoice.month}/${invoice.year}. 
Vui lòng xem file đính kèm để biết chi tiết hóa đơn.

Ban quản lý Ký túc xá - Đại học
Địa chỉ: Nhà A1 - Phòng 701
Address: A1 - Room 701
Điện thoại: 0987654321`,
          attachments: [
            {
              filename: `HoaDon${type === "electric" ? "Dien" : "Nuoc"}_${
                invoice.month
              }_${invoice.year}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        resolve();
      } catch (err) {
        reject(err);
      }
    });

    const robotoRegular = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    const robotoBold = path.join(__dirname, "../fonts/Roboto-Bold.ttf");
    doc.registerFont("Roboto", robotoRegular);
    doc.registerFont("Roboto-Bold", robotoBold);

    // ==== HEADER ====
    doc
      .font("Roboto-Bold")
      .fontSize(20)
      .text("KÝ TÚC XÁ DORMIFY", { align: "center" });
    doc.moveDown(0.5);

    const titleMonth = String(invoice.month).padStart(2, "0");
    doc
      .font("Roboto")
      .fontSize(14)
      .text(
        `HÓA ĐƠN TIỀN ${
          type === "electric" ? "ĐIỆN" : "NƯỚC"
        } THÁNG ${titleMonth}/${invoice.year}`,
        { align: "center" }
      );

    doc.moveDown(1);

    // ==== THÔNG TIN PHÒNG ====
    doc.fontSize(12);
    doc.text(
      `Mã hóa đơn: ${
        type === "electric" ? invoice.electricId : invoice.waterId
      }`
    );
    doc.text(`Người thanh toán: ${registration.fullname}`);
    doc.text(`Khu: ${invoice.room.building.name}`);
    doc.text(`Phòng: ${invoice.room.room}`);
    doc.text(
      `Hạn đóng: ${new Date(invoice.dueDate).toLocaleDateString("vi-VN")}`
    );
    doc.text(`Trạng thái: ${invoice.status}`);
    doc.moveDown(1);

    // ==== BẢNG CHỈ SỐ ====
    const tableTop = doc.y;
    const columnSpacing = 100;
    const consumption = invoice.newIndex - invoice.oldIndex;

    doc.font("Roboto-Bold");
    doc.text("Chỉ số cũ", 50, tableTop);
    doc.text("Chỉ số mới", 50 + columnSpacing, tableTop);
    doc.text("Tổng tiêu thụ", 50 + columnSpacing * 2, tableTop);
    doc.text("Đơn giá (VND)", 50 + columnSpacing * 3, tableTop);
    doc.text("Thành tiền", 50 + columnSpacing * 4, tableTop);

    doc
      .moveTo(50, tableTop + 18)
      .lineTo(50 + columnSpacing * 5, tableTop + 18)
      .stroke();

    doc.font("Roboto");
    doc.text(invoice.oldIndex.toString(), 50, tableTop + 25);
    doc.text(invoice.newIndex.toString(), 50 + columnSpacing, tableTop + 25);
    doc.text(consumption.toString(), 50 + columnSpacing * 2, tableTop + 25);
    doc.text(
      formatCurrency(invoice.unitPrice),
      50 + columnSpacing * 3,
      tableTop + 25
    );
    doc.text(
      formatCurrency(totalAmount),
      50 + columnSpacing * 4,
      tableTop + 25
    );

    doc.moveDown(4);

    // ==== TỔNG TIỀN ====
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Tổng cộng: ${formatCurrency(totalAmount)}`, {
        align: "right",
      });

    doc.moveDown(3);

    // ==== FOOTER ====
    doc
      .font("Roboto")
      .fontSize(10)
      .text("Liên hệ: Phòng Quản lý Ký túc xá", { align: "start" })
      .text("ĐT: 0123456789", { align: "start" })
      .text("Email: ktux@example.com", { align: "start" });

    const printTime = new Date().toLocaleString("vi-VN");
    doc.text(`\nNgày in hóa đơn:\n${printTime}`, { align: "center" });

    doc.end();
  });
};

// Registration
export const sendRegistrationInvoiceEmail = async (registrationId) => {
  const registration = await Registration.findById(registrationId)
    .populate("user", "fullName email")
    .populate({
      path: "room",
      populate: { path: "building", select: "name" },
    });

  if (!registration) throw new Error("Không tìm thấy đơn đăng ký.");

  // Gọi generateRegistrationPDF và nhận buffer
  const pdfBuffer = await generateRegistrationPDF({
    fullname: registration.fullname,
    email: registration.email,
    studentId: registration.studentId,
    school: registration.school,
    class: registration.class,
    phone: registration.phone,
    registrationCode: registration.registrationCode,
    updatedAt: registration.updatedAt,
    room: registration.room,
  });

  // Gửi mail
  await transporter.sendMail({
    from: `"Ký túc xá" <${process.env.EMAIL_USER}>`,
    to: registration.email,
    subject: `Xác nhận đăng ký phòng (${registration.room.room})`,
    text: `Xin chào ${registration.fullname},

Bạn đã thanh toán thành công đơn đăng ký phòng ${registration.room.room}, thuộc Khu ${registration.room.building.name}.

Vui lòng kiểm tra hóa đơn đính kèm để biết thông tin chi tiết.

Xin vui lòng chờ Ban quản lý xử lý đơn và theo dõi trạng thái duyệt trên hệ thống hoặc qua email.

Ban quản lý Ký túc xá - Đại học
Địa chỉ: Nhà A1 - Phòng 701
Address: A1 - Room 701
Điện thoại: 0987654321`,
    attachments: [
      {
        filename: `registration_invoice_${registration._id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

// Renewal Request
export const sendRenewalInvoiceEmail = async (renewalId) => {
  const renewal = await RenewalRequest.findById(renewalId).populate({
    path: "student",
    populate: {
      path: "registration",
      select: "fullname email studentId school class phone room",
      populate: {
        path: "room",
        populate: {
          path: "building",
          select: "name",
        },
      },
    },
  });

  if (!renewal) throw new Error("Không tìm thấy đơn gia hạn.");

  const registration = renewal.student.registration;
  const room = registration.room;

  const pdfBuffer = await generateRenewalPDF({
    fullname: registration.fullname,
    email: registration.email,
    studentId: registration.studentId,
    school: registration.school,
    class: registration.class,
    phone: registration.phone,
    renewalRequestId: renewal.renewalRequestId,
    month: renewal.month,
    year: renewal.year,
    updatedAt: renewal.updatedAt,
    room,
  });

  await transporter.sendMail({
    from: `"Ký túc xá" <${process.env.EMAIL_USER}>`,
    to: registration.email,
    subject: `Xác nhận gia hạn phòng (${room.room})`,
    text: `Xin chào ${registration.fullname},

Bạn đã thanh toán thành công yêu cầu gia hạn phòng ${room.room}, thuộc Khu ${room.building.name} cho tháng ${renewal.month}/${renewal.year}.

Vui lòng kiểm tra hóa đơn đính kèm để biết chi tiết thông tin gia hạn.

Xin vui lòng chờ Ban quản lý xử lý yêu cầu và theo dõi trạng thái duyệt trên hệ thống hoặc qua email.

Ban quản lý Ký túc xá - Đại học
Địa chỉ: Nhà A1 - Phòng 701
Address: A1 - Room 701
Điện thoại: 0987654321`,
    attachments: [
      {
        filename: `renewal_invoice_${renewal._id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};
