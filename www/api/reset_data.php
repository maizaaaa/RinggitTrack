<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests (sometimes apps send an OPTIONS check first)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

// 1. Disable Foreign Key Checks
$conn->query("SET FOREIGN_KEY_CHECKS = 0");

// 2. Empty All Tables
$clean_transactions = $conn->query("TRUNCATE TABLE transactions");
$clean_budget = $conn->query("TRUNCATE TABLE budget_topups");
$clean_goals = $conn->query("TRUNCATE TABLE goals");

// 3. Re-enable Foreign Key Checks
$conn->query("SET FOREIGN_KEY_CHECKS = 1");

if ($clean_transactions && $clean_budget && $clean_goals) {
    echo json_encode(["status" => "success", "message" => "All data reset"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to reset data"]);
}
?>