<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة الدفع الآمنة</title>

    <script
        src="https://www.paypal.com/sdk/js?client-id=BAAR53-Q3Fo3xAE9DRfKqIWPI7ErlaSOHo4sjvAERL0oFoF435VaOUEdf4PYXd3O1vGSLmxjK05v7FJViw&components=hosted-buttons&disable-funding=venmo&currency=USD">
    </script>

    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 20px;
            color: #333;
            direction: rtl; /* لدعم اللغة العربية */
            text-align: right;
        }
        h1, h2, h3 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 25px;
        }
        .payment-form-container {
            max-width: 600px;
            margin: 30px auto;
            padding: 30px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #555;
            font-size: 0.95em;
        }
        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="number"] {
            width: calc(100% - 22px); /* خصم البادينج والحدود */
            padding: 12px;
            border: 1px solid #dcdcdc;
            border-radius: 8px;
            font-size: 1em;
            box-sizing: border-box; /* يضمن أن العرض يشمل البادينج والحدود */
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-group input[type="text"]:focus,
        .form-group input[type="email"]:focus,
        .form-group input[type="number"]:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
            outline: none;
        }
        .submit-button {
            background-color: #28a745;
            color: white;
            padding: 15px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            width: 100%;
            transition: background-color 0.3s ease;
        }
        .submit-button:hover {
            background-color: #218838;
        }
        hr {
            border: 0;
            height: 1px;
            background-color: #eee;
            margin: 30px 0;
        }

        /* PayPal Button Specific Styles */
        .pp-W3G4VFWKPBTUY {
            text-align: center;
            border: none;
            border-radius: 0.25rem;
            min-width: 11.625rem;
            padding: 0 2rem;
            height: 2.625rem;
            font-weight: bold;
            background-color: #FFD140; /* لون PayPal الذهبي */
            color: #000000;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 1rem;
            line-height: 2.625rem; /* لجعل النص يتوسط الزر عموديًا */
            cursor: pointer;
            text-decoration: none;
            display: inline-block; /* لضمان تطبيق العرض الصحيح */
            transition: background-color 0.2s ease;
        }
        .pp-W3G4VFWKPBTUY:hover {
            background-color: #e6b800; /* لون أغمق عند التمرير */
        }
        .paypal-logo-section {
            font-size: 0.75rem;
            color: #777;
            margin-top: 0.5rem;
            text-align: center;
        }
        .paypal-logo-section img {
            height: 0.875rem;
            vertical-align: middle;
            margin-right: 3px;
        }
        .paypal-container {
            text-align: center; /* لتوسيط زر PayPal */
            margin-bottom: 25px;
        }
        .booking-details {
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .booking-details p {
            margin-bottom: 10px;
            line-height: 1.6;
            color: #444;
        }
        .booking-details strong {
            color: #2c3e50;
        }
    </style>
</head>
<body>

    <?php
    // *** استقبال البيانات من صفحة الحجز (booking_page.php) ***
    // نستخدم filter_input للحصول على البيانات بأمان وتطهيرها.
    // هذه البيانات تأتي من نموذج POST في booking_page.php.
    $full_name = filter_input(INPUT_POST, 'full_name', FILTER_SANITIZE_STRING);
    $email_address = filter_input(INPUT_POST, 'email_address', FILTER_SANITIZE_EMAIL);
    $service_type = filter_input(INPUT_POST, 'service_type', FILTER_SANITIZE_STRING);
    $booking_date = filter_input(INPUT_POST, 'booking_date', FILTER_SANITIZE_STRING);
    $notes = filter_input(INPUT_POST, 'notes', FILTER_SANITIZE_STRING);
    $booking_amount = filter_input(INPUT_POST, 'booking_amount', FILTER_VALIDATE_FLOAT);

    // التحقق من أن البيانات الأساسية موجودة (يمكنك إضافة المزيد من التحقق هنا)
    if (!$full_name || !$email_address || !$service_type || !$booking_date || $booking_amount === false || $booking_amount < 0) {
        echo '<div class="payment-form-container" style="color: red; text-align: center;">';
        echo '<h1>خطأ في بيانات الحجز!</h1>';
        echo '<p>يبدو أن هناك مشكلة في البيانات المرسلة من صفحة الحجز. يرجى العودة والمحاولة مرة أخرى.</p>';
        echo '<a href="booking_page.php" style="color: #007bff; text-decoration: none;">العودة لصفحة الحجز</a>';
        echo '</div>';
        exit(); // إيقاف التنفيذ إذا كانت البيانات غير صالحة
    }
    ?>

    <h1>استكمال عملية الدفع</h1>

    <div class="payment-form-container">
        <div class="booking-details">
            <h2>تفاصيل الحجز الخاص بك:</h2>
            <p><strong>الاسم:</strong> <?php echo htmlspecialchars($full_name); ?></p>
            <p><strong>البريد الإلكتروني:</strong> <?php echo htmlspecialchars($email_address); ?></p>
            <p><strong>نوع الخدمة:</strong> <?php echo htmlspecialchars($service_type); ?></p>
            <p><strong>تاريخ الحجز:</strong> <?php echo htmlspecialchars($booking_date); ?></p>
            <p><strong>الملاحظات:</strong> <?php echo htmlspecialchars($notes); ?></p>
            <p><strong>المبلغ المستحق:</strong> $<span style="font-size: 1.2em; color: #28a745; font-weight: bold;"><?php echo number_format($booking_amount, 2); ?></span></p>
        </div>

        <hr>

        <h2>الرجاء اختيار طريقة الدفع:</h2>

        <form action="process_payment.php" method="POST">
            <input type="hidden" name="full_name" value="<?php echo htmlspecialchars($full_name); ?>">
            <input type="hidden" name="email_address" value="<?php echo htmlspecialchars($email_address); ?>">
            <input type="hidden" name="service_type" value="<?php echo htmlspecialchars($service_type); ?>">
            <input type="hidden" name="booking_date" value="<?php echo htmlspecialchars($booking_date); ?>">
            <input type="hidden" name="notes" value="<?php echo htmlspecialchars($notes); ?>">
            <input type="hidden" name="booking_amount" value="<?php echo htmlspecialchars($booking_amount); ?>">

            <div class="form-group">
                <label for="customer_name_display">الاسم (للتأكيد):</label>
                <input type="text" id="customer_name_display" value="<?php echo htmlspecialchars($full_name); ?>" readonly>
            </div>
            <div class="form-group">
                <label for="customer_email_display">البريد الإلكتروني (للتأكيد):</label>
                <input type="email" id="customer_email_display" value="<?php echo htmlspecialchars($email_address); ?>" readonly>
            </div>
            <div class="form-group">
                <label for="amount_display">المبلغ ($) (للتأكيد):</label>
                <input type="number" id="amount_display" value="<?php echo number_format($booking_amount, 2); ?>" step="0.01" readonly>
            </div>

            <hr>

            <h3>الدفع بواسطة PayPal (موصى به)</h3>
            <div id="paypal-container-W3G4VFWKPBTUY" class="paypal-container"></div>
            <script>
                // قم بتشغيل PayPal Hosted Buttons بعد تحميل الصفحة
                paypal.HostedButtons({
                    hostedButtonId: "W3G4VFWKPBTUY", // هذا هو ID الزر الذي أنشأته في حساب PayPal الخاص بك
                }).render("#paypal-container-W3G4VFWKPBTUY");
            </script>

            <hr>

            <h3 style="margin-top: 30px;">أو قم بتأكيد طلبك (هذا لن يرسل الدفع لـ PayPal مباشرة):</h3>
            <button type="submit" class="submit-button">تأكيد الحجز وإرسال التفاصيل</button>
        </form>
    </div>

</body>
</html>