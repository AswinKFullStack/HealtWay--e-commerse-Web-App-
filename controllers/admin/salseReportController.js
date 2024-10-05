



const Order = require("../../models/orderSchema");
const mongoose = require("mongoose");
const moment = require("moment");  // Import moment for date handling


const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'custom' } = req.query;

        // Initialize date range variables
        let start = null;
        let end = null;

        // Determine date ranges based on report type
        switch (reportType) {
            case 'daily':
                start = moment().startOf('day').toDate();
                end = moment().endOf('day').toDate();
                break;
            case 'weekly':
                start = moment().startOf('isoWeek').toDate();  // Start of current ISO week
                end = moment().endOf('isoWeek').toDate();      // End of current ISO week
                break;
            case 'yearly':
                start = moment().startOf('year').toDate();     // Start of the current year
                end = moment().endOf('year').toDate();         // End of the current year
                break;
            case 'custom':
                // Use the dates provided in the request
                start = startDate ? new Date(startDate) : null;
                end = endDate ? new Date(endDate) : null;
                break;
        }

        // Build query for MongoDB based on the selected date range
        let query = {};
        if (start && end) {
            query = {
                createdAt: {
                    $gte: start,
                    $lte: end,
                },
            };
        }

        // Aggregation to compute sales report
        const salesData = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$finalTotalPriceWithAllDiscount' },  // Total sales amount
                    totalDiscount: { $sum: '$discount' }, // Total discount
                    totalOrders: { $sum: 1 },             // Total number of orders
                    totalCouponDeduction: { $sum: '$couponDiscount' } // Track used coupon codes
                }
            }
        ]);

        // Default report data if no sales are found
        const reportData = salesData.length > 0 ? salesData[0] : {
            totalSales: 0,
            totalOrders: 0,
            totalDiscount: 0,
            totalCouponDeduction: 0,
        };

        // Render the report page with the required data
        res.render("sales-report", {
            reportData,
            startDate: start ? moment(start).format('YYYY-MM-DD') : '',
            endDate: end ? moment(end).format('YYYY-MM-DD') : '',
            reportType
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