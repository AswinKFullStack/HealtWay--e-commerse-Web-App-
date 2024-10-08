
const Order = require("../../models/orderSchema");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');


const getSalesReport = async (req, res) => {
    try{
    const { startDate, endDate, reportType = 'custom', page = 1 ,format} = req.query;
    const pageSize = 5;

    let start = null, end = null;

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
          if (startDate === endDate) end.setHours(23, 59, 59, 999);
        }
        break;
    }

    const query = start && end ? { createdAt: { $gte: start, $lte: end } } : {};

    const orders = await Order.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('productId')
      .sort({createdAt:-1});

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



const downloadSaleReport = async (req, res) => {
    try {
      const { startDate, endDate, reportType = 'custom', format } = req.query;
  
      let start = null, end = null;
  
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
            if (startDate === endDate) end.setHours(23, 59, 59, 999);
          }
          break;
        default:
          throw new Error('Invalid report type provided.');
      }
  
      const query = start && end ? { createdAt: { $gte: start, $lte: end } } : {};
  
      const orders = await Order.find(query).populate('productId').sort({createdAt :-1});
      if (!orders) {
        throw new Error('Failed to retrieve orders.');
      }
  
    
  
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
  
      if (format === 'pdf') {
        return generatePDFReport(orders, reportData, res);
      } else if (format === 'excel') {
        return generateExcelReport(orders, reportData, res);
      } else {
        throw new Error('Invalid format specified. Supported formats are pdf and excel.');
      }
  
    } catch (error) {
      console.error('Error generating sales report:', error);
  
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred while generating the sales report.'
      });
    }
  };
  




// Function to generate Excel report
const generateExcelReport = async (orders, reportData, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');
  
    // Report Summary
    sheet.addRow(['Total Sales', reportData.totalSales]);
    sheet.addRow(['Total Orders', reportData.totalOrders]);
    sheet.addRow(['Total Discount', reportData.totalDiscount]);
    sheet.addRow(['Total Coupon Deduction', reportData.totalCouponDeduction]);
    sheet.addRow([]);
  
    // Table Header
    sheet.addRow(['Order ID', 'Product Name', 'Quantity', 'Total Price']);
    
    // Populate the order rows
    orders.forEach(order => {
      sheet.addRow([
        order._id.toString(),
        order.productId.productName,
        order.quantity,
        order.finalTotalPriceWithAllDiscount,
      ]);
    });
  
    const fileName = `sales_report_${moment().format('YYYYMMDDHHmmss')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
    await workbook.xlsx.write(res);
    res.end();
  };





// Function to generate PDF report
const generatePDFReport = (orders, reportData, res) => {
    const doc = new PDFDocument();
    const fileName = `sales_report_${moment().format('YYYYMMDDHHmmss')}.pdf`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/pdf');
  
    doc.pipe(res);
  
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    // Report Summary
    doc.fontSize(12).text(`Total Sales: ₹${reportData.totalSales}`);
    doc.text(`Total Orders: ${reportData.totalOrders}`);
    doc.text(`Total Discount: ₹${reportData.totalDiscount}`);
    doc.text(`Total Coupon Deduction: ₹${reportData.totalCouponDeduction}`);
    doc.moveDown();
  
    // Orders Table
    doc.fontSize(15).text('Order Details', { underline: true });
    orders.forEach(order => {
      doc.moveDown();
      doc.fontSize(10).text(`Order ID: ${order._id}`);
      doc.text(`Product Name: ${order.productId.productName}`);
      doc.text(`Quantity: ${order.quantity}`);
      doc.text(`Total Price: ₹${order.finalTotalPriceWithAllDiscount}`);
    });
  
    doc.end();
  };
  




module.exports= {
    getSalesReport,
    downloadSaleReport
   
}