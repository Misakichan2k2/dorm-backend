import PDFDocument from "pdfkit";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsPath = path.join(__dirname, "../fonts");

export const generateRenewalPDF = async (renewal) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.registerFont("Regular", path.join(fontsPath, "Roboto-Regular.ttf"));
      doc.registerFont("Bold", path.join(fontsPath, "Roboto-Bold.ttf"));
      doc.registerFont("Italic", path.join(fontsPath, "Roboto-Italic.ttf"));

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const info = renewal;

      // === TITLE ===
      doc
        .font("Bold")
        .fontSize(16)
        .fillColor("#000000")
        .text(`HÓA ĐƠN GIA HẠN PHÒNG THÁNG ${info.month}/${info.year}`, {
          align: "center",
        })
        .moveDown(1.5);

      // === THÔNG TIN SINH VIÊN ===
      doc
        .font("Bold")
        .fontSize(13)
        .text("Thông tin sinh viên", { align: "left" })
        .moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#add8e6");

      doc.font("Regular").fontSize(11).moveDown(0.7);
      doc
        .text(`Họ tên: ${info.fullname}`, { continued: true })
        .text(`\nMSSV: ${info.studentId}`);
      doc
        .text(`Trường: ${info.school}`, { continued: true })
        .text(`\nLớp: ${info.class}`);
      doc.text(`SĐT: ${info.phone}`);
      doc.moveDown(1.5);

      // === THÔNG TIN GIA HẠN ===
      doc
        .font("Bold")
        .fontSize(13)
        .text("Thông tin gia hạn", { align: "left" })
        .moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#add8e6");

      doc.font("Regular").fontSize(11).moveDown(0.7);
      doc
        .text(`Mã gia hạn: ${info.renewalRequestId}`, { continued: true })
        .text(`\nTrạng thái: Đã thanh toán`);
      doc.text(
        `Ngày xác nhận: ${moment(info.updatedAt).format("DD/MM/YYYY HH:mm:ss")}`
      );
      doc.moveDown(1.5);

      // === THÔNG TIN PHÒNG ===
      const tableTop = doc.y;
      const columnSpacing = 125;

      doc.font("Bold");
      doc.text("Khu nhà", 50, tableTop);
      doc.text("Phòng", 50 + columnSpacing, tableTop);
      doc.text("Giới tính", 50 + columnSpacing * 2, tableTop);
      doc.text("Giá phòng", 50 + columnSpacing * 3, tableTop);

      doc
        .moveTo(50, tableTop + 18)
        .lineTo(550, tableTop + 18)
        .stroke();

      doc.font("Regular").fontSize(11);
      doc.text(renewal.room.building.name, 50, tableTop + 25);
      doc.text(renewal.room.room, 50 + columnSpacing, tableTop + 25);
      doc.text(renewal.room.gender, 50 + columnSpacing * 2, tableTop + 25);
      doc.text(
        renewal.room.price.toLocaleString() + " VND",
        50 + columnSpacing * 3,
        tableTop + 25
      );

      doc.moveDown(3);

      // === TỔNG TIỀN ===
      doc
        .font("Bold")
        .fontSize(12)
        .fillColor("#000000")
        .text(`Tổng tiền: ${renewal.room.price.toLocaleString()} VND`, {
          align: "right",
        });

      doc.moveDown(3);

      // === CẢM ƠN VÀ THÔNG TIN LIÊN HỆ ===
      const thankYouMessage =
        "Cảm ơn bạn đã gia hạn. Vui lòng chờ ban quản lý xử lý và theo dõi trạng thái duyệt trên hệ thống hoặc email.";
      const contactTitle = "Thông tin liên hệ";
      const contactInfo =
        "\nPhòng Quản lý Ký túc xá   |   SĐT: 0123 456 789   |   Email: ky­tucxa@example.com";

      const pageWidth = doc.page.width;
      const textWidth = doc.widthOfString(thankYouMessage);
      const contactWidth = doc.widthOfString(contactInfo);
      const contactTitleWidth = doc.widthOfString(contactTitle);

      const centerX = (pageWidth - textWidth) / 2;
      const centerContactX = (pageWidth - contactWidth) / 2;
      const centerTitleX = (pageWidth - contactTitleWidth) / 2;

      doc
        .font("Italic")
        .fontSize(10)
        .fillColor("#4B5563")
        .text(thankYouMessage, centerX, doc.y)
        .moveDown(1);

      doc
        .font("Bold")
        .fontSize(11)
        .fillColor("#000000")
        .text(contactTitle, centerTitleX, doc.y);

      doc
        .font("Regular")
        .fontSize(10)
        .fillColor("#444444")
        .text(contactInfo, centerContactX, doc.y);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
