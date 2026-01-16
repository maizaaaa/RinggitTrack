<?php
// 1. DISABLE HTML ERROR REPORTING (Prevents the "<br /> <b>" error)
error_reporting(0); 
ini_set('display_errors', 0);

// 2. HEADERS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// 3. LOG ERRORS TO FILE (Check debug_log.txt if this fails)
ini_set('log_errors', 1);
ini_set('error_log', 'debug_log.txt');

include 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// --- ADD BUDGET ---
if ($action === 'add' && $method === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!isset($data['amount'])) {
        echo json_encode(["status" => "error", "message" => "No amount provided"]);
        exit();
    }

    $amount = (float)$data['amount'];
    
    // Using 'budget_topups' table based on your SQL
    $stmt = $conn->prepare("INSERT INTO budget_topups (amount, created_at) VALUES (?, NOW())");
    
    if (!$stmt) {
        // Log the specific SQL error to debug_log.txt
        error_log("Prepare failed: " . $conn->error);
        echo json_encode(["status" => "error", "message" => "Database error (Check debug_log.txt)"]);
        exit();
    }

    $stmt->bind_param("d", $amount);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        error_log("Execute failed: " . $stmt->error);
        echo json_encode(["status" => "error", "message" => "Save failed"]);
    }
    exit();
}

// --- FETCH BUDGET ---
if ($action === 'fetch') {
    $result = $conn->query("SELECT * FROM budget_topups ORDER BY created_at DESC");
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data);
    exit();
}

echo json_encode(["status" => "error", "message" => "Invalid Action"]);
?>