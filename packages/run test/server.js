require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

const app = express();

// Hàm sắp xếp tham số đúng chuẩn VNPAY
function sortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj).map(key => encodeURIComponent(key));
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// 1. Route tạo link thanh toán
app.get('/create_payment', (req, res) => {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');
    const amount = 50000; // Số tiền: 50,000 VND

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': process.env.VNP_TMN_CODE,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': 'Thanh toan don hang:' + orderId,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': process.env.VNP_RETURN_URL,
        'vnp_IpAddr': '127.0.0.1',
        'vnp_CreateDate': createDate
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    vnp_Params['vnp_SecureHash'] = signed;
    const finalUrl = process.env.VNP_URL + '?' + qs.stringify(vnp_Params, { encode: false });

    res.json({ paymentUrl: finalUrl });
});

// 2. Route nhận kết quả trả về
app.get('/vnpay_return', (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === checkHash) {
        res.send(vnp_Params['vnp_ResponseCode'] === '00' 
            ? "Thanh toán thành công!" 
            : "Thanh toán thất bại!");
    } else {
        res.send("Sai chữ ký!");
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server chạy tại: http://localhost:${process.env.PORT}`);
});