<?php
// ===============================
// DEBUG MODE (REMOVE IN PRODUCTION)
// ===============================
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ===============================
// CORS + HEADERS (IMPORTANT)
// ===============================
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    exit(0);
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// ===============================
// DB CONNECTION
// ===============================
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// ===============================
// 1. FETCH BUDGET HISTORY
// ===============================
if ($action === 'fetch') {

	//reset every month
    $sql = "
		SELECT * FROM budget_topups
		WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
		AND YEAR(created_at) = YEAR(CURRENT_DATE())
		ORDER BY created_at DESC
";

    $result = $conn->query($sql);

    $history = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $history[] = $row;
        }
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => $conn->error
        ]);
        exit;
    }

    echo json_encode($history);
    exit;
}

// ===============================
// 2. ADD BUDGET TOP-UP
// ===============================
if ($action === 'add') {

    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!isset($data['amount']) || $data['amount'] <= 0) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid amount"
        ]);
        exit;
    }

    $amount = (float)$data['amount'];

    $stmt = $conn->prepare(
        "INSERT INTO budget_topups (amount, created_at) VALUES (?, NOW())"
    );

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => $conn->error
        ]);
        exit;
    }

    $stmt->bind_param("d", $amount);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "insert_id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => $stmt->error
        ]);
    }

    $stmt->close();
    exit;
}




// ===============================
// INVALID ACTION
// ===============================
http_response_code(400);
echo json_encode([
    "status" => "error",
    "message" => "Invalid action"
]);
