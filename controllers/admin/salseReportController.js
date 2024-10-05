



const Order = require("../../models/orderSchema");

const mongoose = require("mongoose");


const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query = {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            };
          }




        const salesData = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalPrice' },  // Total sales amount
                    totalDiscount: { $sum: '$discount' }, // Total discount
                    totalOrders: { $sum: 1 },             // Total number of orders
                    couponUsage: { $push: '$couponCode' } // Track used coupon codes
                }
            }
        ]);

        const reportData = salesData.length > 0 ? salesData[0] : {
            totalSales: 0,
            totalOrders: 0,
            totalDiscount: 0,
          };
      

          res.render("sales-report", {
            reportData,
            startDate,
            endDate,
          });


    } catch (error) {
        console.error('Error generating sales report:', error);
         res.status(500).json({ error: "Server error generating sales report" });
    }
};




const generateExcelReport = async (req, res, salesData) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
        { header: 'Total Sales', key: 'totalSales', width: 15 },
        { header: 'Total Discount', key: 'totalDiscount', width: 15 },
        { header: 'Total Orders', key: 'totalOrders', width: 15 }
    ];

    sheet.addRow({
        totalSales: salesData.totalSales,
        totalDiscount: salesData.totalDiscount,
        totalOrders: salesData.totalOrders
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
};



const generatePdfReport = (req, res, salesData) => {
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.fontSize(12).text(`Total Sales: $${salesData.totalSales}`);
    doc.text(`Total Discount: $${salesData.totalDiscount}`);
    doc.text(`Total Orders: ${salesData.totalOrders}`);
    
    doc.end();
};




module.exports= {
    getSalesReport,
    generateExcelReport,
    generatePdfReport 
}