<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة الحجز</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f0f2f5; margin: 20px; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 30px auto; padding: 30px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .form-group { margin-bottom: 18px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; color: #555; }
        input[type="text"], input[type="email"], input[type="date"], select, textarea {
            width: calc(100% - 22px); /* لتضمين البادينج */
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 1em;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        input[type="text"]:focus, input[type="email"]:focus, input[type="date"]:focus, select:focus, textarea:focus {
            border-color: #007bff;
            outline: none;
        }
        .submit-btn {
            background-color: #007bff;
            color: white;
            padding: 14px 25px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            width: 100%;
            transition: background-color 0.2s ease;
        }
        .submit-btn:hover { background-color: #0056b3; }
    </style>
</head>
<body>

    <div class="container">
        <h1>تفاصيل الحجز الخاص بك</h1>

        <form action="payment_page.php" method="POST">
            <div class="form-group">
                <label for="full_name">الاسم الكامل:</label>
                <input type="text" id="full_name" name="full_name" required placeholder="ادخل اسمك هنا">
            </div>

            <div class="form-group">
                <label for="email_address">البريد الإلكتروني:</label>
                <input type="email" id="email_address" name="email_address" required placeholder="example@domain.com">
            </div>

            <div class="form-group">
                <label for="service_type">نوع الخدمة:</label>
                <select id="service_type" name="service_type" required>
                    <option value="">اختر خدمة...</option>
                    <option value="استشارة فردية">استشارة فردية</option>
                    <option value="ورشة عمل">ورشة عمل</option>
                    <option value="جلسة علاج طبيعي">جلسة علاج طبيعي</option>
                </select>
            </div>

            <div class="form-group">
                <label for="booking_date">تاريخ الحجز المفضل:</label>
                <input type="date" id="booking_date" name="booking_date" required>
            </div>

            <div class="form-group">
                <label for="notes">ملاحظات إضافية (اختياري):</label>
                <textarea id="notes" name="notes" rows="4" placeholder="اكتب أي ملاحظات هنا..."></textarea>
            </div>

            <div class="form-group">
                <label for="booking_amount">المبلغ المستحق ($):</label>
                <input type="number" id="booking_amount" name="booking_amount" step="0.01" required placeholder="مثال: 50.00">
            </div>

            <button type="submit" class="submit-btn">متابعة إلى الدفع</button>
        </form>
    </div>

</body>
</html>