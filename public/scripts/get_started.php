<?php
$SG_API_KEY = getenv("SG_API_KEY");

// STORE FORM INPUTS
$organization_type = $_POST["organization-type"];
$sports = $_POST["sports"];
$solutions = $_POST["solutions"];
$size = $_POST["size"];
$organization_name = $_POST["organization-name"];
$role = $_POST["role"];
$name = $_POST["name"];
$email_address = $_POST["email"];
$phone_number = $_POST["phone-number"]; 
$del_date = $_POST["del-date"];

$sportList = "";
foreach($sports as $sport) {
    $sportList .= $sport.", ";
}
$sportList = mb_substr($sportList, 0, -2);

$solutionList = "";
foreach($solutions as $solution) {
    $solutionList .= $solution.", ";
}
$solutionList = mb_substr($solutionList, 0, -2);

require("sendgrid-php/sendgrid-php.php");

$email = new \SendGrid\Mail\Mail(); 
$email->setFrom("support@vssportswear.com", "$name");
$email->setSubject("Thanks for your Interest!");
$email->addTo("bryce@vssportswear.com", "Bryce Barrett");
$email->addCc("andy@vssportswear.com", "Andy Barrett");
$email->addCc("michael@vssportswear.com", "Michael Moore");
$email->addCc("tony@vssportswear.com", "Tony Norrie");
$email->addCc("afinch@vssportswear.com", "Ashle Finch");

$email->addContent("text/plain", 
"Organization Name: $organization_name
Organization type: $organization_type
Order Size: $size
Sports: $sports
Solutions: $solutions
Name: $name
Email: $email_address
Phone Number: $phone_number"
);

$email->addContent("text/html", 
"
<!DOCTYPE html>
<html>
    <head>
        <meta charset='UTF-8' />
        <style>
            body {
                line-height: 16px;
            }

            p {
                margin: 0;
                font-size: 16px;
                color: black;
            }

            h2 {
                margin-top: 0;
                font-size: 32px;
                color: black;
            }

        </style>
    </head>
    <body>
        <h2>Organization Details</h2>
        <p><strong>Organization Name:</strong> $organization_name</p><br />
        <p><strong>Organization type:</strong> $organization_type</p><br />
        <p><strong>Size:</strong> $size</p><br />
        <p><strong>Sports:</strong> $sportList</p><br />
        <p><strong>Solutions:</strong> $solutionList</p><br />
        <p><strong>Desired Delivery Date:</strong> $del_date</p><br /><br />
        <h2>Contact Details</h2>
        <p><strong>Name:</strong> $name</p><br />
        <p><strong>Email:</strong> $email_address</p><br />
        <p><strong>Phone Number:</strong> $phone_number</p>
    </body>
</html>"
);

// SEND FORM TO VERSUS EMAILS
$sendgrid = new \SendGrid($SG_API_KEY);
try {
    $response = $sendgrid->send($email);
    print $response->statusCode() . "\n";
    print_r($response->headers());
    print $response->body() . "\n";
} catch (Exception $e) {
    echo 'Caught exception: '. $e->getMessage() ."\n";
}

// PIPEDRIVE FUNCTIONS
$PD_API_KEY = '87ad50167ba735e7bc79865a7d83567e25fa1e21';
$PD_COMPANY_DOMAIN = 'versussportswear';

$PD_ORG_SEARCH_URL = 'https://'.$PD_COMPANY_DOMAIN.'.pipedrive.com/api/v1/organizations/search?api_token=' . $PD_API_KEY;
$PD_ORG_CREATE_URL = 'https://'.$PD_COMPANY_DOMAIN.'.pipedrive.com/api/v1/organizations?api_token=' . $PD_API_KEY;
$PD_PERSON_SEARCH_URL = 'https://'.$PD_COMPANY_DOMAIN.'.pipedrive.com/api/v1/persons/search?api_token=' . $PD_API_KEY;
$PD_PERSON_CREATE_URL = 'https://'.$PD_COMPANY_DOMAIN.'.pipedrive.com/api/v1/persons?api_token=' . $PD_API_KEY;
$PD_DEAL_CREATE_URL = 'https://'.$PD_COMPANY_DOMAIN.'.pipedrive.com/api/v1/deals?api_token=' . $PD_API_KEY;

// Create Organization unless it exists
//   1. Search for existing organization
$search_params = http_build_query([
    'term' => $organization_name,
    'fields' => 'name',
    'exact_match' => '1',
]);
$search_response = file_get_contents("$PD_ORG_SEARCH_URL?$search_params");
$search_result = json_decode($search_response, true);

//    2. Create new organization unless it exists
if ($search_result['data']['items']) {
    // Organization exists
    $org_id = $search_result['data']['items'][0]['item']['id'];
} else {
    // Create new organization
    //   1. Set labels
    $org_label = '';
    switch($organization_type) {
        case 'sports-organization':
            $org_label = 'Organization';
            break;
        case 'sports-team':
            $org_label = 'Team';
            break;
        case 'school':
            $org_label = 'School';
            break;
        case 'business':
            $org_label = 'Business';
            break;
        default:
            $org_label = 'TBD2';
    }

    //   2. Set Organization Data
    $organization_data = [
        'name' => $organization_name,
        '84066befa9d80788f2fe5a1f4d3a5038aef5b5ee' => $size,    // Size field
        '90f7bfe69d9ad26c92ea6fa78bbd05479d11e642' => $organization_name,   // Team Name field
        '1438f82097489f4c344f390c252d8870ba42b27e' => $sportList,      // Sports field
        'label_ids' => $org_label
    ];

    //   3. Send and check api request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $PD_ORG_CREATE_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $organization_data);
    echo 'Sending request...' . PHP_EOL;
    $output = curl_exec($ch);
    curl_close($ch);

    $org_result = json_decode($output, true);
    if (!empty($org_result['data']['id'])) {
        $org_id = $org_result['data']['id'];
    }
}

// Create Person unless it exists
//   1. Search for existing person
$search_params = http_build_query([
    'term' => $email_address,
    'fields' => 'email',
    'exact_match' => '1',
]);
$search_response = file_get_contents("$PD_PERSON_SEARCH_URL?$search_params");
$search_result = json_decode($search_response, true);

//    2. Create new person unless it exists
if ($search_result['data']['items']) {
    // Person exists
    $person_id = $search_result['data']['items'][0]['item']['id'];
} else {
    // Create new person
    //   1. Set Person Data
    $organization_data = [
        'name' => $name,
        'org_id' => $org_id,
        'email' => $email_address,
        'phone' => $phone_number,
        'ba47a7708361b7b8641af330bdb2533c7e58bc7d' => $sportList,      // Sports field
    ];

    //  2. Send and check api request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $PD_PERSON_CREATE_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $organization_data);
    $output = curl_exec($ch);
    curl_close($ch);

    $person_result = json_decode($output, true);
    if (!empty($person_result['data']['id'])) {
        $person_id = $person_result['data']['id'];
    }
}

// Create Deal
$deal_labels = $sportList . ", Versus Interest Lead Email";
$deal = array(
    'title' => $organization_name . " Deal",
    'label' => $deal_labels,
    'person_id' => $person_id,
    'org_id' => $org_id,
    'pipeline_id' => '2',
    'stage_id' => '6'
);

// Send API Request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $PD_DEAL_CREATE_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $deal);
 
$output = curl_exec($ch);
curl_close($ch);

// $result = json_decode($output, true);
// if (!empty($result['data']['id'])) {
// }

?>