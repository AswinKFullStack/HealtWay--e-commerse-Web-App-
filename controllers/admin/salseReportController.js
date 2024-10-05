



const Order = require("../../models/orderSchema");
const mongoose = require("mongoose");
const moment = require("moment");  // Import moment for date handling


const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'custom' ,page = 1} = req.query;
        const pageSize = 3;

        let start = null;
        let end = null;

        switch (reportType) {
            case 'daily':
                start = moment().startOf('day').toDate();
                end = moment().endOf('day').toDate();
                break;
            case 'weekly':
                start = moment().startOf('isoWeek').toDate();  
                end = moment().endOf('isoWeek').toDate();      
                break;
            case 'yearly':
                start = moment().startOf('year').toDate();     
                end = moment().endOf('year').toDate();         
                break;
            case 'custom':
                if (startDate && endDate) {
                    start = new Date(startDate);
                    end = new Date(endDate);
                        
                        // If startDate and endDate are the same, adjust the end date to include the entire day
                    if (startDate === endDate) {
                            end.setHours(23, 59, 59, 999);  // End of the day
                        }
                    }
                break;
        }

        let query = {};

        if (start && end) {
            query = {
                createdAt: {
                    $gte: start,
                    $lte: end,
                },
            };
        }

        const orders = await Order.find(query)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('productId');

        const totalOrdersCount = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrdersCount / pageSize);

        const salesData = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$finalTotalPriceWithAllDiscount' },  
                    totalDiscount: { $sum: '$discount' },
                    totalOrders: { $sum: 1 },             
                    totalCouponDeduction: { $sum: '$couponDiscount' } 
                }
            }
        ]);

        const reportData = salesData.length > 0 ? salesData[0] : {
            totalSales: 0,
            totalOrders: 0,
            totalDiscount: 0,
            totalCouponDeduction: 0,
        };

        if (req.xhr) {
            return res.json({ orders, totalPages, currentPage: page });
        }

        res.render("sales-report", {
            reportData,
            orders,
            totalPages,
            currentPage: parseInt(page),
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