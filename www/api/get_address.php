<?php
// File: api/get_address.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests (sometimes apps send an OPTIONS check first)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Check if coordinates are present
if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
    echo json_encode(["error" => "Missing coordinates"]);
    exit;
}

$lat = $_GET['lat'];
$lng = $_GET['lng'];

// 2. OpenStreetMap URL (Reverse Geocoding)
$url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1";

// 3. Setup cURL (The proxy mechanism)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// IMPORTANT: This specific header fixes the "403 Forbidden" error
// OpenStreetMap blocks requests without a User-Agent
curl_setopt($ch, CURLOPT_USERAGENT, "RinggitTrack_StudentProject/1.0");

// Disable SSL check for local development (prevents certificate errors)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

$response = curl_exec($ch);
curl_close($ch);

// 4. Send the data back to your Javascript
echo $response;
?>