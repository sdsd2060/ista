<?php
// *** خطوة 1: التأكد من تحميل مكتبات Composer ***
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Google\Client as Google_Client;
use Google\Service\Sheets as Google_Service_Sheets;
use Google\Service\Sheets\ValueRange as Google_Service_Sheets_ValueRange;

// *** خطوة 2: التحقق من طريقة الطلب ***
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 2.1: استلام وتطهير بيانات الحجز والدفع من النموذج
    $full_name = filter_input(INPUT_POST, 'full_name', FILTER_SANITIZE_STRING);
    $email_address = filter_input(INPUT_POST, 'email_address', FILTER_SANITIZE_EMAIL);
    $service_type = filter_input(INPUT_POST, 'service_type', FILTER_SANITIZE_STRING);
    $booking_date = filter_input(INPUT_POST, 'booking_date', FILTER_SANITIZE_STRING);
    $notes = filter_input(INPUT_POST, 'notes', FILTER_SANITIZE_STRING);
    $booking_amount = filter_input(INPUT_POST, 'booking_amount', FILTER_VALIDATE_FLOAT);
    $timestamp = date('Y-m-d H:i:s'); // وقت وتاريخ استلام الطلب

    // 2.2: التحقق من صحة البيانات الأساسية
    if (!$full_name || !$email_address || !$service_type || !$booking_date || $booking_amount === false || $booking_amount < 0) {
        die("خطأ: بيانات الحجز غير مكتملة أو غير صالحة. يرجى العودة والمحاولة مرة أخرى.");
    }

    // ---------------------------------------------------------------------
    // *** خطوة 3: إرسال بريد إلكتروني باستخدام PHPMailer ***
    // ---------------------------------------------------------------------

    $mail = new PHPMailer(true);
    try {
        // 3.1: إعدادات خادم SMTP (قم بتغيير هذه القيم)
        $mail->isSMTP();
        $mail->Host       = 'smtp.yourdomain.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your_sending_email@example.com';
        $mail->Password   = 'YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';

        // 3.2: المستلمون والمُرسل
        $mail->setFrom('no-reply@yourdomain.com', 'موقعك الإلكتروني');
        $mail->addAddress('your_recipient_email@example.com', 'مسؤول الموقع');
        // يمكنك إرسال نسخة للعميل أيضًا
        // $mail->addAddress($email_address, $full_name);

        // 3.3: محتوى الرسالة (الآن تتضمن تفاصيل الحجز)
        $mail->isHTML(true);
        $mail->Subject = 'حجز جديد ' . $service_type . ' من ' . $full_name;
        $mail->Body    = "
            <h1>تفاصيل الحجز الجديد</h1>
            <p>تم استلام حجز جديد من موقعك الإلكتروني:</p>
            <ul>
                <li><strong>الاسم الكامل:</strong> " . htmlspecialchars($full_name) . "</li>
                <li><strong>البريد الإلكتروني:</strong> " . htmlspecialchars($email_address) . "</li>
                <li><strong>نوع الخدمة:</strong> " . htmlspecialchars($service_type) . "</li>
                <li><strong>تاريخ الحجز المفضل:</strong> " . htmlspecialchars($booking_date) . "</li>
                <li><strong>ملاحظات العميل:</strong> " . (empty($notes) ? 'لا توجد' : htmlspecialchars($notes)) . "</li>
                <li><strong>المبلغ المستحق:</strong> $" . number_format($booking_amount, 2) . "</li>
                <li><strong>تاريخ ووقت استلام الطلب:</strong> " . $timestamp . "</li>
            </ul>
            <p>يرجى التحقق من لوحة تحكم PayPal أو Google Sheet للمزيد من التفاصيل حول حالة الدفع.</p>
        ";
        $mail->AltBody = "تفاصيل الحجز الجديد:\nالاسم الكامل: {$full_name}\nالبريد الإلكتروني: {$email_address}\nنوع الخدمة: {$service_type}\nتاريخ الحجز المفضل: {$booking_date}\nملاحظات العميل: " . (empty($notes) ? 'لا توجد' : $notes) . "\nالمبلغ المستحق: \${$booking_amount}\nتاريخ ووقت استلام الطلب: {$timestamp}\n\nيرجى التحقق من لوحة تحكم PayPal أو Google Sheet للمزيد من التفاصيل.";

        $mail->send();
        echo '<p style="color: green; text-align: center;">✓ تم إرسال تفاصيل الحجز والطلب بالبريد الإلكتروني بنجاح.</p>';
    } catch (Exception $e) {
        echo '<p style="color: red; text-align: center;">✗ حدث خطأ أثناء إرسال البريد الإلكتروني: ' . $mail->ErrorInfo . '</p>';
    }

    // ---------------------------------------------------------------------
    // *** خطوة 4: إرسال البيانات إلى Google Sheet ***
    // ---------------------------------------------------------------------

    // 4.1: تحديد مسار ملف مفتاح حساب الخدمة (قم بتغيير هذا المسار!)
    $serviceAccountKeyPath = __DIR__ . '/path/to/your/service-account-key.json';

    if (!file_exists($serviceAccountKeyPath)) {
        die('<p style="color: red; text-align: center;">✗ خطأ: ملف مفتاح حساب خدمة Google غير موجود.</p>');
    }

    putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $serviceAccountKeyPath);

    try {
        // 4.2: إعداد عميل Google API
        $client = new Google_Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google_Service_Sheets::SPREADSHEETS);

        // 4.3: إنشاء خدمة Google Sheets API
        $service = new Google_Service_Sheets($client);

        // 4.4: تحديد معرف ورقة Google Sheet والنطاق
        $spreadsheetId = '1qqVmfViF6K2FPyOGcZAkehsZJW0ISyUpr91jqrEg7GM';
        $range = 'Sheet1!A:Z'; // تأكد أن هذا النطاق صحيح في Google Sheet الخاص بك

        // 4.5: إعداد البيانات المراد إضافتها (تتضمن الآن تفاصيل الحجز)
        // تأكد من ترتيب هذه الأعمدة لتتناسب مع الأعمدة في Google Sheet الخاص بك.
        // مثلاً: [الاسم، البريد، الخدمة، تاريخ الحجز، الملاحظات، المبلغ، وقت الاستلام، حالة الدفع]
        $values = [
            [
                htmlspecialchars($full_name),
                htmlspecialchars($email_address),
                htmlspecialchars($service_type),
                htmlspecialchars($booking_date),
                htmlspecialchars($notes),
                number_format($booking_amount, 2),
                $timestamp,
                'Pending Payment / Manual Check' // حالة مبدئية، ستحتاج لـ Webhooks لتحديثها
            ]
        ];

        $body = new Google_Service_Sheets_ValueRange([
            'values' => $values
        ]);

        $params = [
            'valueInputOption' => 'RAW'
        ];

        // 4.6: إضافة الصف إلى Google Sheet
        $result = $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);
        printf('<p style="color: green; text-align: center;">✓ تمت إضافة تفاصيل الحجز إلى Google Sheet بنجاح. تم تحديث %d خلايا.</p>', $result->getUpdates()->getUpdatedCells());

    } catch (Google\Service\Exception $e) {
        echo '<p style="color: red; text-align: center;">✗ حدث خطأ في Google Sheet API: ' . $e->getMessage() . '</p>';
    } catch (Exception $e) {
        echo '<p style="color: red; text-align: center;">✗ حدث خطأ عام: ' . $e->getMessage() . '</p>';
    }

    echo '<p style="text-align: center; margin-top: 30px;">شكرًا لك على حجزك! سيتم مراجعة طلبك والتواصل معك قريبًا.</p>';
    echo '<p style="text-align: center;"><a href="booking_page.php" style="color: #007bff; text-decoration: none;">العودة لصفحة الحجز</a></p>';


} else {
    echo '<p style="color: orange; text-align: center;">لا يمكن الوصول إلى هذه الصفحة مباشرة. يرجى إرسال النموذج من صفحة الحجز.</p>';
    header('Location: booking_page.php'); // إعادة توجيه لصفحة الحجز
    exit();
}
?>