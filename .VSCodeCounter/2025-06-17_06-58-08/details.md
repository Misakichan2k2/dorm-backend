# Details

Date : 2025-06-17 06:58:08

Directory e:\\Manhay\\Lessons\\Kỳ 2024.2\\Đồ án tốt nghiệp\\Project\\Github\\dorm-backend

Total : 51 files,  6155 codes, 191 comments, 754 blanks, all 7100 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [README.md](/README.md) | Markdown | 1 | 0 | 0 | 1 |
| [app.js](/app.js) | JavaScript | 54 | 1 | 12 | 67 |
| [config/cloudinary.js](/config/cloudinary.js) | JavaScript | 9 | 0 | 3 | 12 |
| [config/db.js](/config/db.js) | JavaScript | 13 | 0 | 4 | 17 |
| [config/vnpay.js](/config/vnpay.js) | JavaScript | 19 | 1 | 8 | 28 |
| [controllers/authController.js](/controllers/authController.js) | JavaScript | 121 | 15 | 29 | 165 |
| [controllers/buildingController.js](/controllers/buildingController.js) | JavaScript | 121 | 3 | 19 | 143 |
| [controllers/electricInvoiceController.js](/controllers/electricInvoiceController.js) | JavaScript | 138 | 8 | 25 | 171 |
| [controllers/feedbackController.js](/controllers/feedbackController.js) | JavaScript | 123 | 1 | 17 | 141 |
| [controllers/paymentController.js](/controllers/paymentController.js) | JavaScript | 462 | 7 | 99 | 568 |
| [controllers/registrationController.js](/controllers/registrationController.js) | JavaScript | 512 | 29 | 87 | 628 |
| [controllers/renewalRequestController.js](/controllers/renewalRequestController.js) | JavaScript | 360 | 17 | 55 | 432 |
| [controllers/reportController.js](/controllers/reportController.js) | JavaScript | 252 | 17 | 41 | 310 |
| [controllers/roomController.js](/controllers/roomController.js) | JavaScript | 170 | 10 | 36 | 216 |
| [controllers/studentController.js](/controllers/studentController.js) | JavaScript | 346 | 22 | 66 | 434 |
| [controllers/userController.js](/controllers/userController.js) | JavaScript | 100 | 6 | 25 | 131 |
| [controllers/waterInvoiceController.js](/controllers/waterInvoiceController.js) | JavaScript | 114 | 8 | 19 | 141 |
| [middlewares/invoiceMailer.js](/middlewares/invoiceMailer.js) | JavaScript | 283 | 13 | 41 | 337 |
| [middlewares/uploadImage.js](/middlewares/uploadImage.js) | JavaScript | 18 | 1 | 4 | 23 |
| [middlewares/verifyUser.js](/middlewares/verifyUser.js) | JavaScript | 14 | 1 | 4 | 19 |
| [models/Admin.js](/models/Admin.js) | JavaScript | 13 | 0 | 3 | 16 |
| [models/Building.js](/models/Building.js) | JavaScript | 17 | 0 | 3 | 20 |
| [models/ElectricInvoice.js](/models/ElectricInvoice.js) | JavaScript | 25 | 1 | 3 | 29 |
| [models/Feedback.js](/models/Feedback.js) | JavaScript | 31 | 0 | 3 | 34 |
| [models/Registration.js](/models/Registration.js) | JavaScript | 60 | 0 | 5 | 65 |
| [models/RenewalRequest.js](/models/RenewalRequest.js) | JavaScript | 30 | 0 | 3 | 33 |
| [models/Report.js](/models/Report.js) | JavaScript | 47 | 0 | 4 | 51 |
| [models/Room.js](/models/Room.js) | JavaScript | 22 | 0 | 4 | 26 |
| [models/Student.js](/models/Student.js) | JavaScript | 17 | 0 | 3 | 20 |
| [models/User.js](/models/User.js) | JavaScript | 41 | 0 | 4 | 45 |
| [models/WaterInvoice.js](/models/WaterInvoice.js) | JavaScript | 25 | 1 | 3 | 29 |
| [package-lock.json](/package-lock.json) | JSON | 2,022 | 0 | 1 | 2,023 |
| [package.json](/package.json) | JSON | 36 | 0 | 1 | 37 |
| [routes/auth.routes.js](/routes/auth.routes.js) | JavaScript | 18 | 2 | 4 | 24 |
| [routes/building.routes.js](/routes/building.routes.js) | JavaScript | 15 | 0 | 4 | 19 |
| [routes/electricInvoice.routes.js](/routes/electricInvoice.routes.js) | JavaScript | 20 | 0 | 4 | 24 |
| [routes/feedback.routes.js](/routes/feedback.routes.js) | JavaScript | 14 | 0 | 4 | 18 |
| [routes/payment.routes.js](/routes/payment.routes.js) | JavaScript | 34 | 0 | 7 | 41 |
| [routes/registration.routes.js](/routes/registration.routes.js) | JavaScript | 35 | 2 | 5 | 42 |
| [routes/renewal.routes.js](/routes/renewal.routes.js) | JavaScript | 26 | 1 | 5 | 32 |
| [routes/report.routes.js](/routes/report.routes.js) | JavaScript | 25 | 2 | 5 | 32 |
| [routes/room.routes.js](/routes/room.routes.js) | JavaScript | 17 | 0 | 4 | 21 |
| [routes/student.routes.js](/routes/student.routes.js) | JavaScript | 24 | 2 | 5 | 31 |
| [routes/user.routes.js](/routes/user.routes.js) | JavaScript | 17 | 0 | 4 | 21 |
| [routes/waterInvoice.routes.js](/routes/waterInvoice.routes.js) | JavaScript | 18 | 0 | 4 | 22 |
| [testInvoice.js](/testInvoice.js) | JavaScript | 15 | 1 | 6 | 22 |
| [utils/errorHandler.js](/utils/errorHandler.js) | JavaScript | 6 | 0 | 1 | 7 |
| [utils/generateRegistrationCode.js](/utils/generateRegistrationCode.js) | JavaScript | 11 | 0 | 4 | 15 |
| [utils/generateRegistrationPDF.js](/utils/generateRegistrationPDF.js) | JavaScript | 111 | 13 | 26 | 150 |
| [utils/generateRenewalPDF.js](/utils/generateRenewalPDF.js) | JavaScript | 117 | 6 | 25 | 148 |
| [utils/registrationMailer.js](/utils/registrationMailer.js) | JavaScript | 16 | 0 | 3 | 19 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)