<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); 

include 'db.php';

$data = json_decode(file_get_contents("php://input"));

// Check if ID and Item Name exist
if(isset($data->id) && isset($data->item_name)) {

    // SQL Update Query
    $sql = "UPDATE transactions SET 
            item_name=?, amount=?, category=?, transaction_date=?, lat=?, lng=?, address=? 
            WHERE id=?";

    $stmt = $conn->prepare($sql);
    
    // Bind parameters (s=string, d=double, i=integer)
    $stmt->bind_param("sdsssssi", 
        $data->item_name, 
        $data->amount, 
        $data->category, 
        $data->date, 
        $data->location->lat, 
        $data->location->lng, 
        $data->location->address,
        $data->id // The ID is the WHERE clause
    );

    if($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Missing Data"]);
}

$conn->close();
?>