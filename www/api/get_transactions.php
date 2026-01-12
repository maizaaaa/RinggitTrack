<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'db.php';

$sql = "SELECT * FROM transactions ORDER BY transaction_date DESC";
$result = $conn->query($sql);

$transactions = array();

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Reformat data to match your App's JSON structure
        $item = array(
            "id" => $row['id'],
            "item_name" => $row['item_name'],
            "amount" => floatval($row['amount']),
            "category" => $row['category'],
            "date" => $row['transaction_date'],
            "location" => array(
                "lat" => $row['lat'],
                "lng" => $row['lng'],
                "address" => $row['address']
            )
        );
        array_push($transactions, $item);
    }
}

echo json_encode($transactions);
$conn->close();
?>