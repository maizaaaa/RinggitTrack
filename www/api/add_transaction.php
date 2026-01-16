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

// 1. Get the JSON data sent from app.js
$json = file_get_contents("php://input");
$data = json_decode($json);

// 2. Check if data exists
if(isset($data->item_name) && isset($data->amount)) {
    
    // 3. Prepare SQL Statement (Prevents SQL Injection)
    $stmt = $conn->prepare("INSERT INTO transactions (item_name, amount, category, transaction_date, lat, lng, address) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Bind parameters (s = string, d = double/decimal)
    $stmt->bind_param("sdsssss", 
        $data->item_name, 
        $data->amount, 
        $data->category, 
        $data->date, 
        $data->location->lat, 
        $data->location->lng, 
        $data->location->address
    );

    // 4. Execute and Respond
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}

$conn->close();
?>