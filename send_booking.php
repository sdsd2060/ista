<?php
header('Content-Type: application/json');

// Allow from any origin (for development, restrict in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit;
}

// Recipient email
$to = 'unitedhr8@gmail.com'; // Replace with your email address

// Subject
$subject = 'New Summer Camp Booking from Website';

// Build email content
$message = "<html><body>";
$message .= "<h2>New Booking Details:</h2>";
$message .= "<p><strong>Email:</strong> " . htmlspecialchars($data['user_email']) . "</p>";
$message .= "<p><strong>Phone Number:</strong> " . htmlspecialchars($data['country_code'] . $data['phone_number']) . "</p>";
$message .= "<p><strong>Number of Participants:</strong> " . htmlspecialchars($data['num_participants']) . "</p>";

if (isset($data['relationship_type'])) {
    $message .= "<p><strong>Relationship Type:</strong> " . htmlspecialchars($data['relationship_type']) . "</p>";
}

for ($i = 1; $i <= $data['num_participants']; $i++) {
    $message .= "<h3>Participant " . $i . ":</h3>";
    $message .= "<p><strong>Name:</strong> " . htmlspecialchars($data["participant_name_$i"]) . "</p>";
    $message .= "<p><strong>Age:</strong> " . htmlspecialchars($data["participant_age_$i"]) . "</p>";
    $message .= "<p><strong>Gender:</strong> " . htmlspecialchars($data["participant_gender_$i"]) . "</p>";
    $message .= "<p><strong>Nationality:</strong> " . htmlspecialchars($data["participant_nationality_$i"]) . "</p>";
}

$message .= "<p><strong>Total Price (USD):</strong> " . htmlspecialchars($data['total_price_usd']) . " USD</p>";
$message .= "<p><strong>Total Price (Local Currency):</strong> " . htmlspecialchars($data['total_price_local']) . " " . htmlspecialchars($data['local_currency_code']) . "</p>";
$message .= "<p><strong>Exchange Rate (USD to " . htmlspecialchars($data['local_currency_code']) . "):</strong> " . htmlspecialchars($data['exchange_rate_usd_to_local']) . "</p>";
$message .= "<p><strong>User IP Country:</strong> " . htmlspecialchars($data['user_ip_country']) . "</p>";
$message .= "<p><strong>Agreed to Terms:</strong> " . (isset($data['terms_agree']) ? 'Yes' : 'No') . "</p>";
$message .= "</body></html>";

// Headers for HTML email
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: no-reply@istanova.com" . "\r\n"; // Replace with your domain email

// Send email
if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Booking received successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send booking email.']);
}
?>